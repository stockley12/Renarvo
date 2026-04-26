<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\FxRate;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function show(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'disk' => $this->checkDisk(),
            'fx_rates' => $this->checkFxRates(),
            'cron' => $this->checkCron(),
        ];

        $allUp = collect($checks)->every(fn ($c) => in_array($c['status'], ['up', 'ok', 'fresh'], true));

        return response()->json([
            'status' => $allUp ? 'healthy' : 'degraded',
            'checks' => $checks,
            'version' => config('app.version', '0.1.0'),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    private function checkDatabase(): array
    {
        $start = microtime(true);

        try {
            DB::connection()->getPdo();
            DB::select('SELECT 1');

            return [
                'status' => 'up',
                'latency_ms' => (int) ((microtime(true) - $start) * 1000),
            ];
        } catch (\Throwable $e) {
            return ['status' => 'down', 'error' => $e->getMessage()];
        }
    }

    private function checkDisk(): array
    {
        $free = @disk_free_space(base_path());
        $total = @disk_total_space(base_path());

        if (! $free || ! $total) {
            return ['status' => 'unknown'];
        }

        $usedPct = (int) ((1 - $free / $total) * 100);

        return [
            'status' => $usedPct < 90 ? 'ok' : 'critical',
            'used_pct' => $usedPct,
        ];
    }

    private function checkFxRates(): array
    {
        try {
            $rate = FxRate::query()->orderByDesc('fetched_at')->first();
            if (! $rate) {
                return ['status' => 'missing', 'last_updated' => null];
            }

            $ageHours = $rate->fetched_at->diffInHours(now());

            return [
                'status' => $ageHours < 36 ? 'fresh' : 'stale',
                'last_updated' => $rate->fetched_at->toIso8601String(),
            ];
        } catch (\Throwable) {
            return ['status' => 'unknown'];
        }
    }

    private function checkCron(): array
    {
        try {
            $lastJob = Job::query()
                ->whereIn('status', ['completed', 'failed'])
                ->orderByDesc('completed_at')
                ->first();

            if (! $lastJob || ! $lastJob->completed_at) {
                return ['status' => 'idle', 'last_run' => null];
            }

            $stale = $lastJob->completed_at->diffInMinutes(now()) > 10;

            return [
                'status' => $stale ? 'stale' : 'ok',
                'last_run' => $lastJob->completed_at->toIso8601String(),
            ];
        } catch (\Throwable) {
            return ['status' => 'unknown'];
        }
    }
}
