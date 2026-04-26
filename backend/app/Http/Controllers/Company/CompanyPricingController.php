<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\LengthDiscount;
use App\Models\SeasonalPricing;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompanyPricingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        return response()->json([
            'data' => [
                'seasonal' => SeasonalPricing::query()->orderBy('start_date')->get(),
                'length_discounts' => LengthDiscount::query()->orderBy('min_days')->get(),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'seasonal' => ['nullable', 'array'],
            'seasonal.*.name' => ['required', 'string', 'max:191'],
            'seasonal.*.start_date' => ['required', 'date'],
            'seasonal.*.end_date' => ['required', 'date', 'after_or_equal:seasonal.*.start_date'],
            'seasonal.*.adjustment_pct' => ['required', 'integer', 'min:-99', 'max:300'],
            'seasonal.*.active' => ['nullable', 'boolean'],

            'length_discounts' => ['nullable', 'array'],
            'length_discounts.*.min_days' => ['required', 'integer', 'min:1', 'max:90'],
            'length_discounts.*.discount_pct' => ['required', 'integer', 'min:0', 'max:90'],
        ]);

        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        DB::transaction(function () use ($data, $companyId) {
            SeasonalPricing::query()->where('company_id', $companyId)->delete();
            foreach ($data['seasonal'] ?? [] as $row) {
                SeasonalPricing::query()->create(array_merge($row, ['company_id' => $companyId]));
            }

            LengthDiscount::query()->where('company_id', $companyId)->delete();
            foreach ($data['length_discounts'] ?? [] as $row) {
                LengthDiscount::query()->create(array_merge($row, ['company_id' => $companyId]));
            }
        });

        return response()->json([
            'data' => [
                'seasonal' => SeasonalPricing::query()->orderBy('start_date')->get(),
                'length_discounts' => LengthDiscount::query()->orderBy('min_days')->get(),
            ],
        ]);
    }
}
