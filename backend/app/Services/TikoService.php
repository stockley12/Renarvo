<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Thin client for the TIKO Sanal POS gateway (Figensoft, v1.1.3).
 *
 * Implementation notes (per spec):
 * - All payloads are signed with HMAC-SHA256(secret, hashStr.password) and
 *   base64-encoded.
 * - Every endpoint has its own hashStr formula. Strings are concatenated
 *   with NO separators; null values become "" (per spec).
 * - The gateway only accepts TRY. Pricing must be converted before reaching
 *   this service.
 * - OrderId must be globally unique forever per merchant — we always mint
 *   a fresh UUID per attempt (one Payment row = one OrderId).
 */
class TikoService
{
    public function __construct(private readonly AuditService $audit) {}

    public function mode(): string
    {
        return (string) config('services.tiko.mode', 'disabled');
    }

    public function isEnabled(): bool
    {
        return in_array($this->mode(), ['sandbox', 'live'], true)
            && (string) config('services.tiko.merchant_id') !== ''
            && (string) config('services.tiko.secret') !== ''
            && (string) config('services.tiko.password') !== '';
    }

    public function isTestFlag(): string
    {
        return $this->mode() === 'sandbox' ? '1' : '0';
    }

    private function baseUrl(): string
    {
        return $this->mode() === 'live'
            ? (string) config('services.tiko.live_base')
            : (string) config('services.tiko.sandbox_base');
    }

    private function endpoint(string $key): string
    {
        $path = (string) (config('services.tiko.paths.'.$key) ?? '');
        if ($path === '') {
            throw new RuntimeException("TIKO endpoint key '{$key}' is not configured");
        }
        return rtrim($this->baseUrl(), '/').$path;
    }

    /**
     * Generate a TIKO hash given the per-endpoint payload string.
     *
     *   hash = base64(hmac_sha256(secret, hashStr . password, raw_output: true))
     */
    public function generateHash(string $hashStr): string
    {
        $secret = (string) config('services.tiko.secret');
        $password = (string) config('services.tiko.password');
        return base64_encode(hash_hmac('sha256', $hashStr.$password, $secret, true));
    }

    /**
     * Verify an incoming hash against an expected hashStr.
     */
    public function verifyHash(string $hashStr, ?string $providedHash): bool
    {
        if ($providedHash === null || $providedHash === '') {
            return false;
        }
        $expected = $this->generateHash($hashStr);
        return hash_equals($expected, $providedHash);
    }

    /**
     * Format an integer kuruş amount to the "###.##" form TIKO requires.
     */
    public function formatAmount(int|float $amountTry): string
    {
        return number_format((float) $amountTry, 2, '.', '');
    }

    /**
     * Mint an OrderId that will be globally unique for our merchant forever.
     */
    public function mintOrderId(int $reservationId): string
    {
        return 'RNV-'.$reservationId.'-'.strtoupper(Str::random(10));
    }

    /**
     * Initiate the 3DS hosted iframe flow (TIKO `onus3D`).
     *
     * Returns the redirect URL to embed inside an iframe and updates the
     * Payment row with sent payload + sync response.
     *
     * @return array{ url: string, order_id: string, payment: Payment }
     */
    public function createIframeLink(Reservation $reservation, Payment $payment, string $userIp): array
    {
        if (! $this->isEnabled()) {
            throw new RuntimeException('TIKO integration is not enabled.');
        }

        $merchantId = (string) config('services.tiko.merchant_id');
        $orderId = $payment->order_id ?: $this->mintOrderId($reservation->id);
        $amount = $this->formatAmount((int) $payment->amount_try);
        $currency = (string) config('services.tiko.currency', 'TRY');
        $isTest = $this->isTestFlag();

        $urlOk = (string) config('services.tiko.urls.return_ok');
        $urlFail = (string) config('services.tiko.urls.return_fail');

        // hashStr for onus3D request (v1.1.3):
        //   MerchantId + OrderId + UrlOk + UrlFail + Amount + Currency + IsTest
        $hashStr = $merchantId.$orderId.$urlOk.$urlFail.$amount.$currency.$isTest;
        $hash = $this->generateHash($hashStr);

        $payload = [
            'MerchantId' => $merchantId,
            'OrderId' => $orderId,
            'Amount' => $amount,
            'Currency' => $currency,
            'UrlOk' => $urlOk,
            'UrlFail' => $urlFail,
            'IsTest' => $isTest,
            'UserIp' => $userIp,
            'Hash' => $hash,
        ];

        $url = $this->endpoint('onus3d');
        $resp = Http::asForm()
            ->timeout((int) config('services.tiko.http_timeout', 20))
            ->post($url, $payload);

        $body = $this->safeJson($resp->body());
        $payment->fill([
            'order_id' => $orderId,
            'raw_request' => $payload,
            'raw_response' => $body,
        ])->save();

        $this->audit->log(
            'tiko.checkout.initiated',
            null,
            'Payment',
            $payment->id,
            ['reservation_id' => $reservation->id, 'order_id' => $orderId, 'http_status' => $resp->status()],
            'info',
        );

        if (! $resp->ok()) {
            throw new RuntimeException('TIKO onus3D HTTP error: '.$resp->status());
        }

        $iframeUrl = $body['Url'] ?? $body['url'] ?? null;
        if (! is_string($iframeUrl) || $iframeUrl === '') {
            throw new RuntimeException('TIKO did not return an iframe URL: '.json_encode($body));
        }

        return ['url' => $iframeUrl, 'order_id' => $orderId, 'payment' => $payment];
    }

