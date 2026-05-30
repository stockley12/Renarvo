<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class RateLimiterService
{
    public function consume(string $key, int $maxTokens, int $refillSeconds, int $cost = 1): bool
    {
        return DB::transaction(function () use ($key, $maxTokens, $refillSeconds, $cost) {
            $bucket = DB::table('rate_limit_buckets')
                ->where('key', $key)
                ->lockForUpdate()
                ->first();

            $now = now();

            if (! $bucket) {
                if ($cost > $maxTokens) {
                    return false;
                }

                DB::table('rate_limit_buckets')->insert([
                    'key' => $key,
                    'tokens' => $maxTokens - $cost,
                    'max_tokens' => $maxTokens,
                    'refill_seconds' => $refillSeconds,
                    'last_refill_at' => $now,
                ]);

                return true;
            }

            // Carbon 3 returns a SIGNED diff (negative for past dates), so take
            // the absolute elapsed seconds to avoid negative "refills" that
            // would drain the bucket on every call.
            $elapsed = (int) abs(Carbon::parse($bucket->last_refill_at)->diffInSeconds($now));
            $refill = (int) floor($elapsed * ($maxTokens / max(1, $refillSeconds)));
            // Clamp into [0, maxTokens] so a bucket can never go negative.
            $tokens = max(0, min($maxTokens, (int) $bucket->tokens + $refill));

            if ($tokens < $cost) {
                DB::table('rate_limit_buckets')
                    ->where('key', $key)
                    ->update([
                        'tokens' => $tokens,
                        'last_refill_at' => $now,
                    ]);

                return false;
            }

            DB::table('rate_limit_buckets')
                ->where('key', $key)
                ->update([
                    'tokens' => $tokens - $cost,
                    'max_tokens' => $maxTokens,
                    'refill_seconds' => $refillSeconds,
                    'last_refill_at' => $now,
                ]);

            return true;
        });
    }
}
