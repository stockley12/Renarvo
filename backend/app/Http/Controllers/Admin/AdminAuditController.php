<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        TenantContext::clear();

        $query = AuditLog::query();

        if ($severity = $request->query('severity')) {
            $query->where('severity', $severity);
        }
        if ($action = $request->query('action')) {
            $query->where('action', 'like', $action . '%');
        }
        if ($actor = $request->query('actor_id')) {
            $query->where('actor_id', $actor);
        }
        if ($targetType = $request->query('target_type')) {
            $query->where('target_type', $targetType);
        }
        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to);
        }

        $perPage = min(200, max(1, (int) $request->query('limit', 50)));
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
}
