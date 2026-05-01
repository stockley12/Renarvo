<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReservationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        TenantContext::clear();

        $query = Reservation::query()->with([
            'car',
            'company:id,name,slug',
            'customer:id,name,email,phone',
            'currentPayment',
        ]);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($paymentStatus = $request->query('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($qq) => $qq->where('email', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%"))
                    ->orWhereHas('company', fn ($qq) => $qq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('currentPayment', fn ($qq) => $qq->where('order_id', 'like', "%{$search}%")->orWhere('trans_id', 'like', "%{$search}%"));
            });
        }
        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to);
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
}
