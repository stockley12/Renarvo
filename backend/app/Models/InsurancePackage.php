<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InsurancePackage extends Model
{
    use BelongsToCompany;

    public const TIER_MINI = 'mini';
    public const TIER_MID = 'mid';
    public const TIER_FULL = 'full';

    public const TIERS = [self::TIER_MINI, self::TIER_MID, self::TIER_FULL];

    protected $fillable = [
        'company_id', 'tier', 'name', 'price_per_day', 'deductible_amount',
        'coverage_amount', 'is_active', 'description', 'included_features',
    ];

    protected $casts = [
        'price_per_day' => 'integer',
        'deductible_amount' => 'integer',
        'coverage_amount' => 'integer',
        'is_active' => 'boolean',
        'included_features' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
