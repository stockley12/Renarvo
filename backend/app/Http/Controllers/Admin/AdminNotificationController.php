<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BroadcastMessage;
use App\Models\User;
use App\Services\AuditService;
use App\Services\JobDispatcher;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly JobDispatcher $jobs,
    ) {}

    public function index(Request $request): JsonResponse
    {
        TenantContext::clear();
        $rows = BroadcastMessage::query()->orderByDesc('id')->limit(100)->get();
        return response()->json(['data' => $rows]);
    }

    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'audience' => ['required', 'in:all,customers,companies,company_owners,company_staff'],
            'channels' => ['required', 'array', 'min:1'],
            'channels.*' => ['in:email,in_app'],
            'subject' => ['required', 'string', 'max:191'],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        TenantContext::clear();

        $userQuery = User::query()->where('status', 'active');
        match ($data['audience']) {
            'customers' => $userQuery->where('role', 'customer'),
            'companies', 'company_owners' => $userQuery->where('role', 'company_owner'),
            'company_staff' => $userQuery->where('role', 'company_staff'),
            default => null,
        };

        $recipients = $userQuery->select('id', 'email', 'name')->get();

        $broadcast = BroadcastMessage::query()->create([
            'sender_id' => $request->user()->id,
            'audience' => $data['audience'],
            'channels' => $data['channels'],
            'subject' => $data['subject'],
            'body' => $data['body'],
            'total_recipients' => $recipients->count(),
            'sent_at' => now(),
        ]);

        foreach ($recipients as $u) {
            if (in_array('in_app', $data['channels'], true)) {
                $this->jobs->dispatch('create_notification', [
                    'user_id' => $u->id,
                    'type' => 'broadcast',
                    'title' => $data['subject'],
                    'body' => $data['body'],
                    'data' => ['broadcast_id' => $broadcast->id],
                ]);
            }
            if (in_array('email', $data['channels'], true) && $u->email) {
                $this->jobs->dispatch('send_email', [
                    'to' => $u->email,
                    'subject' => 'Renarvo: ' . $data['subject'],
                    'body' => $data['body'],
                ]);
            }
        }

        $this->audit->log('broadcast.sent', $request->user(), 'BroadcastMessage', $broadcast->id, [
            'recipients' => $recipients->count(),
            'audience' => $data['audience'],
        ], 'info', $request);

        return response()->json(['data' => $broadcast], 201);
    }
}
