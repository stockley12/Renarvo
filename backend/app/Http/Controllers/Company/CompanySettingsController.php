<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Services\AuditService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanySettingsController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function show(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::clear();
        $company = Company::query()->findOrFail($companyId);

        return response()->json(['data' => (new CompanyResource($company))->resolve()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'description' => ['nullable', 'string', 'max:5000'],
            'phone' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:191'],
            'city' => ['sometimes', 'string', 'max:64'],
            'languages_spoken' => ['nullable', 'string', 'max:191'],
            'logo_color' => ['nullable', 'string', 'max:32'],
        ]);

        $companyId = $request->attributes->get('company_id');
        $company = Company::query()->findOrFail($companyId);
        $company->fill($data)->save();

        $this->audit->log('company.updated', $request->user(), 'Company', $company->id, $data, 'info', $request);

        return response()->json(['data' => (new CompanyResource($company))->resolve()]);
    }
}
