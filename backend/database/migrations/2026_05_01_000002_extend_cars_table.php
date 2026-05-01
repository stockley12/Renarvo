<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->unsignedSmallInteger('engine_power_hp')->nullable()->after('fuel');
            $table->unsignedSmallInteger('engine_cc')->nullable()->after('engine_power_hp');
            $table->boolean('has_ac')->default(true)->after('engine_cc');
            // Per-car override of company kilometre policy: NULL means inherit company default.
            $table->unsignedSmallInteger('kilometre_limit_per_day')->nullable()->after('mileage_policy');
            // Per-car override of company min_driver_age_default: NULL means inherit.
            $table->unsignedTinyInteger('min_driver_age_override')->nullable()->after('min_driver_age');
        });

        // Relax the category CHECK / ENUM so the new categories can be saved.
        $driver = DB::connection()->getDriverName();
        $newCheck = "check (\"category\" in ('economy', 'compact', 'comfort', 'prestige', 'premium', 'luxury', 'suv', 'minivan', 'van', 'electric'))";
        $oldCheck = "check (\"category\" in ('economy', 'compact', 'suv', 'luxury', 'van', 'electric'))";

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA writable_schema = 1');
            DB::statement(
                "UPDATE sqlite_master SET sql = REPLACE(sql, ?, ?) WHERE type = 'table' AND name = 'cars'",
                [$oldCheck, $newCheck]
            );
            DB::statement('PRAGMA writable_schema = 0');
        } elseif ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE cars MODIFY COLUMN category ENUM('economy','compact','comfort','prestige','premium','luxury','suv','minivan','van','electric') NOT NULL");
        }
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn([
                'engine_power_hp',
                'engine_cc',
                'has_ac',
                'kilometre_limit_per_day',
                'min_driver_age_override',
            ]);
        });

        $driver = DB::connection()->getDriverName();
        $oldCheck = "check (\"category\" in ('economy', 'compact', 'suv', 'luxury', 'van', 'electric'))";
        $newCheck = "check (\"category\" in ('economy', 'compact', 'comfort', 'prestige', 'premium', 'luxury', 'suv', 'minivan', 'van', 'electric'))";

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA writable_schema = 1');
            DB::statement(
                "UPDATE sqlite_master SET sql = REPLACE(sql, ?, ?) WHERE type = 'table' AND name = 'cars'",
                [$newCheck, $oldCheck]
            );
            DB::statement('PRAGMA writable_schema = 0');
        } elseif ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE cars MODIFY COLUMN category ENUM('economy','compact','suv','luxury','van','electric') NOT NULL");
        }
    }
};
