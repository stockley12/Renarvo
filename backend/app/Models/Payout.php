<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payout extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id', 'period', 'gross', 'commission', 'net',
        'status', 'paid_at', 'reference',
    ];

    protected $casts = ['paid_at' => 'datetime'];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