    /**
     * Poll the gateway for the final payment outcome.
     *
     * Returns one of: 'paid', 'cancelled', 'pending', 'failed'.
     *
     * @return array{ status: string, raw: array<string,mixed>, hash_ok: bool }
     */
    public function queryStatus(Payment $payment): array
    {
        if (! $this->isEnabled()) {
            throw new RuntimeException('TIKO integration is not enabled.');
        }

        $merchantId = (string) config('services.tiko.merchant_id');
        $orderId = (string) $payment->order_id;
        if ($orderId === '') {
            throw new RuntimeException('Payment has no order_id; nothing to query.');
        }

        // hashStr for status request: MerchantId + OrderId
        $hash = $this->generateHash($merchantId.$orderId);
        $payload = [
            'MerchantId' => $merchantId,
            'OrderId' => $orderId,
            'Hash' => $hash,
        ];

        $resp = Http::asForm()
            ->timeout((int) config('services.tiko.http_timeout', 20))
            ->post($this->endpoint('status'), $payload);

        $body = $this->safeJson($resp->body());
        $payment->raw_status_query = $body;
        $payment->save();

        // Verify response hash if TIKO returned one
        $hashOk = false;
        $tikoStatus = (string) ($body['Status'] ?? '');
        $amount = (string) ($body['Amount'] ?? $this->formatAmount((int) $payment->amount_try));
        $currency = (string) ($body['Currency'] ?? config('services.tiko.currency', 'TRY'));
        $installment = (string) ($body['Installment'] ?? (string) ($payment->installment ?? 0));
        $transId = (string) ($body['TransId'] ?? '');

        if (isset($body['Hash'])) {
            //   MerchantId + OrderId + Amount + Currency + Installment + Status + TransId
            $expected = $merchantId.$orderId.$amount.$currency.$installment.$tikoStatus.$transId;
            $hashOk = $this->verifyHash($expected, (string) $body['Hash']);
        }

        $logical = match ($tikoStatus) {
            '200' => 'paid',
            '201' => 'cancelled',
            '100' => 'pending',
            default => 'failed',
        };

        $this->audit->log(
            'tiko.status.queried',
            null,
            'Payment',
            $payment->id,
            ['order_id' => $orderId, 'tiko_status' => $tikoStatus, 'logical' => $logical, 'hash_ok' => $hashOk],
            'info',
        );

        return ['status' => $logical, 'raw' => $body, 'hash_ok' => $hashOk];
    }

    /**
     * Cancel or partially refund a captured payment.
     *
     * @param int|null $amountTry Optional amount in TRY units (omit for full cancel)
     */
    public function cancel(Payment $payment, ?int $amountTry = null): array
    {
        if (! $this->isEnabled()) {
            throw new RuntimeException('TIKO integration is not enabled.');
        }
        $merchantId = (string) config('services.tiko.merchant_id');
        $orderId = (string) $payment->order_id;
        if ($orderId === '') {
            throw new RuntimeException('Payment has no order_id; nothing to cancel.');
        }

        // hashStr for cancel/refund request: MerchantId + OrderId
        $hash = $this->generateHash($merchantId.$orderId);
        $payload = [
            'MerchantId' => $merchantId,
            'OrderId' => $orderId,
            'Hash' => $hash,
        ];
        if ($amountTry !== null) {
            $payload['Amount'] = $this->formatAmount($amountTry);
        }

        $resp = Http::asForm()
            ->timeout((int) config('services.tiko.http_timeout', 20))
            ->post($this->endpoint('cancel'), $payload);

        $body = $this->safeJson($resp->body());

        $this->audit->log(
            'tiko.cancel.requested',
            null,
            'Payment',
            $payment->id,
            ['order_id' => $orderId, 'http_status' => $resp->status(), 'amount_try' => $amountTry],
            'info',
        );

        return $body;
    }

    /**
     * Validate a callback POST from TIKO.
     *
     * @return array{ ok: bool, status: string, hash_ok: bool, raw: array<string,mixed> }
     */
    public function verifyCallback(array $payload): array
    {
        $merchantId = (string) config('services.tiko.merchant_id');
        $orderId = (string) ($payload['OrderId'] ?? '');
        $amount = (string) ($payload['Amount'] ?? '');
        $currency = (string) ($payload['Currency'] ?? '');
        $installment = (string) ($payload['Installment'] ?? '0');
        $status = (string) ($payload['Status'] ?? '');
        $transId = (string) ($payload['TransId'] ?? '');
        $providedHash = (string) ($payload['Hash'] ?? '');

        // Callback hash: MerchantId + OrderId + Amount + Currency + Installment + Status + TransId
        $hashStr = $merchantId.$orderId.$amount.$currency.$installment.$status.$transId;
        $hashOk = $this->verifyHash($hashStr, $providedHash);

        $logical = match ($status) {
            '200' => 'paid',
            '201' => 'cancelled',
            '100' => 'pending',
            default => 'failed',
        };

        if (! $hashOk) {
            $this->audit->log(
                'tiko.callback.rejected_hash',
                null,
                'Payment',
                null,
                ['order_id' => $orderId, 'status' => $status],
                'warning',
            );
        }

        return ['ok' => $hashOk, 'status' => $logical, 'hash_ok' => $hashOk, 'raw' => $payload];
    }

    private function safeJson(string $text): array
    {
        if ($text === '') return [];
        try {
            $decoded = json_decode($text, true, flags: JSON_THROW_ON_ERROR);
            return is_array($decoded) ? $decoded : ['_raw' => $text];
        } catch (\Throwable $e) {
            Log::warning('TIKO returned non-JSON body', ['snippet' => substr($text, 0, 256)]);
            return ['_raw' => $text];
        }
    }
}
