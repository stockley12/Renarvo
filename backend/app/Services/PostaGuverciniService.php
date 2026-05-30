<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin client for the Posta Güvercini JSON OTP SMS API.
 *
 * Endpoint (per the provided Postman collection):
 *   POST {base_url}/v1/Sms/Send_1_N
 *   body: { "Message": "...", "Receivers": ["905..."], "Username": "...", "Password": "..." }
 *   success: StatusCode == 200
 *
 * Receiver numbers must be in international format without a leading "+"
 * (e.g. 905320000000).
 */
class PostaGuverciniService
{
    public function mode(): string
    {
        return (string) config('services.postaguvercini.mode', 'disabled');
    }

    public function isEnabled(): bool
    {
        return $this->mode() === 'live'
            && (string) config('services.postaguvercini.username') !== ''
            && (string) config('services.postaguvercini.password') !== '';
    }

    /**
     * Normalise a Turkish/intl phone number to the bare "90XXXXXXXXXX" form
     * the gateway expects. Returns null when the input cannot be a valid
     * mobile number.
     */
    public function normalizePhone(string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        // Strip international "00" prefix.
        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        // National leading zero (0532...) -> drop it.
        if (str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        // Bare 10-digit mobile (532...) -> prepend country code.
        if (strlen($digits) === 10 && str_starts_with($digits, '5')) {
            $digits = '90'.$digits;
        }

        // Expect Turkish mobile: 90 + 10 digits starting with 5.
        if (strlen($digits) === 12 && str_starts_with($digits, '905')) {
            return $digits;
        }

        // Allow other valid-looking international numbers (>= 11 digits).
        if (strlen($digits) >= 11 && strlen($digits) <= 15) {
            return $digits;
        }

        return null;
    }

    /**
     * Send a single SMS to one receiver. Returns true on provider acceptance.
     * In 'disabled' mode the message is logged and treated as sent so the
     * OTP flow remains testable before credentials are configured.
     */
    public function sendSms(string $receiver, string $message): bool
    {
        if (! $this->isEnabled()) {
            Log::info('PostaGuvercini disabled — SMS not sent', [
                'receiver' => $receiver,
                'message' => $message,
            ]);

            return true;
        }

        $base = rtrim((string) config('services.postaguvercini.base_url'), '/');
        $timeout = (int) config('services.postaguvercini.http_timeout', 15);

        try {
            $resp = Http::timeout($timeout)
                ->acceptJson()
                ->asJson()
                ->post($base.'/v1/Sms/Send_1_N', [
                    'Message' => $message,
                    'Receivers' => [$receiver],
                    'Username' => (string) config('services.postaguvercini.username'),
                    'Password' => (string) config('services.postaguvercini.password'),
                ]);

            $body = $resp->json();
            $status = (int) ($body['StatusCode'] ?? 0);

            if ($resp->successful() && $status === 200) {
                return true;
            }

            Log::warning('PostaGuvercini SMS send failed', [
                'http_status' => $resp->status(),
                'status_code' => $status,
                'description' => $body['StatusDescription'] ?? null,
                'receiver' => $receiver,
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('PostaGuvercini SMS exception', [
                'error' => $e->getMessage(),
                'receiver' => $receiver,
            ]);

            return false;
        }
    }
}
