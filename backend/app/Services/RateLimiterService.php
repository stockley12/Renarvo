<?php

namespace App\Services;

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

            $elapsed = $now->diffInSeconds($bucket->last_refill_at);
            $refill = (int) floor($elapsed * ($maxTokens / max(1, $refillSeconds)));
            $tokens = min($maxTokens, $bucket->tokens + $refill);

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
