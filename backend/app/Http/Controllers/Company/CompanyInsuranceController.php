<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\InsurancePackage;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyInsuranceController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        $packages = InsurancePackage::query()
            ->where('company_id', $companyId)
            ->orderByRaw("CASE tier WHEN 'mini' THEN 1 WHEN 'mid' THEN 2 WHEN 'full' THEN 3 ELSE 4 END")
            ->get()
            ->map(fn ($p) => $this->resource($p));

        return response()->json(['data' => $packages]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);
        $companyId = $request->attributes->get('company_id');

        $exists = InsurancePackage::query()
            ->where('company_id', $companyId)
            ->where('tier', $data['tier'])
            ->exists();
        if ($exists) {
            return response()->json([
                'error' => ['code' => 'ALREADY_EXISTS', 'message' => 'A package with this tier already exists.'],
            ], 422);
        }

        $package = InsurancePackage::query()->create(array_merge($data, ['company_id' => $companyId]));

        $this->audit->log('company.insurance.created', $request->user(), 'InsurancePackage', $package->id, $data, 'info', $request);

        return response()->json(['data' => $this->resource($package)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        $package = InsurancePackage::query()->where('company_id', $companyId)->findOrFail($id);
        $data = $this->validatePayload($request, true);
        $package->fill($data)->save();

        $this->audit->log('company.insurance.updated', $request->user(), 'InsurancePackage', $package->id, $data, 'info', $request);

        return response()->json(['data' => $this->resource($package)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        $package = InsurancePackage::query()->where('company_id', $companyId)->findOrFail($id);
        $package->delete();

        $this->audit->log('company.insurance.deleted', $request->user(), 'InsurancePackage', $id, [], 'info', $request);

        return response()->json(['data' => ['ok' => true]]);
    }

    private function validatePayload(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'tier' => [$rule, 'in:mini,mid,full'],
            'name' => [$rule, 'string', 'max:191'],
            'price_per_day' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'deductible_amount' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'coverage_amount' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:2000'],
            'included_features' => ['nullable', 'array'],
            'included_features.*' => ['string', 'max:120'],
        ]);
    }

    private function resource(InsurancePackage $p): array
    {
        return [
            'id' => $p->id,
            'company_id' => $p->company_id,
            'tier' => $p->tier,
            'name' => $p->name,
            'price_per_day' => (int) $p->price_per_day,
            'deductible_amount' => $p->deductible_amount !== null ? (int) $p->deductible_amount : null,
            'coverage_amount' => $p->coverage_amount !== null ? (int) $p->coverage_amount : null,
            'is_active' => (bool) $p->is_active,
            'description' => $p->description,
            'included_features' => $p->included_features ?? [],
        ];
    }
}
