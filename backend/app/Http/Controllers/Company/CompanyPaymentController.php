<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\AuditService;
use App\Services\PaymentService;
use App\Support\TenantContext;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyPaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $payments,
        private readonly AuditService $audit,
    ) {}

    public function show(Request $request, int $reservationId): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $reservation = Reservation::query()->findOrFail($reservationId);
        $payment = Payment::query()
            ->where('reservation_id', $reservation->id)
            ->latest('id')
            ->first()
            ?? $this->payments->createForReservation($reservation);

        return response()->json(['data' => $payment]);
    }

    public function capture(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $payment = Payment::query()->findOrFail($id);
        if ($payment->company_id !== $companyId) {
            throw new AuthorizationException('Cross-tenant payment access denied.');
        }
        if ($payment->status !== Payment::STATUS_PENDING) {
            throw new \DomainException('Only pending payments can be captured.');
        }

        $reference = $request->input('reference');
        $payment = $this->payments->capture($payment, $reference);

        $this->audit->log('payment.captured', $request->user(), 'Payment', $payment->id, [
            'reservation_id' => $payment->reservation_id,
            'amount' => $payment->amount,
            'reference' => $reference,
        ], 'info', $request);

        return response()->json(['data' => $payment]);
    }
}
