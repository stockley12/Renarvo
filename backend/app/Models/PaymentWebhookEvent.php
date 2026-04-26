<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentWebhookEvent extends Model
{
    protected $fillable = [
        'provider', 'event_id', 'event_type', 'payload', 'status', 'error',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
