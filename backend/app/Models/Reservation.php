<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reservation extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_NO_SHOW = 'no_show';

    protected $fillable = [
        'code', 'car_id', 'company_id', 'customer_id', 'pickup_at', 'return_at',
        'actual_return_at', 'pickup_location', 'return_location', 'days',
        'base_price', 'extras_price', 'discount_amount', 'service_fee', 'tax_amount', 'total_price',
        'currency_snapshot', 'fx_rate_snapshot', 'status', 'idempotency_key', 'promo_code',
        'cancellation_reason', 'notes', 'flight_number', 'driving_license_number', 'date_of_birth',
    ];

    protected $casts = [
        'pickup_at' => 'datetime',
        'return_at' => 'datetime',
        'actual_return_at' => 'datetime',
        'date_of_birth' => 'date',
        'fx_rate_snapshot' => 'decimal:6',
    ];

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function extras(): HasMany
    {
        return $this->hasMany(ReservationExtra::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
