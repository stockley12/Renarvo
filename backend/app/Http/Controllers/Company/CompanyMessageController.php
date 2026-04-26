<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageThread;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyMessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $threads = MessageThread::query()
            ->with(['customer:id,name,email', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->orderByDesc('last_message_at')
            ->paginate(20);

        return response()->json([
            'data' => $threads->getCollection(),
            'meta' => ['page' => $threads->currentPage(), 'total' => $threads->total(), 'has_next' => $threads->hasMorePages()],
        ]);
    }

    public function show(Request $request, int $threadId): JsonResponse
    {
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $thread = MessageThread::query()->with(['messages.sender:id,name,role', 'customer:id,name,email'])->findOrFail($threadId);

        Message::query()
            ->where('thread_id', $thread->id)
            ->whereNull('read_at')
            ->where('sender_id', '!=', $request->user()->id)
            ->update(['read_at' => now()]);

        return response()->json(['data' => $thread]);
    }

    public function reply(Request $request, int $threadId): JsonResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:5000']]);
        $companyId = $request->attributes->get('company_id');
        TenantContext::set($companyId);

        $thread = MessageThread::query()->findOrFail($threadId);

        $message = Message::query()->create([
            'thread_id' => $thread->id,
            'sender_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        $thread->update(['last_message_at' => now()]);

        return response()->json(['data' => $message], 201);
    }
}
