<?php

namespace App\Services;

use App\Models\Job;
use Carbon\CarbonInterface;

class JobDispatcher
{
    public function dispatch(string $type, array $payload, ?CarbonInterface $runAfter = null, int $maxAttempts = 3): Job
    {
        return Job::query()->create([
            'type' => $type,
            'payload' => $payload,
            'status' => 'pending',
            'attempts' => 0,
            'max_attempts' => $maxAttempts,
            'run_after' => $runAfter ?? now(),
        ]);
    }
}
