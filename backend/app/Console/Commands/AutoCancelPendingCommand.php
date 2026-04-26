<?php

namespace App\Console\Commands;

use App\Models\Reservation;
use App\Support\TenantContext;
use Illuminate\Console\Command;

class AutoCancelPendingCommand extends Command
{
    protected $signature = 'renarvo:auto-cancel-pending';
    protected $description = 'Cancel pending reservations not confirmed by the company within 24 hours.';

    public function handle(): int
    {
        TenantContext::clear();

        $cutoff = now()->subHours(24);
        $count = Reservation::query()
            ->where('status', 'pending')
            ->where('created_at', '<', $cutoff)
            ->update([
                'status' => 'cancelled',
                'cancellation_reason' => 'system: company_no_response_24h',
            ]);

        $this->info("Auto-cancelled {$count} stale pending reservations.");
        return self::SUCCESS;
    }
}
