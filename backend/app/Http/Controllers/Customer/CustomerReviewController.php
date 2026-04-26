<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Review;
use App\Services\AuditService;
use App\Support\TenantContext;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerReviewController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function publicIndex(Request $request): JsonResponse
    {
        $query = Review::query()->where('status', 'visible');

        if ($carId = $request->query('car_id')) {
            $query->where('car_id', (int) $carId);
        }
        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', (int) $companyId);
        }

        $perPage = min(50, max(1, (int) $request->query('limit', 20)));
        $paginator = $query->with('customer:id,name')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => $paginator->getCollection()->map(fn (Review $r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'text' => $r->text,
                'company_reply' => $r->company_reply,
                'company_replied_at' => $r->company_replied_at?->toIso8601String(),
                'customer_name' => $r->customer?->name,
                'created_at' => $r->created_at?->toIso8601String(),
            ]),
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_next' => $paginator->hasMorePages(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reservation_id' => ['required', 'integer', 'exists:reservations,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'text' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        $reservation = Reservation::query()
            ->where('customer_id', $request->user()->id)
            ->findOrFail($data['reservation_id']);

        if ($reservation->status !== Reservation::STATUS_COMPLETED) {
            throw ValidationException::withMessages([
                'reservation_id' => 'You can only review completed reservations.',
            ]);
        }

        if (TenantContext::ignore(fn () => Review::query()->where('reservation_id', $reservation->id)->exists())) {
            throw ValidationException::withMessages([
                'reservation_id' => 'You have already reviewed this reservation.',
            ]);
        }

        $review = DB::transaction(function () use ($reservation, $data, $request) {
            $review = Review::query()->create([
                'reservation_id' => $reservation->id,
                'car_id' => $reservation->car_id,
                'company_id' => $reservation->company_id,
                'customer_id' => $request->user()->id,
                'rating' => $data['rating'],
                'text' => $data['text'],
                'status' => 'visible',
            ]);

            $this->recalculateAggregates($reservation->car_id, $reservation->company_id);

            return $review;
        });

        $this->audit->log('review.created', $request->user(), 'Review', $review->id, [
            'rating' => $review->rating,
            'company_id' => $review->company_id,
        ], 'info', $request);

        return response()->json(['data' => $review], 201);
    }

    private function recalculateAggregates(int $carId, int $companyId): void
    {
        TenantContext::ignore(function () use ($carId, $companyId) {
            $car = DB::table('reviews')
                ->selectRaw('AVG(rating) AS avg, COUNT(*) AS cnt')
                ->where('car_id', $carId)->where('status', 'visible')->first();
            DB::table('cars')->where('id', $carId)->update([
                'rating_avg' => round((float) $car->avg, 2),
                'review_count' => (int) $car->cnt,
            ]);

            $company = DB::table('reviews')
                ->selectRaw('AVG(rating) AS avg, COUNT(*) AS cnt')
                ->where('company_id', $companyId)->where('status', 'visible')->first();
            DB::table('companies')->where('id', $companyId)->update([
                'rating_avg' => round((float) $company->avg, 2),
                'review_count' => (int) $company->cnt,
            ]);
        });
    }
}
