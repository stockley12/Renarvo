<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Production seeding: only platform reference data + the bootstrap
     * superadmin. No demo content of any kind.
     */
    public function run(): void
    {
        $this->call([
            FxRateSeeder::class,
            LiveSeeder::class,
        ]);
    }
}
