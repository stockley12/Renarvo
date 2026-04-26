<?php

namespace App\Console\Commands;

use App\Models\FxRate;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RefreshFxRatesCommand extends Command
{
    protected $signature = 'renarvo:refresh-fx-rates';
    protected $description = 'Refresh foreign exchange rates from external provider.';

    public function handle(): int
    {
        $base = strtoupper((string) config('services.fx.base', 'TRY'));
        $url = (string) config('services.fx.url', '');
        $targets = ['USD', 'EUR', 'GBP'];

        if ($url === '') {
            $this->warn('FX provider URL is not configured; using static fallback rates.');
            $this->seedFallback($base, $targets);
            return self::SUCCESS;
        }

        try {
            $response = Http::timeout(10)->get($url, ['base' => $base, 'symbols' => implode(',', $targets)]);
            if (!$response->ok()) {
                throw new \RuntimeException("FX HTTP {$response->status()}");
            }
            $data = $response->json();
            $rates = $data['rates'] ?? [];

            foreach ($targets as $target) {
                if (!isset($rates[$target])) {
                    continue;
                }
                FxRate::query()->create([
                    'base_currency' => $base,
                    'target_currency' => $target,
                    'rate' => (float) $rates[$target],
                    'fetched_at' => now(),
                ]);
            }

            Cache::forget('fx_rates_latest');
            $this->info('FX rates refreshed.');
        } catch (\Throwable $e) {
            Log::error('FX refresh failed', ['error' => $e->getMessage()]);
            $this->error('FX refresh failed: ' . $e->getMessage());
            $this->seedFallback($base, $targets);
        }

        return self::SUCCESS;
    }

    private function seedFallback(string $base, array $targets): void
    {
        $fallback = ['USD' => 0.031, 'EUR' => 0.029, 'GBP' => 0.025];
        foreach ($targets as $target) {
            if (!isset($fallback[$target])) {
                continue;
            }
            $exists = FxRate::query()
                ->where('target_currency', $target)
                ->where('fetched_at', '>', now()->subDay())
                ->exists();
            if ($exists) {
                continue;
            }
            FxRate::query()->create([
                'base_currency' => $base,
                'target_currency' => $target,
                'rate' => $fallback[$target],
                'fetched_at' => now(),
            ]);
        }
    }
}
