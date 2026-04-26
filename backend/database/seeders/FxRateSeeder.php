<?php

namespace Database\Seeders;

use App\Models\FxRate;
use Illuminate\Database\Seeder;

class FxRateSeeder extends Seeder
{
    public function run(): void
    {
        // Static fallback rates relative to TRY (multiply TRY value by `rate` to get target).
        $rates = [
            'TRY' => 1,
            'USD' => 0.031,
            'EUR' => 0.029,
            'RUB' => 2.85,
        ];

        $now = now();

        foreach ($rates as $target => $rate) {
            FxRate::query()->updateOrCreate(
                ['base_currency' => 'TRY', 'target_currency' => $target],
                ['rate' => $rate, 'fetched_at' => $now]
            );
        }
    }
}
