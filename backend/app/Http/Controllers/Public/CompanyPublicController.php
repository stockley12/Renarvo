<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Models\CompanyExtra;
use App\Models\InsurancePackage;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyPublicController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Company::query()->where('status', 'approved');

        if ($city = $request->query('city')) {
            $query->where('city', $city);
        }

        if ($search = $request->query('q')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $perPage = min(48, max(1, (int) $request->query('limit', 12)));
        $paginator = $query->orderByDesc('rating_avg')->paginate($perPage);

        return response()->json([
            'data' => CompanyResource::collection($paginator)->resolve(),
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_next' => $paginator->hasMorePages(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $company = Company::query()
            ->where('slug', $slug)
            ->where('status', 'approved')
            ->firstOrFail();

        return response()->json(['data' => (new CompanyResource($company))->resolve()]);
    }

    public function extras(int $companyId): JsonResponse
    {
        $extras = TenantContext::ignore(fn () => CompanyExtra::query()
            ->where('company_id', $companyId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get());

        return response()->json([
            'data' => $extras->map(fn ($e) => [
                'id' => $e->id,
                'company_id' => $e->company_id,
                'code' => $e->code,
                'name' => $e->name,
                'price_per_day' => (int) $e->price_per_day,
                'price_per_rental' => (int) $e->price_per_rental,
                'charge_mode' => $e->charge_mode,
                'description' => $e->description,
            ])->all(),
        ]);
    }

    public function insurancePackages(int $companyId): JsonResponse
    {
        $packages = TenantContext::ignore(fn () => InsurancePackage::query()
            ->where('company_id', $companyId)
            ->where('is_active', true)
            ->orderByRaw("CASE tier WHEN 'mini' THEN 1 WHEN 'mid' THEN 2 WHEN 'full' THEN 3 ELSE 4 END")
            ->get());

        return response()->json([
            'data' => $packages->map(fn ($p) => [
                'id' => $p->id,
                'company_id' => $p->company_id,
                'tier' => $p->tier,
                'name' => $p->name,
                'price_per_day' => (int) $p->price_per_day,
                'deductible_amount' => $p->deductible_amount !== null ? (int) $p->deductible_amount : null,
                'coverage_amount' => $p->coverage_amount !== null ? (int) $p->coverage_amount : null,
                'description' => $p->description,
                'included_features' => $p->included_features ?? [],
            ])->all(),
        ]);
    }
}
