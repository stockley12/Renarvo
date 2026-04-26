<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Models\User;
use App\Services\AuditService;
use App\Services\JobDispatcher;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminCompanyController extends Controller
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly JobDispatcher $jobs,
    ) {}

    public function index(Request $request): JsonResponse
    {
        TenantContext::clear();

        $query = Company::query()->with('owner:id,name,email');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhereHas('owner', fn ($qq) => $qq->where('email', 'like', "%{$search}%"));
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

    public function show(int $id): JsonResponse
    {
        TenantContext::clear();
        $company = Company::query()->with(['owner:id,name,email', 'documents'])->findOrFail($id);

        return response()->json(['data' => (new CompanyResource($company))->resolve()]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        return $this->changeStatus($request, $id, 'approved', 'company.approved');
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => ['required', 'string', 'max:500']]);
        return $this->changeStatus($request, $id, 'rejected', 'company.rejected', ['reason' => $request->input('reason')]);
    }

    public function suspend(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => ['required', 'string', 'max:500']]);
        return $this->changeStatus($request, $id, 'suspended', 'company.suspended', ['reason' => $request->input('reason')]);
    }

    private function changeStatus(Request $request, int $id, string $status, string $event, array $extra = []): JsonResponse
    {
        TenantContext::clear();
        $company = Company::query()->findOrFail($id);
        $previous = $company->status;
        $company->status = $status;
        $company->save();

        DB::transaction(function () use ($company, $status) {
            if ($status !== 'approved') {
                User::query()
                    ->where('id', $company->owner_user_id)
                    ->update(['token_version' => DB::raw('token_version + 1')]);
            }
        });

        $this->audit->log($event, $request->user(), 'Company', $company->id, array_merge(['from' => $previous, 'to' => $status], $extra), 'info', $request);

        $this->jobs->dispatch('create_notification', [
            'user_id' => $company->owner_user_id,
            'type' => $event,
            'title' => "Your company is now {$status}",
            'body' => "Renarvo updated your company status to {$status}.",
            'data' => ['company_id' => $company->id, 'status' => $status],
        ]);

        return response()->json(['data' => (new CompanyResource($company))->resolve()]);
    }
}
