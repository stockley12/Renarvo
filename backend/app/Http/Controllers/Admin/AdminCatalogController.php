<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CarResource;
use App\Models\Car;
use App\Services\AuditService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCatalogController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        TenantContext::clear();

        $query = Car::query()->with('company:id,name,slug,status');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('plate', 'like', "%{$search}%");
            });
        }

        $perPage = min(100, max(1, (int) $request->query('limit', 25)));
        $paginator = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => CarResource::collection($paginator)->resolve(),
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_next' => $paginator->hasMorePages(),
            ],
        ]);
    }

    public function hide(Request $request, int $id): JsonResponse
    {
        TenantContext::clear();
        $car = Car::query()->findOrFail($id);
        $car->status = Car::STATUS_HIDDEN;
        $car->save();

        $this->audit->log('catalog.hidden', $request->user(), 'Car', $car->id, [
            'reason' => $request->input('reason'),
        ], 'info', $request);

        return response()->json(['data' => (new CarResource($car))->resolve()]);
    }

    public function flag(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => ['required', 'string', 'max:500']]);
        TenantContext::clear();
        $car = Car::query()->findOrFail($id);

        $this->audit->log('catalog.flagged', $request->user(), 'Car', $car->id, [
            'reason' => $request->input('reason'),
        ], 'warning', $request);

        return response()->json(['data' => (new CarResource($car))->resolve()]);
    }
}
