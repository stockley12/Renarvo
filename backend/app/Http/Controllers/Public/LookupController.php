<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\FxRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class LookupController extends Controller
{
    private const CITIES = ['Girne', 'Lefkoşa', 'Gazimağusa', 'İskele', 'Güzelyurt', 'Lefke', 'Karpaz', 'Bafra'];
    private const PICKUP_POINTS = [
        'Ercan Havalimanı', 'Larnaka Havalimanı transferi', 'Girne Limanı',
        'Gazimağusa merkez', 'Lefkoşa şube', 'İskele otel teslim',
    ];
    private const CATEGORIES = [
        ['id' => 'economy', 'name' => 'Economy'],
        ['id' => 'compact', 'name' => 'Compact'],
        ['id' => 'comfort', 'name' => 'Comfort'],
        ['id' => 'prestige', 'name' => 'Prestige'],
        ['id' => 'premium', 'name' => 'Premium'],
        ['id' => 'luxury', 'name' => 'Luxury'],
        ['id' => 'suv', 'name' => 'SUV'],
        ['id' => 'minivan', 'name' => 'Minivan'],
        ['id' => 'van', 'name' => 'Van'],
        ['id' => 'electric', 'name' => 'Electric'],
    ];

    public function categories(): JsonResponse
    {
        return response()->json(['data' => self::CATEGORIES]);
    }

    public function cities(): JsonResponse
    {
        return response()->json(['data' => self::CITIES]);
    }

    public function pickupPoints(): JsonResponse
    {
        return response()->json(['data' => self::PICKUP_POINTS]);
    }

    public function fxRates(): JsonResponse
    {
        $rates = Cache::remember('fx-rates', 600, function () {
            $rows = FxRate::query()
                ->where('base_currency', 'TRY')
                ->orderByDesc('fetched_at')
                ->get()
                ->groupBy('target_currency')
                ->map(fn ($g) => $g->first());

            return $rows->mapWithKeys(fn ($r) => [
                $r->target_currency => (float) $r->rate,
            ])->all();
        });

        return response()->json([
            'data' => [
                'base' => 'TRY',
                'rates' => $rates,
                'fetched_at' => optional(FxRate::query()->orderByDesc('fetched_at')->first())->fetched_at?->toIso8601String(),
            ],
        ]);
    }
}
