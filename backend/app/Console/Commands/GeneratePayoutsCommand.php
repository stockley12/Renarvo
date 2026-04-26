<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Payout;
use App\Models\Reservation;
use App\Support\TenantContext;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GeneratePayoutsCommand extends Command
{
    protected $signature = 'renarvo:generate-payouts';
    protected $description = 'Generate weekly payout records for completed reservations.';

    public function handle(): int
    {
        TenantContext::clear();

        $weekStart = now()->subWeek()->startOfWeek();
        $weekEnd = now()->subWeek()->endOfWeek();
        $period = $weekStart->format('o-\WW');

        $commissionBps = (int) config('services.platform.commission_bps', 1500);
        $count = 0;

        Company::query()
            ->where('status', 'approved')
            ->chunkById(50, function ($companies) use (&$count, $weekStart, $weekEnd, $period, $commissionBps) {
                foreach ($companies as $company) {
                    $exists = Payout::query()
                        ->where('company_id', $company->id)
                        ->where('period', $period)
                        ->exists();
                    if ($exists) {
                        continue;
                    }

                    $rows = Reservation::query()
                        ->where('company_id', $company->id)
                        ->where('status', 'completed')
                        ->whereBetween('actual_return_at', [$weekStart, $weekEnd])
                        ->select('id', 'total_price')
                        ->get();

                    if ($rows->isEmpty()) {
                        continue;
                    }

                    $rate = $company->commission_rate_bps ?: $commissionBps;
                    $gross = (int) $rows->sum('total_price');
                    $commission = (int) round($gross * $rate / 10000);
                    $net = $gross - $commission;

                    Payout::query()->create([
                        'company_id' => $company->id,
                        'period' => $period,
                        'gross' => $gross,
                        'commission' => $commission,
                        'net' => $net,
                        'status' => 'pending',
                    ]);
                    $count++;
                }
            });

        $this->info("Generated {$count} payout records for period {$period}.");
        return self::SUCCESS;
    }
}
