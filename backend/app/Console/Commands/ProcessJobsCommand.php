<?php

namespace App\Console\Commands;

use App\Jobs\JobRegistry;
use App\Models\Job;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessJobsCommand extends Command
{
    protected $signature = 'renarvo:process-jobs {--max=50 : Maximum jobs to process per invocation}';
    protected $description = 'Process pending jobs from the database queue (cron-driven worker substitute).';

    public function handle(JobRegistry $registry): int
    {
        $max = (int) $this->option('max');
        $processed = 0;
        $deadline = now()->addSeconds(45);

        while ($processed < $max && now()->lt($deadline)) {
            $job = $this->lockNextJob();
            if ($job === null) {
                break;
            }

            try {
                $handler = $registry->resolve($job->type);
                $handler->handle($job->payload ?? []);

                $job->status = 'completed';
                $job->completed_at = now();
                $job->error = null;
                $job->save();
            } catch (Throwable $e) {
                $job->attempts++;
                $job->error = substr($e->getMessage(), 0, 1000);
                if ($job->attempts >= $job->max_attempts) {
                    $job->status = 'failed';
                    $job->completed_at = now();
                    Log::error('Job permanently failed', [
                        'id' => $job->id,
                        'type' => $job->type,
                        'error' => $e->getMessage(),
                    ]);
                } else {
                    $job->status = 'pending';
                    $job->run_after = now()->addMinutes(2 ** $job->attempts);
                }
                $job->save();
            }

            $processed++;
        }

        $this->info("Processed {$processed} jobs.");
        return self::SUCCESS;
    }

    private function lockNextJob(): ?Job
    {
        return DB::transaction(function () {
            $row = DB::table('jobs')
                ->where('status', 'pending')
                ->where('run_after', '<=', now())
                ->orderBy('id')
                ->lockForUpdate()
                ->first();

            if ($row === null) {
                return null;
            }

            DB::table('jobs')->where('id', $row->id)->update([
                'status' => 'running',
                'started_at' => now(),
                'updated_at' => now(),
            ]);

            return Job::query()->find($row->id);
        });
    }
}
