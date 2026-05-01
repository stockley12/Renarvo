<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyExtra extends Model
{
    use BelongsToCompany;

    public const CHARGE_PER_DAY = 'per_day';
    public const CHARGE_PER_RENTAL = 'per_rental';
    public const CHARGE_FREE = 'free';

    protected $fillable = [
        'company_id', 'code', 'name', 'price_per_day', 'price_per_rental',
        'charge_mode', 'is_active', 'sort_order', 'description',
    ];

    protected $casts = [
        'price_per_day' => 'integer',
        'price_per_rental' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
