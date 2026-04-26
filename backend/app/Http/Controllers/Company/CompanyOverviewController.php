<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompanyOverviewController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        $stats = [
            'reservations_today' => Reservation::query()->whereDate('pickup_at', $today)->count(),
            'reservations_pending' => Reservation::query()->where('status', 'pending')->count(),
            'reservations_active' => Reservation::query()->where('status', 'active')->count(),
            'revenue_this_month' => (int) Reservation::query()
                ->whereIn('status', ['completed', 'active', 'confirmed'])
                ->where('pickup_at', '>=', $monthStart)
                ->sum('total_price'),
            'fleet_size' => DB::table('cars')->where('company_id', $companyId)->whereNull('deleted_at')->count(),
        ];

        $recentReservations = Reservation::query()
            ->with(['car', 'customer'])
            ->orderByDesc('id')
            ->limit(8)
            ->get();

        return response()->json([
            'data' => [
                'stats' => $stats,
                'recent_reservations' => $recentReservations->map(fn ($r) => [
                    'id' => $r->id,
                    'code' => $r->code,
                    'status' => $r->status,
                    'pickup_at' => $r->pickup_at->toIso8601String(),
                    'customer_name' => $r->customer?->name,
                    'car_label' => $r->car ? "{$r->car->brand} {$r->car->model}" : null,
                    'total_price' => $r->total_price,
                ]),
            ],
        ]);
    }

    public function calendar(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $from = $request->query('from', now()->startOfMonth()->toDateString());
        $to = $request->query('to', now()->endOfMonth()->toDateString());

        $events = Reservation::query()
            ->with('car:id,brand,model')
            ->whereIn('status', ['pending', 'confirmed', 'active', 'completed'])
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('pickup_at', [$from, $to])
                    ->orWhereBetween('return_at', [$from, $to]);
            })
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'code' => $r->code,
                'car' => $r->car ? "{$r->car->brand} {$r->car->model}" : null,
                'start' => $r->pickup_at->toIso8601String(),
                'end' => $r->return_at->toIso8601String(),
                'status' => $r->status,
            ]);

        return response()->json(['data' => $events]);
    }
}
