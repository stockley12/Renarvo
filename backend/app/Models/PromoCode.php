<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class PromoCode extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id', 'code', 'discount_type', 'discount_value', 'max_uses',
        'used_count', 'expires_at', 'active',
    ];

    protected $casts = [
        'expires_at' => 'date',
        'active' => 'boolean',
    ];
}
