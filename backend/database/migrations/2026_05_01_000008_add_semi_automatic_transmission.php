<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // SQLite doesn't support ALTER COLUMN for enums; change column to string
        // For MySQL, this would be: ALTER TABLE cars MODIFY transmission ENUM('manual','automatic','semi_automatic')
        if (DB::getDriverName() === 'sqlite') {
            // SQLite stores enum as TEXT anyway, no schema change needed
            return;
        }

        DB::statement("ALTER TABLE cars MODIFY transmission ENUM('manual', 'automatic', 'semi_automatic') NOT NULL DEFAULT 'automatic'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE cars MODIFY transmission ENUM('manual', 'automatic') NOT NULL DEFAULT 'automatic'");
    }
};
