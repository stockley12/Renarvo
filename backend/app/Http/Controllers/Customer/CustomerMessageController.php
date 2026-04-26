<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageThread;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerMessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        TenantContext::clear();

        $threads = MessageThread::query()
            ->withoutGlobalScopes()
            ->with(['company:id,name,slug', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->where('customer_id', $request->user()->id)
            ->orderByDesc('last_message_at')
            ->paginate(20);

        return response()->json([
            'data' => $threads->getCollection(),
            'meta' => [
                'page' => $threads->currentPage(),
                'total' => $threads->total(),
                'has_next' => $threads->hasMorePages(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'reservation_id' => ['nullable', 'integer'],
            'subject' => ['nullable', 'string', 'max:191'],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $thread = DB::transaction(function () use ($data, $request) {
            $thread = MessageThread::query()->withoutGlobalScopes()->firstOrCreate(
                [
                    'customer_id' => $request->user()->id,
                    'company_id' => $data['company_id'],
                    'reservation_id' => $data['reservation_id'] ?? null,
                ],
                ['subject' => $data['subject'] ?? null]
            );

            Message::query()->create([
                'thread_id' => $thread->id,
                'sender_id' => $request->user()->id,
                'body' => $data['body'],
            ]);

            $thread->update(['last_message_at' => now()]);

            return $thread;
        });

        return response()->json(['data' => $thread->load('messages')], 201);
    }
}
