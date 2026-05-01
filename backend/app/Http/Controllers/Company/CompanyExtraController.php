<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\CompanyExtra;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyExtraController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        $extras = CompanyExtra::query()
            ->where('company_id', $companyId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($e) => $this->resource($e));

        return response()->json(['data' => $extras]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);
        $companyId = $request->attributes->get('company_id');
        $extra = CompanyExtra::query()->create(array_merge($data, ['company_id' => $companyId]));

        $this->audit->log('company.extra.created', $request->user(), 'CompanyExtra', $extra->id, $data, 'info', $request);

        return response()->json(['data' => $this->resource($extra)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        $extra = CompanyExtra::query()->where('company_id', $companyId)->findOrFail($id);
        $data = $this->validatePayload($request, true);
        $extra->fill($data)->save();

        $this->audit->log('company.extra.updated', $request->user(), 'CompanyExtra', $extra->id, $data, 'info', $request);

        return response()->json(['data' => $this->resource($extra)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        $extra = CompanyExtra::query()->where('company_id', $companyId)->findOrFail($id);
        $extra->delete();

        $this->audit->log('company.extra.deleted', $request->user(), 'CompanyExtra', $id, [], 'info', $request);

        return response()->json(['data' => ['ok' => true]]);
    }

    private function validatePayload(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'code' => [$rule, 'string', 'max:32'],
            'name' => [$rule, 'string', 'max:191'],
            'price_per_day' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'price_per_rental' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'charge_mode' => ['nullable', 'in:per_day,per_rental,free'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    private function resource(CompanyExtra $e): array
    {
        return [
            'id' => $e->id,
            'company_id' => $e->company_id,
            'code' => $e->code,
            'name' => $e->name,
            'price_per_day' => (int) $e->price_per_day,
            'price_per_rental' => (int) $e->price_per_rental,
            'charge_mode' => $e->charge_mode,
            'is_active' => (bool) $e->is_active,
            'sort_order' => (int) $e->sort_order,
            'description' => $e->description,
        ];
    }
}
