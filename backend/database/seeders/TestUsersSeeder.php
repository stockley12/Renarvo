<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates one well-known account per user role for QA / smoke tests.
 *
 * Email                       | Password        | Role
 * --------------------------- | --------------- | ---------------
 * admin@renarvo.com           | RenarvoTest!1   | superadmin
 * company@renarvo.com         | RenarvoTest!1   | company_owner
 * customer@renarvo.com        | RenarvoTest!1   | customer
 *
 * The company_owner is bound to a pre-approved company "Renarvo Test Cars"
 * so dashboard endpoints work out of the box.
 */
class TestUsersSeeder extends Seeder
{
    public const PASSWORD = 'RenarvoTest!1';

    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@renarvo.com'],
            [
                'password_hash' => Hash::make(self::PASSWORD),
                'name' => 'Renarvo Admin',
                'role' => User::ROLE_SUPERADMIN,
                'status' => 'active',
                'locale' => 'en',
                'email_verified_at' => now(),
            ]
        );

        $companyOwner = User::query()->updateOrCreate(
            ['email' => 'company@renarvo.com'],
            [
                'password_hash' => Hash::make(self::PASSWORD),
                'name' => 'Renarvo Test Company',
                'phone' => '+90 533 000 00 01',
                'role' => User::ROLE_COMPANY_OWNER,
                'status' => 'active',
                'locale' => 'en',
                'email_verified_at' => now(),
            ]
        );

        Company::query()->updateOrCreate(
            ['slug' => 'renarvo-test-cars'],
            [
                'owner_user_id' => $companyOwner->id,
                'name' => 'Renarvo Test Cars',
                'city' => 'Girne',
                'description' => 'Built-in test company for QA. Pre-approved.',
                'logo_color' => '220 73% 49%',
                'phone' => '+90 533 000 00 01',
                'tax_number' => '6009999999',
                'address' => 'Girne merkez ofis',
                'status' => Company::STATUS_APPROVED,
                'founded_year' => 2024,
                'commission_rate_bps' => 1200,
                'rating_avg' => 0,
                'review_count' => 0,
                'fleet_size' => 0,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'customer@renarvo.com'],
            [
                'password_hash' => Hash::make(self::PASSWORD),
                'name' => 'Renarvo Test Customer',
                'phone' => '+90 533 000 00 02',
                'role' => User::ROLE_CUSTOMER,
                'status' => 'active',
                'locale' => 'en',
                'email_verified_at' => now(),
            ]
        );

        unset($admin);
    }
}
