<?php

namespace App\Console\Commands;

use App\Jobs\JobRegistry;
use App\Models\Reservation;
use App\Services\JobDispatcher;
use App\Support\TenantContext;
use Illuminate\Console\Command;

class SendPickupRemindersCommand extends Command
{
    protected $signature = 'renarvo:send-pickup-reminders';
    protected $description = 'Notify customers with pickups in the next 24 hours.';

    public function handle(JobDispatcher $dispatcher): int
    {
        TenantContext::clear();

        $start = now();
        $end = now()->addDay();
        $count = 0;

        Reservation::query()
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereBetween('pickup_at', [$start, $end])
            ->with('customer:id,email,name')
            ->chunkById(100, function ($reservations) use (&$count, $dispatcher) {
                foreach ($reservations as $r) {
                    if ($r->customer && $r->customer->email) {
                        $dispatcher->dispatch(JobRegistry::SEND_EMAIL, [
                            'to' => $r->customer->email,
                            'subject' => 'Renarvo: Pickup reminder',
                            'body' => "Hi {$r->customer->name},\n\nReminder: your pickup for reservation #{$r->code} is at {$r->pickup_at}.\n\nThank you for choosing Renarvo.",
                        ]);
                        $count++;
                    }
                }
            });

        $this->info("Queued {$count} pickup reminders.");
        return self::SUCCESS;
    }
}
