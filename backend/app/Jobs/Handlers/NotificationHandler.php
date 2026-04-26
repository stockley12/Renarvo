<?php

namespace App\Jobs\Handlers;

use App\Models\Notification;

class NotificationHandler implements JobHandlerInterface
{
    public function handle(array $payload): void
    {
        Notification::query()->create([
            'user_id' => $payload['user_id'] ?? null,
            'type' => $payload['type'] ?? 'system',
            'title' => $payload['title'] ?? '',
            'body' => $payload['body'] ?? '',
            'data' => $payload['data'] ?? [],
            'read_at' => null,
        ]);
    }
}
