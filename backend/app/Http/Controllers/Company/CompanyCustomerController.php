<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompanyCustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $query = DB::table('users')
            ->join('reservations', 'reservations.customer_id', '=', 'users.id')
            ->where('reservations.company_id', $companyId)
            ->whereNull('reservations.deleted_at')
            ->groupBy('users.id', 'users.name', 'users.email', 'users.phone', 'users.status')
            ->select(
                'users.id', 'users.name', 'users.email', 'users.phone', 'users.status',
                DB::raw('COUNT(reservations.id) AS total_bookings'),
                DB::raw('SUM(reservations.total_price) AS total_spent'),
                DB::raw('MAX(reservations.pickup_at) AS last_booking'),
            );

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        $perPage = min(100, max(1, (int) $request->query('limit', 25)));
        $paginator = $query->orderByDesc('total_spent')->paginate($perPage);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_next' => $paginator->hasMorePages(),
            ],
        ]);
    }
}
