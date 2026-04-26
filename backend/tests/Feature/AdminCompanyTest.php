<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminCompanyTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_can_approve_company(): void
    {
        [$admin, $token] = $this->makeAdmin();
        $owner = User::query()->create([
            'email' => 'owner@example.com',
            'password_hash' => Hash::make('x'),
            'name' => 'Owner',
            'role' => User::ROLE_COMPANY_OWNER,
        ]);
        $company = Company::query()->create([
            'owner_user_id' => $owner->id,
            'slug' => 'demo-rental',
            'name' => 'Demo Rental',
            'city' => 'Girne',
            'status' => 'pending',
        ]);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/companies/{$company->id}/approve");

        $res->assertOk()->assertJsonPath('data.status', 'approved');
        $this->assertDatabaseHas('audit_logs', ['action' => 'company.approved']);
    }

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $customer = User::query()->create([
            'email' => 'cust@example.com',
            'password_hash' => Hash::make('x'),
            'name' => 'C',
            'role' => User::ROLE_CUSTOMER,
        ]);
        $token = app(\App\Services\JwtService::class)->issueAccessToken($customer);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/overview')
            ->assertStatus(403);
    }

    /** @return array{0: User, 1: string} */
    private function makeAdmin(): array
    {
        $admin = User::query()->create([
            'email' => 'admin@renarvo.com',
            'password_hash' => Hash::make('x'),
            'name' => 'Admin',
            'role' => User::ROLE_SUPERADMIN,
        ]);
        $token = app(\App\Services\JwtService::class)->issueAccessToken($admin);
        return [$admin, $token];
    }
}
