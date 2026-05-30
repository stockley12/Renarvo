<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\AuditService;
use App\Services\TikoService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TikoController extends Controller
{
    public function __construct(
        private readonly TikoService $tiko,
        private readonly AuditService $audit,
    ) {}

    /**
     * GET /payments/tiko/config — public, advertises whether checkout is open.
     */
    public function config(): JsonResponse
    {
        return response()->json([
            'data' => [
                'mode' => $this->tiko->mode(),
                'enabled' => $this->tiko->isEnabled(),
                'currency' => (string) config('services.tiko.currency', 'TRY'),
            ],
        ]);
    }

    /**
     * POST /me/reservations/{reservation}/checkout/tiko
     *
     * Authenticated customer asks the gateway for a fresh 3DS iframe URL.
     * Creates a Payment row per attempt (each attempt = unique OrderId).
     */
    public function checkout(Request $request, int $reservation): JsonResponse
    {
        if (! $this->tiko->isEnabled()) {
            return response()->json([
                'error' => ['code' => 'TIKO_DISABLED', 'message' => 'Online payment is not currently available.'],
            ], 503);
        }

        $reservationModel = Reservation::query()
            ->where('customer_id', $request->user()->id)
            ->findOrFail($reservation);

        if (! in_array($reservationModel->status, [Reservation::STATUS_PENDING], true)) {
            throw ValidationException::withMessages([
                'reservation' => 'This reservation is not awaiting payment.',
            ]);
        }
        if ($reservationModel->payment_status === Reservation::PAYMENT_PAID) {
            return response()->json([
                'error' => ['code' => 'ALREADY_PAID', 'message' => 'Reservation already paid.'],
            ], 409);
        }

        $amountTry = (int) $reservationModel->total_price;
        if ($amountTry <= 0) {
            throw ValidationException::withMessages(['amount' => 'Reservation total is invalid.']);
        }

        $payment = Payment::query()->create([
            'reservation_id' => $reservationModel->id,
            'company_id' => $reservationModel->company_id,
            'provider' => 'tiko',
            'method' => 'card_3ds',
            'amount' => $amountTry,
            'amount_try' => $amountTry,
            'currency' => (string) config('services.tiko.currency', 'TRY'),
            'installment' => 1,
            'status' => Payment::STATUS_PENDING,
        ]);

        try {
            $result = $this->tiko->createIframeLink($reservationModel, $payment, (string) $request->ip());
        } catch (\Throwable $e) {
            $payment->status = Payment::STATUS_FAILED;
            $payment->error_msg = substr($e->getMessage(), 0, 250);
            $payment->save();
            Log::error('TIKO checkout failed', ['reservation_id' => $reservationModel->id, 'err' => $e->getMessage()]);
            return response()->json([
                'error' => ['code' => 'TIKO_CHECKOUT_FAILED', 'message' => 'Could not initiate payment. Please try again.'],
            ], 502);
        }

        $reservationModel->payment_status = Reservation::PAYMENT_PENDING;
        $reservationModel->current_payment_id = $payment->id;
        $reservationModel->save();

        return response()->json([
            'data' => [
                'iframe_url' => $result['url'],
                'order_id' => $result['order_id'],
                'payment_id' => $payment->id,
                'reservation_id' => $reservationModel->id,
                'amount_try' => $amountTry,
                'mode' => $this->tiko->mode(),
            ],
        ]);
    }

    /**
     * POST /payments/tiko/callback (server-to-server, no auth)
     *
     * TIKO POSTs the final outcome here. We MUST verify the hash before
     * trusting the payload.
     */
    public function callback(Request $request): Response
    {
        TenantContext::clear();

        $allowed = (array) config('services.tiko.allow_callback_ips', []);
        if (! empty($allowed) && ! in_array($request->ip(), $allowed, true)) {
            $this->audit->log('tiko.callback.rejected_ip', null, 'Payment', null, [
                'ip' => $request->ip(),
            ], 'warning');
            return response('FORBIDDEN', 403);
        }

        $payload = $request->all();
        $verification = $this->tiko->verifyCallback($payload);
        $orderId = (string) ($payload['OrderId'] ?? '');
        $payment = $orderId !== ''
            ? Payment::query()->where('order_id', $orderId)->first()
            : null;

        if (! $payment) {
            // Still 200 so TIKO doesn't keep retrying for unknown order ids
            $this->audit->log('tiko.callback.unknown_order', null, null, null, ['order_id' => $orderId], 'warning');
            return response('OK', 200);
        }

        $payment->raw_callback = $payload;
        $payment->hash_inbound_ok = $verification['hash_ok'];
        if (! empty($payload['TransId'])) {
            $payment->trans_id = (string) $payload['TransId'];
        }

        if (! $verification['hash_ok']) {
            $payment->save();
            return response('OK', 200);
        }

        DB::transaction(function () use ($payment, $verification, $payload) {
            $logical = $verification['status'];
            switch ($logical) {
                case 'paid':
                    $payment->status = Payment::STATUS_CAPTURED;
                    $payment->captured_at = now();
                    $payment->save();
                    $reservation = $payment->reservation;
                    if ($reservation) {
                        $reservation->payment_status = Reservation::PAYMENT_PAID;
                        $reservation->current_payment_id = $payment->id;
                        if ($reservation->status === Reservation::STATUS_PENDING) {
                            $reservation->status = Reservation::STATUS_CONFIRMED;
                        }
                        $reservation->save();
                    }
                    break;
                case 'cancelled':
                    $payment->status = Payment::STATUS_CANCELLED;
                    $payment->save();
                    if ($payment->reservation) {
                        $payment->reservation->payment_status = Reservation::PAYMENT_CANCELLED;
                        $payment->reservation->save();
                    }
                    break;
                case 'failed':
                    $payment->status = Payment::STATUS_FAILED;
                    $payment->error_msg = substr((string) ($payload['Message'] ?? ''), 0, 250) ?: null;
                    $payment->save();
                    if ($payment->reservation) {
                        $payment->reservation->payment_status = Reservation::PAYMENT_FAILED;
                        $payment->reservation->save();
                    }
                    break;
                case 'pending':
                default:
                    $payment->save();
                    break;
            }
        });

        $this->audit->log('tiko.callback.processed', null, 'Payment', $payment->id, [
            'order_id' => $orderId,
            'status' => $verification['status'],
        ], 'info');

        return response('OK', 200);
    }

    /**
     * GET/POST /payments/tiko/return-ok (browser bounce after 3DS).
     *
     * Note: this is NOT proof of success — it's just the user's browser landing.
     * We trigger an immediate status query so we can update faster than waiting
     * on the (potentially delayed) async callback, then redirect to the SPA.
     */
    public function returnOk(Request $request)
    {
        return $this->handleReturn($request, true);
    }

    public function returnFail(Request $request)
    {
        return $this->handleReturn($request, false);
    }

    private function handleReturn(Request $request, bool $okBranch)
    {
        TenantContext::clear();

        $orderId = (string) ($request->input('OrderId') ?? $request->query('OrderId') ?? '');
        $payment = $orderId !== ''
            ? Payment::query()->where('order_id', $orderId)->first()
            : null;

        if ($payment && $this->tiko->isEnabled()) {
            try {
                $result = $this->tiko->queryStatus($payment);
                $this->applyStatus($payment, $result);
            } catch (\Throwable $e) {
                Log::warning('TIKO returnOk status query failed', [
                    'order_id' => $orderId, 'err' => $e->getMessage(),
                ]);
            }
        }

        $base = (string) (config('app.frontend_url') ?? config('app.url'));
        $reservationId = $payment?->reservation_id;
        $branch = $okBranch ? 'ok' : 'fail';
        $target = rtrim($base, '/').'/payment/result?branch='.$branch.'&reservation='.$reservationId.'&order='.urlencode($orderId);

        return redirect()->away($target);
    }

    /**
     * Apply a TIKO status query result onto the Payment + parent Reservation.
     *
     * @param array{ status: string, raw: array<string,mixed>, hash_ok: bool } $result
     */
    private function applyStatus(Payment $payment, array $result): void
    {
        $payment->raw_status_query = $result['raw'];
        if (! empty($result['raw']['TransId'])) {
            $payment->trans_id = (string) $result['raw']['TransId'];
        }
        $payment->hash_inbound_ok = $result['hash_ok'] ? true : ($payment->hash_inbound_ok ?? false);
        $reservation = $payment->reservation;

        switch ($result['status']) {
            case 'paid':
                $payment->status = Payment::STATUS_CAPTURED;
                $payment->captured_at = $payment->captured_at ?? now();
                $payment->save();
                if ($reservation) {
                    $reservation->payment_status = Reservation::PAYMENT_PAID;
                    $reservation->current_payment_id = $payment->id;
                    if ($reservation->status === Reservation::STATUS_PENDING) {
                        $reservation->status = Reservation::STATUS_CONFIRMED;
                    }
                    $reservation->save();
                }
                break;
            case 'cancelled':
                $payment->status = Payment::STATUS_CANCELLED;
                $payment->save();
                if ($reservation) {
                    $reservation->payment_status = Reservation::PAYMENT_CANCELLED;
                    $reservation->save();
                }
                break;
            case 'failed':
                $payment->status = Payment::STATUS_FAILED;
                $payment->save();
                if ($reservation) {
                    $reservation->payment_status = Reservation::PAYMENT_FAILED;
                    $reservation->save();
                }
                break;
            case 'pending':
            default:
                $payment->save();
                break;
        }
    }
}
