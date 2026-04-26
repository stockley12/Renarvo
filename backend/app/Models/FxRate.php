<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FxRate extends Model
{
    protected $fillable = ['base_currency', 'target_currency', 'rate', 'fetched_at'];
    protected $casts = [
        'rate' => 'decimal:6',
        'fetched_at' => 'datetime',
    ];

    public static function latest(string $target): ?self
    {
        return self::query()
            ->where('target_currency', $target)
            ->orderByDesc('fetched_at')
            ->first();
    }
}
