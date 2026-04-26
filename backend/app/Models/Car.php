<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Car extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_DRAFT = 'draft';
    public const STATUS_MAINTENANCE = 'maintenance';
    public const STATUS_HIDDEN = 'hidden';

    protected $fillable = [
        'company_id', 'brand', 'model', 'year', 'category', 'transmission', 'fuel',
        'seats', 'doors', 'price_per_day', 'weekly_price', 'city', 'deposit',
        'mileage_policy', 'instant_book', 'status', 'plate', 'vin', 'description',
        'min_driver_age', 'rating_avg', 'review_count', 'image_seed',
    ];

    protected $casts = [
        'instant_book' => 'boolean',
        'price_per_day' => 'integer',
        'weekly_price' => 'integer',
        'deposit' => 'integer',
        'rating_avg' => 'decimal:2',
        'review_count' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function features(): HasMany
    {
        return $this->hasMany(CarFeature::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(CarImage::class)->orderBy('position');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
