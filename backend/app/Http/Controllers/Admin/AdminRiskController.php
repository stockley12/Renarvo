<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RiskFlag;
use App\Services\AuditService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRiskController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        TenantContext::clear();

        $query = RiskFlag::query();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($type = $request->query('type')) {
            $query->where('type', $type);
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

    public function clear(Request $request, int $id): JsonResponse
    {
        TenantContext::clear();
        $flag = RiskFlag::query()->findOrFail($id);
        $flag->status = 'cleared';
        $flag->reviewer_id = $request->user()->id;
        $flag->resolved_at = now();
        $flag->save();

        $this->audit->log('risk.cleared', $request->user(), 'RiskFlag', $flag->id, [
            'note' => $request->input('note'),
        ], 'info', $request);

        return response()->json(['data' => $flag]);
    }

    public function escalate(Request $request, int $id): JsonResponse
    {
        TenantContext::clear();
        $flag = RiskFlag::query()->findOrFail($id);
        $flag->status = 'escalated';
        $flag->reviewer_id = $request->user()->id;
        $flag->save();

        $this->audit->log('risk.escalated', $request->user(), 'RiskFlag', $flag->id, [
            'note' => $request->input('note'),
        ], 'warning', $request);

        return response()->json(['data' => $flag]);
    }
}
