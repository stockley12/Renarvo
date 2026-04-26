<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_register_customer(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'new@example.com',
            'password' => 'sup3rs3cret',
            'name' => 'New User',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['data' => ['access_token', 'expires_in', 'user' => ['id', 'email', 'role']]]);

        $this->assertDatabaseHas('users', ['email' => 'new@example.com', 'role' => 'customer']);
    }

    public function test_can_login_with_valid_credentials(): void
    {
        User::query()->create([
            'email' => 'a@a.com',
            'password_hash' => Hash::make('password123'),
            'name' => 'Test',
            'role' => User::ROLE_CUSTOMER,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'a@a.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.email', 'a@a.com');
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::query()->create([
            'email' => 'b@b.com',
            'password_hash' => Hash::make('correct'),
            'name' => 'X',
            'role' => User::ROLE_CUSTOMER,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'b@b.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(422);
    }

    public function test_protected_endpoints_require_jwt(): void
    {
        $this->getJson('/api/v1/me')->assertStatus(401);
    }
}
