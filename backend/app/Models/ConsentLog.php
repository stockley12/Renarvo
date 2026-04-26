<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsentLog extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'user_id', 'email', 'purpose', 'version', 'granted', 'ip_address', 'user_agent', 'created_at',
    ];

    protected $casts = [
        'granted' => 'boolean',
        'created_at' => 'datetime',
    ];
}
