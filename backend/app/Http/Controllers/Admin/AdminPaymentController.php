<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        TenantContext::clear();

        $query = Payment::query()->with([
            'reservation:id,code,car_id,company_id,customer_id,total_price,payment_status,status',
            'reservation.car:id,brand,model',
            'reservation.customer:id,name,email',
            'company:id,name,slug',
        ]);

        if ($provider = $request->query('provider')) {
            $query->where('provider', $provider);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                    ->orWhere('trans_id', 'like', "%{$search}%")
                    ->orWhere('provider_reference', 'like', "%{$search}%")
                    ->orWhereHas('reservation', fn ($qq) => $qq->where('code', 'like', "%{$search}%"))
                    ->orWhereHas('reservation.customer', fn ($qq) => $qq->where('email', 'like', "%{$search}%"));
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

        $data = collect($paginator->items())->map(fn (Payment $p) => [
            'id' => $p->id,
            'provider' => $p->provider,
            'method' => $p->method,
            'status' => $p->status,
            'amount' => (int) $p->amount,
            'amount_try' => (int) ($p->amount_try ?? 0),
            'currency' => $p->currency,
            'order_id' => $p->order_id,
            'trans_id' => $p->trans_id,
            'installment' => (int) ($p->installment ?? 1),
            'hash_inbound_ok' => $p->hash_inbound_ok,
            'error_msg' => $p->error_msg,
            'captured_at' => $p->captured_at?->toIso8601String(),
            'refunded_at' => $p->refunded_at?->toIso8601String(),
            'created_at' => $p->created_at?->toIso8601String(),
            'reservation' => $p->reservation ? [
                'id' => $p->reservation->id,
                'code' => $p->reservation->code,
                'total_price' => (int) $p->reservation->total_price,
                'payment_status' => $p->reservation->payment_status,
                'status' => $p->reservation->status,
                'car' => $p->reservation->car ? [
                    'id' => $p->reservation->car->id,
                    'brand' => $p->reservation->car->brand,
                    'model' => $p->reservation->car->model,
                ] : null,
                'customer' => $p->reservation->customer ? [
                    'id' => $p->reservation->customer->id,
                    'name' => $p->reservation->customer->name,
                    'email' => $p->reservation->customer->email,
                ] : null,
            ] : null,
            'company' => $p->company ? [
                'id' => $p->company->id,
                'name' => $p->company->name,
                'slug' => $p->company->slug,
            ] : null,
        ]);

        return response()->json([
            'data' => $data,
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_next' => $paginator->hasMorePages(),
            ],
        ]);
    }
}
