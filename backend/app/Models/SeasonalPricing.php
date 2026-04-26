<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class SeasonalPricing extends Model
{
    use BelongsToCompany;
    protected $table = 'seasonal_pricing';
    protected $fillable = ['company_id', 'name', 'start_date', 'end_date', 'adjustment_pct', 'active'];
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'active' => 'boolean',
    ];
}
