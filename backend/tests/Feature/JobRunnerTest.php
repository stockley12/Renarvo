<?php

namespace Tests\Feature;

use App\Jobs\JobRegistry;
use App\Models\Job;
use App\Models\Notification;
use App\Models\User;
use App\Services\JobDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class JobRunnerTest extends TestCase
{
    use RefreshDatabase;

    public function test_dispatcher_creates_pending_job(): void
    {
        $dispatcher = app(JobDispatcher::class);
        $job = $dispatcher->dispatch(JobRegistry::CREATE_NOTIFICATION, ['user_id' => 1, 'title' => 't', 'body' => 'b']);

        $this->assertEquals('pending', $job->status);
        $this->assertEquals(0, $job->attempts);
    }

    public function test_process_jobs_executes_notification_handler(): void
    {
        $user = User::query()->create([
            'email' => 'recipient@example.com',
            'password_hash' => Hash::make('x'),
            'name' => 'R',
            'role' => 'customer',
        ]);

        Job::query()->create([
            'type' => JobRegistry::CREATE_NOTIFICATION,
            'payload' => [
                'user_id' => $user->id,
                'type' => 'demo',
                'title' => 'Hello',
                'body' => 'world',
            ],
            'status' => 'pending',
            'attempts' => 0,
            'max_attempts' => 3,
            'run_after' => now()->subSecond(),
        ]);

        $this->artisan('renarvo:process-jobs')->assertExitCode(0);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'title' => 'Hello',
        ]);
        $this->assertDatabaseHas('jobs', [
            'status' => 'completed',
            'type' => JobRegistry::CREATE_NOTIFICATION,
        ]);
    }

    public function test_unknown_job_type_marks_failed_after_max_attempts(): void
    {
        $job = Job::query()->create([
            'type' => 'does_not_exist',
            'payload' => [],
            'status' => 'pending',
            'attempts' => 2,
            'max_attempts' => 3,
            'run_after' => now()->subSecond(),
        ]);

        $this->artisan('renarvo:process-jobs')->assertExitCode(0);

        $job->refresh();
        $this->assertEquals('failed', $job->status);
    }
}
