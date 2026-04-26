<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\CompanyBankAccount;
use App\Models\Payout;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyPayoutController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        return response()->json([
            'data' => [
                'payouts' => Payout::query()->orderByDesc('period')->get(),
                'bank_account' => CompanyBankAccount::query()->where('company_id', $companyId)->first(),
            ],
        ]);
    }

    public function updateBank(Request $request): JsonResponse
    {
        $data = $request->validate([
            'iban' => ['required', 'string', 'max:64'],
            'account_holder' => ['required', 'string', 'max:191'],
            'bank_name' => ['nullable', 'string', 'max:191'],
        ]);

        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $bank = CompanyBankAccount::query()->updateOrCreate(
            ['company_id' => $companyId],
            $data,
        );

        return response()->json(['data' => $bank]);
    }
}
