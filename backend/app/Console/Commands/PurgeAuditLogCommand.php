<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use Illuminate\Console\Command;

class PurgeAuditLogCommand extends Command
{
    protected $signature = 'renarvo:purge-audit-log {--keep=365}';
    protected $description = 'Delete audit log entries older than retention window.';

    public function handle(): int
    {
        $keep = (int) $this->option('keep');
        $deleted = AuditLog::query()->where('created_at', '<', now()->subDays($keep))->delete();
        $this->info("Purged {$deleted} audit log entries.");
        return self::SUCCESS;
    }
}
