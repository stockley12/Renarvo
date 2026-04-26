<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'owner_user_id', 'slug', 'name', 'city', 'description', 'logo_path', 'logo_color',
        'phone', 'tax_number', 'address', 'status', 'founded_year', 'commission_rate_bps',
        'languages_spoken', 'rating_avg', 'review_count', 'fleet_size',
    ];

    protected $casts = [
        'rating_avg' => 'decimal:2',
        'review_count' => 'integer',
        'fleet_size' => 'integer',
        'commission_rate_bps' => 'integer',
        'founded_year' => 'integer',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function cars(): HasMany
    {
        return $this->hasMany(Car::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function staff(): HasMany
    {
        return $this->hasMany(CompanyStaff::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CompanyDocument::class);
    }

    public function bankAccount(): HasOne
    {
        return $this->hasOne(CompanyBankAccount::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }
}
