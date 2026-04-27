<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Production seeder: creates the bootstrap superadmin only.
 *
 * No demo company, no demo customer, no demo cars, no demo reservations.
 * Reference data such as cities/categories/pickup-points is served directly
 * by the LookupController (no DB rows needed). FX rates are seeded by the
 * FxRateSeeder which runs alongside this seeder from DatabaseSeeder.
 *
 * Email             | Password        | Role
 * ----------------- | --------------- | -----------
 * admin@renarvo.com | RenarvoTest!1   | superadmin
 *
 * Rotate the password from the admin panel after first login.
 */
class LiveSeeder extends Seeder
{
    public const BOOTSTRAP_PASSWORD = 'RenarvoTest!1';

    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@renarvo.com'],
            [
                'password_hash' => Hash::make(self::BOOTSTRAP_PASSWORD),
                'name' => 'Renarvo Admin',
                'role' => User::ROLE_SUPERADMIN,
                'status' => 'active',
                'locale' => 'en',
                'email_verified_at' => now(),
            ]
        );
    }
}
