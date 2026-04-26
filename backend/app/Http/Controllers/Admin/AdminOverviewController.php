<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Reservation;
use App\Models\RiskFlag;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;

class AdminOverviewController extends Controller
{
    public function show(): JsonResponse
    {
        TenantContext::clear();

        $monthStart = now()->startOfMonth();

        return response()->json([
            'data' => [
                'companies_total' => Company::query()->count(),
                'companies_pending' => Company::query()->where('status', 'pending')->count(),
                'companies_approved' => Company::query()->where('status', 'approved')->count(),
                'users_total' => User::query()->count(),
                'customers_total' => User::query()->where('role', 'customer')->count(),
                'reservations_total' => Reservation::query()->count(),
                'reservations_this_month' => Reservation::query()->where('created_at', '>=', $monthStart)->count(),
                'gmv_this_month' => (int) Reservation::query()
                    ->whereIn('status', ['completed', 'active', 'confirmed'])
                    ->where('created_at', '>=', $monthStart)
                    ->sum('total_price'),
                'open_risk_flags' => RiskFlag::query()->where('status', 'open')->count(),
            ],
        ]);
    }
}
