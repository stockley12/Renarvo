<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Services\AuditService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function show(): JsonResponse
    {
        TenantContext::clear();
        $rows = PlatformSetting::query()->get()->mapWithKeys(function ($r) {
            return [$r->key => PlatformSetting::get($r->key)];
        });

        return response()->json(['data' => $rows]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable'],
        ]);

        TenantContext::clear();
        foreach ($data['settings'] as $key => $value) {
            PlatformSetting::put((string) $key, $value);
        }

        $this->audit->log('settings.updated', $request->user(), 'PlatformSetting', null, [
            'keys' => array_keys($data['settings']),
        ], 'info', $request);

        return $this->show();
    }
}
