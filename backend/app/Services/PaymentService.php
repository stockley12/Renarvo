<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    /**
     * Record a manual / cash-on-pickup payment intent for a reservation.
     * No real money moves through this method — actual capture is done by
     * the company at pickup time via the Capture endpoint.
     */
    public function createForReservation(Reservation $reservation, string $method = 'cash'): Payment
    {
        return Payment::query()->create([
            'reservation_id' => $reservation->id,
            'company_id' => $reservation->company_id,
            'provider' => 'manual',
            'method' => $method,
            'amount' => $reservation->total_price,
            'currency' => $reservation->currency_snapshot ?: 'TRY',
            'status' => Payment::STATUS_PENDING,
            'metadata' => ['reservation_code' => $reservation->code],
        ]);
    }

    public function capture(Payment $payment, ?string $reference = null): Payment
    {
        return DB::transaction(function () use ($payment, $reference) {
            $payment->status = Payment::STATUS_CAPTURED;
            $payment->captured_at = now();
            if ($reference) {
                $payment->provider_reference = $reference;
            }
            $payment->save();
            return $payment;
        });
    }

    public function refund(Payment $payment): Payment
    {
        return DB::transaction(function () use ($payment) {
            $payment->status = Payment::STATUS_REFUNDED;
            $payment->refunded_at = now();
            $payment->save();
            return $payment;
        });
    }

    public function cancel(Payment $payment): Payment
    {
        $payment->status = Payment::STATUS_CANCELLED;
        $payment->save();
        return $payment;
    }
}
