<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['key', 'value'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $row = self::find($key);
        if (! $row) {
            return $default;
        }

        $decoded = json_decode($row->value ?? '', true);

        return $decoded === null && $row->value !== 'null' ? $row->value : $decoded;
    }

    public static function put(string $key, mixed $value): self
    {
        return self::updateOrCreate(['key' => $key], ['value' => json_encode($value)]);
    }
}
