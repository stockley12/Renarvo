<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FxRate;
use App\Models\Job;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminSystemHealthController extends Controller
{
    public function show(): JsonResponse
    {
        TenantContext::clear();

        $dbOk = true;
        $dbLatencyMs = null;
        try {
            $t0 = microtime(true);
            DB::select('select 1');
            $dbLatencyMs = (int) round((microtime(true) - $t0) * 1000);
        } catch (\Throwable) {
            $dbOk = false;
        }

        $diskFree = @disk_free_space(base_path());
        $diskTotal = @disk_total_space(base_path());

        $latestFx = FxRate::query()->orderByDesc('fetched_at')->value('fetched_at');
        $jobsPending = Job::query()->where('status', 'pending')->count();
        $jobsFailed = Job::query()->where('status', 'failed')->where('updated_at', '>=', now()->subDays(7))->count();
        $jobsLastRun = Job::query()->whereIn('status', ['completed', 'failed'])->max('completed_at');

        return response()->json([
            'data' => [
                'database' => [
                    'ok' => $dbOk,
                    'latency_ms' => $dbLatencyMs,
                ],
                'disk' => [
                    'free_bytes' => $diskFree ?: 0,
                    'total_bytes' => $diskTotal ?: 0,
                    'used_pct' => $diskTotal ? round(100 - ($diskFree / $diskTotal) * 100, 1) : null,
                ],
                'fx' => [
                    'last_refresh' => $latestFx,
                    'fresh' => $latestFx ? now()->diffInHours($latestFx) <= 36 : false,
                ],
                'jobs' => [
                    'pending' => $jobsPending,
                    'failed_7d' => $jobsFailed,
                    'last_run_at' => $jobsLastRun,
                ],
                'php' => [
                    'version' => PHP_VERSION,
                    'opcache_enabled' => function_exists('opcache_get_status') && (bool) (@opcache_get_status(false) ?: false),
                    'memory_peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
                ],
                'mail' => [
                    'mailer' => (string) config('mail.default', 'log'),
                    'host' => (string) config('mail.mailers.smtp.host', ''),
                    'port' => (int) config('mail.mailers.smtp.port', 0),
                    'encryption' => (string) config('mail.mailers.smtp.encryption', ''),
                    'from_address' => (string) config('mail.from.address', ''),
                    'configured' => (string) config('mail.default', 'log') === 'smtp'
                        && (string) config('mail.mailers.smtp.host', '') !== ''
                        && (string) config('mail.mailers.smtp.username', '') !== '',
                ],
            ],
        ]);
    }
}
