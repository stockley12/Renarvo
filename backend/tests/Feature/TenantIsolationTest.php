<?php

namespace Tests\Feature;

use App\Models\Car;
use App\Models\Company;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_global_scope_blocks_cross_tenant_reads(): void
    {
        [$companyA, $companyB] = $this->seedTwoCompanies();

        Car::query()->create($this->carPayload($companyA->id, 'Toyota', 'Yaris'));
        Car::query()->create($this->carPayload($companyB->id, 'BMW', 'X3'));

        TenantContext::set($companyA->id);
        $this->assertCount(1, Car::query()->get());
        $this->assertEquals('Toyota', Car::query()->first()->brand);

        TenantContext::set($companyB->id);
        $this->assertCount(1, Car::query()->get());
        $this->assertEquals('BMW', Car::query()->first()->brand);
    }

    public function test_can_ignore_scope_for_admin_views(): void
    {
        [$companyA, $companyB] = $this->seedTwoCompanies();
        Car::query()->create($this->carPayload($companyA->id, 'Toyota', 'Yaris'));
        Car::query()->create($this->carPayload($companyB->id, 'BMW', 'X3'));

        TenantContext::set($companyA->id);
        $count = TenantContext::ignore(fn () => Car::query()->count());
        $this->assertEquals(2, $count);
    }

    private function seedTwoCompanies(): array
    {
        $ownerA = User::query()->create([
            'email' => 'a@a.com', 'password_hash' => 'x', 'name' => 'A', 'role' => User::ROLE_COMPANY_OWNER,
        ]);
        $ownerB = User::query()->create([
            'email' => 'b@b.com', 'password_hash' => 'x', 'name' => 'B', 'role' => User::ROLE_COMPANY_OWNER,
        ]);

        $companyA = Company::query()->create([
            'owner_user_id' => $ownerA->id, 'slug' => 'a-co', 'name' => 'A Co',
            'city' => 'Girne', 'status' => 'approved',
        ]);
        $companyB = Company::query()->create([
            'owner_user_id' => $ownerB->id, 'slug' => 'b-co', 'name' => 'B Co',
            'city' => 'Lefkoşa', 'status' => 'approved',
        ]);

        return [$companyA, $companyB];
    }

    private function carPayload(int $companyId, string $brand, string $model): array
    {
        return [
            'company_id' => $companyId,
            'brand' => $brand,
            'model' => $model,
            'year' => 2023,
            'category' => 'compact',
            'transmission' => 'automatic',
            'fuel' => 'petrol',
            'seats' => 5,
            'doors' => 4,
            'price_per_day' => 100000,
            'city' => 'Girne',
        ];
    }
}
