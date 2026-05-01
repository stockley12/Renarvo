<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CreateReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Car;
use App\Models\CompanyExtra;
use App\Models\InsurancePackage;
use App\Models\Reservation;
use App\Models\ReservationExtra;
use App\Services\AuditService;
use App\Services\AvailabilityService;
use App\Services\JobDispatcher;
use App\Services\PricingService;
use App\Support\TenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CustomerReservationController extends Controller
{
    public function __construct(
        private readonly PricingService $pricing,
        private readonly AvailabilityService $availability,
        private readonly AuditService $audit,
        private readonly JobDispatcher $jobs,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Reservation::query()
            ->with(['car', 'company'])
            ->where('customer_id', $request->user()->id);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $perPage = min(50, max(1, (int) $request->query('limit', 20)));
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
        $reservation = Reservation::query()
            ->with(['car', 'company', 'extras', 'insurancePackage', 'currentPayment'])
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json(['data' => (new ReservationResource($reservation))->resolve()]);
    }

    public function store(CreateReservationRequest $request): JsonResponse
    {
        $idempotencyKey = $request->header('Idempotency-Key');
        if ($idempotencyKey) {
            $existing = Reservation::query()
                ->where('idempotency_key', $idempotencyKey)
                ->where('customer_id', $request->user()->id)
                ->first();
            if ($existing) {
                return response()->json([
                    'data' => (new ReservationResource($existing->load(['car', 'company', 'extras'])))->resolve(),
                ], 200);
            }
        }

        $data = $request->validated();
        $car = TenantContext::ignore(fn () => Car::query()->with('company')->findOrFail($data['car_id']));

        if ($car->company->status !== 'approved') {
            throw new AuthorizationException('Company is not currently accepting bookings.');
        }

        $pickup = CarbonImmutable::parse($data['pickup_at']);
        $return = CarbonImmutable::parse($data['return_at']);

        // Enforce per-company minimum rental days
        $minDays = (int) ($car->company->min_rental_days ?? 1);
        $bookedDays = max(1, (int) ceil($pickup->diffInHours($return) / 24));
        if ($minDays > 1 && $bookedDays < $minDays) {
            throw ValidationException::withMessages([
                'return_at' => "This company requires a minimum {$minDays}-day rental.",
            ]);
        }

        // Resolve insurance package (must belong to the same company)
        $insurance = null;
        if (! empty($data['insurance_package_id'])) {
            $insurance = TenantContext::ignore(fn () => InsurancePackage::query()
                ->where('id', $data['insurance_package_id'])
                ->where('company_id', $car->company_id)
                ->where('is_active', true)
                ->first());
            if (! $insurance) {
                throw ValidationException::withMessages([
                    'insurance_package_id' => 'Selected insurance package is not available for this company.',
                ]);
            }
        }

        // Resolve extras: prefer extra_ids (catalog) but accept legacy extras array.
        $resolvedExtras = [];
        if (! empty($data['extra_ids'])) {
            $extraRows = TenantContext::ignore(fn () => CompanyExtra::query()
                ->where('company_id', $car->company_id)
                ->where('is_active', true)
                ->whereIn('id', $data['extra_ids'])
                ->get());
            if ($extraRows->count() !== count($data['extra_ids'])) {
                throw ValidationException::withMessages([
                    'extra_ids' => 'One or more extras are not available for this company.',
                ]);
            }
            foreach ($extraRows as $row) {
                $resolvedExtras[] = [
                    'company_extra_id' => $row->id,
                    'type' => $row->code,
                    'label' => $row->name,
                    'price_per_day' => (int) $row->price_per_day,
                    'price_per_rental' => (int) $row->price_per_rental,
                    'charge_mode' => (string) $row->charge_mode,
                ];
            }
        } elseif (! empty($data['extras'])) {
            $resolvedExtras = $data['extras'];
        }

        $reservation = DB::transaction(function () use ($request, $car, $pickup, $return, $data, $idempotencyKey, $insurance, $resolvedExtras) {
            // Lock car row to prevent double-booking races
            DB::table('cars')->where('id', $car->id)->lockForUpdate()->first();

            if (! $this->availability->isCarAvailable($car, $pickup, $return)) {
                throw ValidationException::withMessages([
                    'car_id' => 'Car is not available for selected dates.',
                ]);
            }

            $quote = $this->pricing->quote(
                $car,
                $pickup,
                $return,
                $resolvedExtras,
                $data['promo_code'] ?? null,
                $insurance,
            );

            $reservation = Reservation::query()->create([
                'code' => $this->generateCode(),
                'car_id' => $car->id,
                'company_id' => $car->company_id,
                'customer_id' => $request->user()->id,
                'pickup_at' => $pickup,
                'return_at' => $return,
                'pickup_location' => $data['pickup_location'],
                'return_location' => $data['return_location'] ?? $data['pickup_location'],
                'days' => $quote['days'],
                'base_price' => $quote['base_price'],
                'extras_price' => $quote['extras_price'],
                'insurance_package_id' => $insurance?->id,
                'insurance_price' => $quote['insurance_price'],
                'deposit_amount_snapshot' => $quote['deposit_amount_snapshot'],
                'discount_amount' => $quote['discount_amount'],
                'service_fee' => $quote['service_fee'],
                'tax_amount' => $quote['tax_amount'],
                'total_price' => $quote['total_price'],
                'currency_snapshot' => 'TRY',
                'fx_rate_snapshot' => 1,
                // With paid checkout, stay 'pending' until TIKO confirms (Phase 10).
                'status' => Reservation::STATUS_PENDING,
                'payment_status' => Reservation::PAYMENT_UNPAID,
                'idempotency_key' => $idempotencyKey,
                'promo_code' => $quote['promo_applied'],
                'flight_number' => $data['flight_number'] ?? null,
                'driving_license_number' => $data['driving_license_number'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($resolvedExtras as $extra) {
                ReservationExtra::query()->create([
                    'reservation_id' => $reservation->id,
                    'type' => $extra['type'],
                    'label' => $extra['label'] ?? $this->labelFor($extra['type']),
                    'price_per_day' => $extra['price_per_day'],
                ]);
            }

            return $reservation;
        });

        $this->audit->log('reservation.created', $request->user(), 'Reservation', $reservation->id, [
            'code' => $reservation->code,
            'company_id' => $reservation->company_id,
        ], 'info', $request);

        $this->jobs->dispatch('email.reservation_confirmation', [
            'reservation_id' => $reservation->id,
        ]);
        $this->jobs->dispatch('notification.company_new_reservation', [
            'reservation_id' => $reservation->id,
        ]);

        return response()->json([
            'data' => (new ReservationResource($reservation->load(['car', 'company', 'extras'])))->resolve(),
        ], 201);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $reservation = Reservation::query()
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);

        if (! in_array($reservation->status, ['pending', 'confirmed'], true)) {
            throw ValidationException::withMessages(['status' => 'Reservation cannot be cancelled.']);
        }

        $reservation->update([
            'status' => Reservation::STATUS_CANCELLED,
            'cancellation_reason' => $request->input('reason'),
        ]);

        $this->audit->log('reservation.cancelled', $request->user(), 'Reservation', $reservation->id, [
            'reason' => $request->input('reason'),
            'cancelled_by' => 'customer',
        ], 'info', $request);

        $this->jobs->dispatch('email.reservation_cancelled', [
            'reservation_id' => $reservation->id,
        ]);

        return response()->json(['data' => (new ReservationResource($reservation))->resolve()]);
    }

    private function generateCode(): string
    {
        do {
            $code = 'RNV-'.strtoupper(Str::random(7));
        } while (Reservation::query()->where('code', $code)->exists());

        return $code;
    }

    private function labelFor(string $type): string
    {
        return match ($type) {
            'gps' => 'GPS',
            'child_seat' => 'Child seat',
            'additional_driver' => 'Additional driver',
            'full_insurance' => 'Full insurance',
            default => 'Extra',
        };
    }
}
