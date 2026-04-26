<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class LengthDiscount extends Model
{
    use BelongsToCompany;
    protected $fillable = ['company_id', 'min_days', 'discount_pct'];
}
