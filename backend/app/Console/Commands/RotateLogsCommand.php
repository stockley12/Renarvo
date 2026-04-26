<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RotateLogsCommand extends Command
{
    protected $signature = 'renarvo:rotate-logs {--keep=14}';
    protected $description = 'Delete log files older than --keep days (Monolog daily handler also rotates).';

    public function handle(): int
    {
        $keep = (int) $this->option('keep');
        $cutoff = now()->subDays($keep)->getTimestamp();
        $dir = storage_path('logs');

        if (!is_dir($dir)) {
            $this->info('No logs directory.');
            return self::SUCCESS;
        }

        $deleted = 0;
        foreach (scandir($dir) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $path = $dir . DIRECTORY_SEPARATOR . $entry;
            if (is_file($path) && filemtime($path) < $cutoff && str_ends_with($entry, '.log')) {
                @unlink($path);
                $deleted++;
            }
        }

        $this->info("Rotated logs, removed {$deleted} files.");
        return self::SUCCESS;
    }
}
