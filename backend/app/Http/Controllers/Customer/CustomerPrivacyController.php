<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\ConsentLog;
use App\Models\DataExportRequest;
use App\Services\AuditService;
use App\Services\JobDispatcher;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerPrivacyController extends Controller
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly JobDispatcher $jobs,
    ) {}

    public function recordConsent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'purpose' => ['required', 'in:tos,privacy,marketing,cookies'],
            'version' => ['required', 'string', 'max:32'],
            'granted' => ['nullable', 'boolean'],
        ]);

        TenantContext::clear();

        $log = ConsentLog::query()->create([
            'user_id' => optional($request->user())->id,
            'email' => optional($request->user())->email,
            'purpose' => $data['purpose'],
            'version' => $data['version'],
            'granted' => $data['granted'] ?? true,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $log], 201);
    }

    public function requestDataExport(Request $request): JsonResponse
    {
        TenantContext::clear();
        $exportRequest = DataExportRequest::query()->create([
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        $this->audit->log('privacy.export_requested', $request->user(), 'DataExportRequest', $exportRequest->id, [], 'info', $request);

        $this->jobs->dispatch('send_email', [
            'to' => $request->user()->email,
            'subject' => 'Renarvo: Data export requested',
            'body' => "We received your data export request. You'll receive a download link within 24 hours.",
        ]);

        return response()->json(['data' => $exportRequest], 202);
    }

    public function eraseAccount(Request $request): JsonResponse
    {
        $request->validate([
            'confirmation' => ['required', 'in:DELETE'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        TenantContext::clear();

        $this->audit->log('privacy.erasure_requested', $user, 'User', $user->id, [
            'reason' => $request->input('reason'),
        ], 'warning', $request);

        $user->status = 'banned';
        $user->email = 'erased+' . $user->id . '@renarvo.invalid';
        $user->name = 'Erased user';
        $user->phone = null;
        $user->avatar_path = null;
        $user->token_version = $user->token_version + 1;
        $user->save();
        $user->delete();

        return response()->json(['data' => ['ok' => true]]);
    }
}
