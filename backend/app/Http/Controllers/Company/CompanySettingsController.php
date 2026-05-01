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
            // Rental policy
            'min_rental_days' => ['sometimes', 'integer', 'min:1', 'max:30'],
            'kilometre_policy' => ['sometimes', 'in:unlimited,per_day_limit,total_limit'],
            'kilometre_limit_per_day_default' => ['nullable', 'integer', 'min:50', 'max:5000'],
            'min_driver_age_default' => ['sometimes', 'integer', 'min:18', 'max:99'],
            'student_friendly' => ['sometimes', 'boolean'],
            'roadside_24_7' => ['sometimes', 'boolean'],
            // Public contact / social
            'email_public' => ['nullable', 'email', 'max:191'],
            'whatsapp' => ['nullable', 'string', 'max:64'],
            'instagram' => ['nullable', 'string', 'max:191'],
            'facebook' => ['nullable', 'string', 'max:191'],
            'website' => ['nullable', 'string', 'max:191'],
        ]);

        $companyId = $request->attributes->get('company_id');
        $company = Company::query()->findOrFail($companyId);
        $company->fill($data)->save();

        $this->audit->log('company.updated', $request->user(), 'Company', $company->id, $data, 'info', $request);

        return response()->json(['data' => (new CompanyResource($company))->resolve()]);
    }
}
