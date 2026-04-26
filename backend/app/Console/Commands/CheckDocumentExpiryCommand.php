<?php

namespace App\Console\Commands;

use App\Models\CompanyDocument;
use App\Models\User;
use App\Services\JobDispatcher;
use App\Support\TenantContext;
use Illuminate\Console\Command;

class CheckDocumentExpiryCommand extends Command
{
    protected $signature = 'renarvo:check-document-expiry';
    protected $description = 'Notify company owners when documents are about to expire (30/14/7 days).';

    public function handle(JobDispatcher $dispatcher): int
    {
        TenantContext::clear();

        $thresholds = [30, 14, 7];
        $count = 0;

        foreach ($thresholds as $days) {
            $target = now()->addDays($days)->startOfDay();
            CompanyDocument::query()
                ->whereDate('expires_at', $target->toDateString())
                ->with('company.owner:id,name,email')
                ->chunkById(100, function ($docs) use (&$count, $dispatcher, $days) {
                    foreach ($docs as $doc) {
                        $owner = optional($doc->company)->owner;
                        if (!$owner instanceof User) {
                            continue;
                        }
                        $dispatcher->dispatch('create_notification', [
                            'user_id' => $owner->id,
                            'type' => 'document_expiring',
                            'title' => 'Document expiring soon',
                            'body' => "Your {$doc->type} document expires in {$days} day(s).",
                            'data' => ['document_id' => $doc->id, 'days_left' => $days],
                        ]);
                        $count++;
                    }
                });
        }

        $this->info("Queued {$count} document expiry notifications.");
        return self::SUCCESS;
    }
}
