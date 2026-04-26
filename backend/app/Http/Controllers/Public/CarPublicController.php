<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\CarResource;
use App\Models\Car;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CarPublicController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Car::query()
            ->with(['company', 'features', 'images'])
            ->whereHas('company', fn ($q) => $q->where('status', 'approved'))
            ->where('status', Car::STATUS_ACTIVE);

        if ($city = $request->query('city')) {
            $query->where('city', $city);
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($transmission = $request->query('transmission')) {
            $query->where('transmission', $transmission);
        }

        if ($fuel = $request->query('fuel')) {
            $query->where('fuel', $fuel);
        }

        if ($priceMin = $request->query('price_min')) {
            $query->where('price_per_day', '>=', (int) $priceMin);
        }

        if ($priceMax = $request->query('price_max')) {
            $query->where('price_per_day', '<=', (int) $priceMax);
        }

        if ($brand = $request->query('brand')) {
            $query->where('brand', $brand);
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%");
            });
        }

        if (($pickupAt = $request->query('pickup_at')) && ($returnAt = $request->query('return_at'))) {
            $busyCarIds = Reservation::query()
                ->whereIn('status', ['confirmed', 'active', 'pending'])
                ->where(function ($q) use ($pickupAt, $returnAt) {
                    $q->whereBetween('pickup_at', [$pickupAt, $returnAt])
                        ->orWhereBetween('return_at', [$pickupAt, $returnAt])
                        ->orWhere(function ($qq) use ($pickupAt, $returnAt) {
                            $qq->where('pickup_at', '<=', $pickupAt)
                                ->where('return_at', '>=', $returnAt);
                        });
                })
                ->pluck('car_id');
            $query->whereNotIn('id', $busyCarIds);
        }

        $sort = $request->query('sort', 'price_asc');
        match ($sort) {
            'price_desc' => $query->orderByDesc('price_per_day'),
            'rating_desc' => $query->orderByDesc('rating_avg'),
            'newest' => $query->orderByDesc('id'),
            default => $query->orderBy('price_per_day'),
        };

        $perPage = min(48, max(1, (int) $request->query('limit', 24)));
        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => CarResource::collection($paginator)->resolve(),
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
        $car = Car::query()
            ->with(['company', 'features', 'images', 'reviews' => function ($q) {
                $q->where('status', 'visible')->latest()->limit(20);
            }])
            ->whereHas('company', fn ($q) => $q->where('status', 'approved'))
            ->findOrFail($id);

        return response()->json([
            'data' => (new CarResource($car))->resolve(),
        ]);
    }
}
