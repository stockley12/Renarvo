<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\StoreCarRequest;
use App\Http\Requests\Company\UpdateCarRequest;
use App\Http\Resources\CarResource;
use App\Models\Car;
use App\Models\CarFeature;
use App\Models\CarImage;
use App\Services\AuditService;
use App\Services\ImageUploadService;
use App\Support\TenantContext;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompanyCarController extends Controller
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly ImageUploadService $images,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $query = Car::query()->with(['features', 'images']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('plate', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $perPage = min(100, max(1, (int) $request->query('limit', 20)));
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

    public function store(StoreCarRequest $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        $data = $request->validated();
        $features = $data['features'] ?? [];
        unset($data['features']);
        $data['company_id'] = $companyId;

        $car = DB::transaction(function () use ($data, $features) {
            $car = Car::query()->create($data);
            foreach (array_unique($features) as $f) {
                CarFeature::query()->create(['car_id' => $car->id, 'feature' => (string) $f]);
            }

            return $car;
        });

        $this->audit->log('car.created', $request->user(), 'Car', $car->id, [
            'company_id' => $companyId,
        ], 'info', $request);

        return response()->json([
            'data' => (new CarResource($car->load(['features', 'images'])))->resolve(),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $car = Car::query()->with(['features', 'images', 'company'])->findOrFail($id);

        return response()->json(['data' => (new CarResource($car))->resolve()]);
    }

    public function update(UpdateCarRequest $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $car = Car::query()->findOrFail($id);
        if ($car->company_id !== $companyId) {
            throw new AuthorizationException();
        }

        $data = $request->validated();
        $features = $data['features'] ?? null;
        unset($data['features']);

        DB::transaction(function () use ($car, $data, $features) {
            $car->fill($data)->save();
            if (is_array($features)) {
                CarFeature::query()->where('car_id', $car->id)->delete();
                foreach (array_unique($features) as $f) {
                    CarFeature::query()->create(['car_id' => $car->id, 'feature' => (string) $f]);
                }
            }
        });

        $this->audit->log('car.updated', $request->user(), 'Car', $car->id, [], 'info', $request);

        return response()->json([
            'data' => (new CarResource($car->fresh(['features', 'images'])))->resolve(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $car = Car::query()->findOrFail($id);
        $car->delete();

        $this->audit->log('car.deleted', $request->user(), 'Car', $id, [], 'info', $request);

        return response()->json(['data' => ['ok' => true]]);
    }

    public function uploadImage(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);
        $car = Car::query()->findOrFail($id);

        $path = $this->images->storeCarImage($request->file('image'), $car->id);
        $position = (int) CarImage::query()->where('car_id', $car->id)->max('position') + 1;

        $image = CarImage::query()->create([
            'car_id' => $car->id,
            'path' => $path,
            'position' => $position,
        ]);

        return response()->json([
            'data' => [
                'id' => $image->id,
                'path' => $image->path,
                'position' => $image->position,
            ],
        ], 201);
    }

    public function deleteImage(Request $request, int $id, int $imgId): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);
        $car = Car::query()->findOrFail($id);

        $image = CarImage::query()->where('car_id', $car->id)->where('id', $imgId)->firstOrFail();
        $this->images->deleteCarImage($image->path);
        $image->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
