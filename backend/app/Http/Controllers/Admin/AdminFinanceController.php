<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Models\Reservation;
use App\Services\AuditService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminFinanceController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function overview(Request $request): JsonResponse
    {
        TenantContext::clear();

        $monthStart = now()->startOfMonth();

        return response()->json([
            'data' => [
                'gmv_this_month' => (int) Reservation::query()
                    ->whereIn('status', ['completed', 'active', 'confirmed'])
                    ->where('created_at', '>=', $monthStart)
                    ->sum('total_price'),
                'commission_this_month' => (int) Payout::query()
                    ->where('created_at', '>=', $monthStart)
                    ->sum('commission'),
                'pending_payouts' => Payout::query()->where('status', 'pending')->count(),
                'paid_payouts' => Payout::query()->where('status', 'paid')->count(),
            ],
        ]);
    }

    public function payouts(Request $request): JsonResponse
    {
        TenantContext::clear();

        $query = Payout::query()->with('company:id,name');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($period = $request->query('period')) {
            $query->where('period', $period);
        }

        $perPage = min(100, max(1, (int) $request->query('limit', 25)));
        $paginator = $query->orderByDesc('id')->paginate($perPage);

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

    public function processPayout(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'reference' => ['required', 'string', 'max:191'],
        ]);

        TenantContext::clear();
        $payout = Payout::query()->findOrFail($id);
        $payout->status = 'paid';
        $payout->paid_at = now();
        $payout->reference = $data['reference'];
        $payout->save();

        $this->audit->log('payout.processed', $request->user(), 'Payout', $payout->id, [
            'reference' => $data['reference'],
            'amount' => $payout->net,
        ], 'info', $request);

        return response()->json(['data' => $payout]);
    }
}
