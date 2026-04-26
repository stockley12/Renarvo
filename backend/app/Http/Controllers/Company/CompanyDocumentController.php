<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\CompanyDocument;
use App\Services\AuditService;
use App\Services\ImageUploadService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyDocumentController extends Controller
{
    public function __construct(
        private readonly ImageUploadService $files,
        private readonly AuditService $audit,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        return response()->json(['data' => CompanyDocument::query()->orderByDesc('id')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:trade_registry,tax_certificate,operating_license,insurance'],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $path = $this->files->storeCompanyDocument($request->file('file'), $companyId);

        $doc = CompanyDocument::query()->create([
            'company_id' => $companyId,
            'type' => $data['type'],
            'file_path' => $path,
            'status' => 'pending',
            'expires_at' => $data['expires_at'] ?? null,
        ]);

        $this->audit->log('document.uploaded', $request->user(), 'CompanyDocument', $doc->id, [
            'type' => $doc->type,
        ], 'info', $request);

        return response()->json(['data' => $doc], 201);
    }
}
