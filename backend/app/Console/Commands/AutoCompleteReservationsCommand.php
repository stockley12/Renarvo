<?php

namespace App\Console\Commands;

use App\Models\Reservation;
use App\Services\JobDispatcher;
use App\Support\TenantContext;
use Illuminate\Console\Command;

class AutoCompleteReservationsCommand extends Command
{
    protected $signature = 'renarvo:auto-complete-reservations';
    protected $description = 'Mark active reservations whose dropoff_at has passed as completed.';

    public function handle(JobDispatcher $dispatcher): int
    {
        TenantContext::clear();

        $count = 0;
        Reservation::query()
            ->where('status', 'active')
            ->where('return_at', '<', now())
            ->chunkById(100, function ($reservations) use (&$count, $dispatcher) {
                foreach ($reservations as $r) {
                    $r->status = 'completed';
                    $r->actual_return_at = $r->actual_return_at ?? now();
                    $r->save();
                    $count++;

                    $dispatcher->dispatch('create_notification', [
                        'user_id' => $r->customer_id,
                        'type' => 'reservation_completed',
                        'title' => 'Reservation completed',
                        'body' => "Reservation #{$r->code} marked as completed.",
                        'data' => ['reservation_id' => $r->id],
                    ]);
                }
            });

        $this->info("Auto-completed {$count} reservations.");
        return self::SUCCESS;
    }
}
