<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyStaff extends Model
{
    protected $table = 'company_staff';
    protected $fillable = ['company_id', 'user_id', 'role', 'invited_at'];
    protected $casts = ['invited_at' => 'datetime'];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
