<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyDocument extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id', 'type', 'file_path', 'status', 'expires_at', 'reviewed_by',
    ];

    protected $casts = ['expires_at' => 'date'];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
