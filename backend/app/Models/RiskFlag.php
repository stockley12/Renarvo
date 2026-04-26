<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiskFlag extends Model
{
    protected $fillable = [
        'type', 'subject_type', 'subject_id', 'reason', 'score',
        'status', 'reviewer_id', 'resolved_at',
    ];

    protected $casts = ['resolved_at' => 'datetime'];
}
