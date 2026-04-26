<?php

namespace App\Support;

class TenantContext
{
    private static ?int $companyId = null;

    public static function set(?int $companyId): void
    {
        self::$companyId = $companyId;
    }

    public static function get(): ?int
    {
        return self::$companyId;
    }

    public static function clear(): void
    {
        self::$companyId = null;
    }

    public static function ignore(callable $callback): mixed
    {
        $previous = self::$companyId;
        self::$companyId = null;
        try {
            return $callback();
        } finally {
            self::$companyId = $previous;
        }
    }
}
