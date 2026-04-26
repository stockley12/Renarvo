<?php

namespace App\Jobs\Handlers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendEmailHandler implements JobHandlerInterface
{
    public function handle(array $payload): void
    {
        $to = $payload['to'] ?? null;
        $subject = $payload['subject'] ?? '(no subject)';
        $body = $payload['body'] ?? '';

        if (empty($to)) {
            Log::warning('SendEmailHandler skipped: missing recipient', $payload);
            return;
        }

        try {
            Mail::raw($body, function ($message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::error('SendEmailHandler failed', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
