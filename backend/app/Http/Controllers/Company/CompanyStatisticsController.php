<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompanyStatisticsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $monthly = Reservation::query()
            ->whereIn('status', ['completed', 'confirmed', 'active'])
            ->where('pickup_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("DATE_FORMAT(pickup_at, '%Y-%m') AS month, COUNT(*) AS bookings, SUM(total_price) AS revenue")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $byCar = Reservation::query()
            ->whereIn('status', ['completed', 'active', 'confirmed'])
            ->where('pickup_at', '>=', now()->subMonths(3))
            ->selectRaw('car_id, COUNT(*) AS bookings, SUM(total_price) AS revenue')
            ->groupBy('car_id')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        $statusBreakdown = Reservation::query()
            ->where('pickup_at', '>=', now()->subMonths(3))
            ->selectRaw('status, COUNT(*) AS count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return response()->json([
            'data' => [
                'monthly' => $monthly,
                'top_cars' => $byCar,
                'status_breakdown' => $statusBreakdown,
            ],
        ]);
    }
}
