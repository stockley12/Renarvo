<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    protected $fillable = [
        'type', 'payload', 'status', 'attempts', 'max_attempts',
        'run_after', 'started_at', 'completed_at', 'error',
    ];

    protected $casts = [
        'payload' => 'array',
        'run_after' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
}
