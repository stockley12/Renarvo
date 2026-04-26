<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminUserController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        TenantContext::clear();

        $query = User::query();

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
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

    public function ban(Request $request, int $id): JsonResponse
    {
        $reason = $request->input('reason');
        TenantContext::clear();
        $user = User::query()->findOrFail($id);

        DB::transaction(function () use ($user) {
            $user->status = 'banned';
            $user->token_version = $user->token_version + 1;
            $user->save();
        });

        $this->audit->log('user.banned', $request->user(), 'User', $user->id, ['reason' => $reason], 'warning', $request);

        return response()->json(['data' => $user]);
    }

    public function unban(Request $request, int $id): JsonResponse
    {
        TenantContext::clear();
        $user = User::query()->findOrFail($id);
        $user->status = 'active';
        $user->save();

        $this->audit->log('user.unbanned', $request->user(), 'User', $user->id, [], 'info', $request);

        return response()->json(['data' => $user]);
    }
}
