<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use BelongsToCompany;

    public const STATUS_PENDING = 'pending';
    public const STATUS_AUTHORIZED = 'authorized';
    public const STATUS_CAPTURED = 'captured';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'reservation_id', 'company_id', 'provider', 'provider_reference', 'method',
        'amount', 'currency', 'status', 'metadata', 'captured_at', 'refunded_at',
        'order_id', 'trans_id', 'amount_try', 'installment',
        'hash_inbound_ok', 'error_msg',
        'raw_request', 'raw_response', 'raw_callback', 'raw_status_query',
    ];

    protected $casts = [
        'metadata' => 'array',
        'captured_at' => 'datetime',
        'refunded_at' => 'datetime',
        'amount' => 'integer',
        'amount_try' => 'integer',
        'installment' => 'integer',
        'hash_inbound_ok' => 'boolean',
        'raw_request' => 'array',
        'raw_response' => 'array',
        'raw_callback' => 'array',
        'raw_status_query' => 'array',
    ];

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
