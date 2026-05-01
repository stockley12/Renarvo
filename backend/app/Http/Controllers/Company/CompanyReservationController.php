<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\AuditService;
use App\Services\JobDispatcher;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CompanyReservationController extends Controller
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly JobDispatcher $jobs,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $query = Reservation::query()->with(['car', 'customer', 'currentPayment']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($qq) => $qq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($from = $request->query('from')) {
            $query->where('pickup_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('pickup_at', '<=', $to);
        }

        $perPage = min(100, max(1, (int) $request->query('limit', 25)));
        $paginator = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => ReservationResource::collection($paginator)->resolve(),
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_next' => $paginator->hasMorePages(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $reservation = Reservation::query()
            ->with(['car', 'customer', 'extras', 'currentPayment', 'insurancePackage'])
            ->findOrFail($id);

        return response()->json(['data' => (new ReservationResource($reservation))->resolve()]);
    }

    public function confirm(Request $request, int $id): JsonResponse
    {
        return $this->transition($request, $id, Reservation::STATUS_PENDING, Reservation::STATUS_CONFIRMED, 'reservation.confirmed', 'email.reservation_confirmed');
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $reservation = Reservation::query()->findOrFail($id);
        if ($reservation->status !== Reservation::STATUS_PENDING) {
            throw ValidationException::withMessages(['status' => 'Can only reject pending reservations.']);
        }

        $reservation->update([
            'status' => Reservation::STATUS_CANCELLED,
            'cancellation_reason' => $request->input('reason'),
        ]);

        $this->audit->log('reservation.rejected', $request->user(), 'Reservation', $reservation->id, [
            'reason' => $request->input('reason'),
        ], 'info', $request);

        $this->jobs->dispatch('email.reservation_rejected', ['reservation_id' => $reservation->id]);

        return response()->json(['data' => (new ReservationResource($reservation))->resolve()]);
    }

    public function pickup(Request $request, int $id): JsonResponse
    {
        return $this->transition($request, $id, Reservation::STATUS_CONFIRMED, Reservation::STATUS_ACTIVE, 'reservation.picked_up', null);
    }

    public function returnCar(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $reservation = Reservation::query()->findOrFail($id);
        if ($reservation->status !== Reservation::STATUS_ACTIVE) {
            throw ValidationException::withMessages(['status' => 'Can only return active reservations.']);
        }

        $reservation->update([
            'status' => Reservation::STATUS_COMPLETED,
            'actual_return_at' => now(),
        ]);

        $this->audit->log('reservation.completed', $request->user(), 'Reservation', $reservation->id, [], 'info', $request);

        $this->jobs->dispatch('email.review_request', ['reservation_id' => $reservation->id]);

        return response()->json(['data' => (new ReservationResource($reservation))->resolve()]);
    }

    private function transition(Request $request, int $id, string $from, string $to, string $event, ?string $job): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $reservation = Reservation::query()->findOrFail($id);
        if ($reservation->status !== $from) {
            throw ValidationException::withMessages([
                'status' => "Reservation must be in '{$from}' status (currently '{$reservation->status}').",
            ]);
        }

        $reservation->update(['status' => $to]);
        $this->audit->log($event, $request->user(), 'Reservation', $reservation->id, [], 'info', $request);

        if ($job) {
            $this->jobs->dispatch($job, ['reservation_id' => $reservation->id]);
        }

        return response()->json(['data' => (new ReservationResource($reservation))->resolve()]);
    }
}
