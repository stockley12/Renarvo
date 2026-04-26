<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyBranchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        return response()->json(['data' => Branch::query()->orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $branch = Branch::query()->create(array_merge($data, ['company_id' => $companyId]));

        return response()->json(['data' => $branch], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $branch = Branch::query()->findOrFail($id);
        $branch->fill($this->validateData($request, false))->save();

        return response()->json(['data' => $branch]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        Branch::query()->where('id', $id)->delete();

        return response()->json(['data' => ['ok' => true]]);
    }

    private function validateData(Request $request, bool $required = true): array
    {
        $req = $required ? 'required' : 'sometimes';

        return $request->validate([
            'name' => [$req, 'string', 'max:191'],
            'address' => [$req, 'string', 'max:191'],
            'city' => ['nullable', 'string', 'max:64'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'opening_hours' => ['nullable', 'array'],
        ]);
    }
}
