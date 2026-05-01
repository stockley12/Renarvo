<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    /**
     * Generic webhook receiver for optional non-TIKO PSP integrations.
     * Validates signature, deduplicates by event id, and records the raw payload.
     * Reservation status changes are applied through PaymentService.
     */
    public function handle(Request $request, string $provider): JsonResponse
    {
        $supported = ['iyzico'];
        if (! in_array($provider, $supported, true)) {
            return response()->json([
                'error' => ['code' => 'PROVIDER_NOT_SUPPORTED', 'message' => 'Unsupported webhook provider'],
            ], 404);
        }

        $secret = (string) config("services.payments.{$provider}.webhook_secret", '');
        if ($secret !== '' && !$this->verifySignature($request, $provider, $secret)) {
            return response()->json(['error' => ['code' => 'INVALID_SIGNATURE', 'message' => 'Bad signature']], 401);
        }

        $payload = $request->all();
        $eventId = (string) ($payload['id'] ?? $payload['event_id'] ?? $request->header('X-Event-Id', ''));
        $type = (string) ($payload['type'] ?? $payload['event_type'] ?? 'unknown');

        if ($eventId === '') {
            return response()->json(['error' => ['code' => 'MISSING_EVENT_ID', 'message' => 'event id required']], 422);
        }

        TenantContext::clear();

        $event = PaymentWebhookEvent::query()->firstOrCreate(
            ['event_id' => $eventId],
            [
                'provider' => $provider,
                'event_type' => $type,
                'payload' => $payload,
                'status' => 'received',
            ],
        );

        if ($event->wasRecentlyCreated) {
            try {
                DB::transaction(function () use ($event, $payload, $provider) {
                    $reference = $payload['data']['reference'] ?? $payload['reference'] ?? null;
                    if ($reference) {
                        $payment = Payment::query()
                            ->where('provider', $provider)
                            ->where('provider_reference', $reference)
                            ->first();
                        if ($payment && in_array($event->event_type, ['payment.succeeded', 'charge.captured'], true)) {
                            $payment->status = Payment::STATUS_CAPTURED;
                            $payment->captured_at = now();
                            $payment->save();
                        } elseif ($payment && in_array($event->event_type, ['payment.refunded', 'charge.refunded'], true)) {
                            $payment->status = Payment::STATUS_REFUNDED;
                            $payment->refunded_at = now();
                            $payment->save();
                        }
                    }
                    $event->status = 'processed';
                    $event->save();
                });
            } catch (\Throwable $e) {
                Log::error('Webhook processing failed', ['error' => $e->getMessage(), 'event_id' => $eventId]);
                $event->status = 'failed';
                $event->error = substr($e->getMessage(), 0, 500);
                $event->save();
                return response()->json(['ok' => false]);
            }
        }

        return response()->json(['ok' => true]);
    }

    private function verifySignature(Request $request, string $provider, string $secret): bool
    {
        $signature = $request->header('X-Signature');
        if (!$signature) {
            return false;
        }
        $expected = hash_hmac('sha256', $request->getContent(), $secret);
        return hash_equals($expected, $signature);
    }
}
