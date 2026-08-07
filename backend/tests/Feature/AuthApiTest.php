<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_me_endpoint(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_guest_cannot_logout(): void
    {
        $this->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_user_can_login_and_receive_token(): void
    {
        $user = User::factory()->administrator()->create([
            'name' => 'Administrador Demo',
            'email' => 'admin@petsystem.local',
            'password' => 'password',
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonPath('data.user.role', UserRole::Administrator->value)
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'role', 'created_at', 'updated_at'],
                    'token',
                    'token_type',
                ],
            ]);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->administrator()->create([
            'email' => 'admin@petsystem.local',
            'password' => 'password',
        ]);

        $this->postJson('/api/login', [
            'email' => 'admin@petsystem.local',
            'password' => 'wrong-password',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Credenciais invalidas.');
    }

    public function test_login_requires_email_and_password(): void
    {
        $this->postJson('/api/login', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_authenticated_user_can_see_current_profile(): void
    {
        $user = User::factory()->receptionist()->create([
            'name' => 'Recepcionista Demo',
            'email' => 'recepcao@petsystem.local',
            'password' => 'password',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.role', UserRole::Receptionist->value);
    }

    public function test_authenticated_user_can_logout_and_revoke_current_token(): void
    {
        $user = User::factory()->receptionist()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
