<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\PromoCode;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyPromoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        return response()->json(['data' => PromoCode::query()->orderByDesc('id')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:32'],
            'discount_type' => ['required', 'in:percent,fixed'],
            'discount_value' => ['required', 'integer', 'min:1'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'expires_at' => ['nullable', 'date'],
            'active' => ['nullable', 'boolean'],
        ]);

        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $promo = PromoCode::query()->create(array_merge($data, [
            'company_id' => $companyId,
            'code' => strtoupper($data['code']),
            'used_count' => 0,
            'active' => $data['active'] ?? true,
        ]));

        return response()->json(['data' => $promo], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $promo = PromoCode::query()->findOrFail($id);
        $data = $request->validate([
            'discount_value' => ['sometimes', 'integer', 'min:1'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'expires_at' => ['nullable', 'date'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $promo->fill($data)->save();

        return response()->json(['data' => $promo]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        PromoCode::query()->where('id', $id)->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
