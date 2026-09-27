<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
    }

    protected function continueSession(TestResponse $response): void
    {
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
        Auth::forgetGuards();
    }

    public function test_login_regenerates_session_and_identity_persists_between_requests(): void
    {
        $user = User::factory()->active()->veterinarian()->create();
        $initial = $this->getJson('/sanctum/csrf-cookie')->assertNoContent();
        $initialId = $initial->getCookie(config('session.cookie'))->getValue();
        $this->continueSession($initial);

        $response = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password']);
        $response->assertOk()->assertExactJson([
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
            'role' => User::ROLE_VETERINARIAN, 'active' => true,
        ])->assertJsonMissingPath('password')->assertJsonMissingPath('remember_token');
        $this->assertTrue($initialId !== $response->getCookie(config('session.cookie'))->getValue(), 'Session must rotate on login.');
        $this->continueSession($response);

        $this->getJson('/api/user')->assertOk()->assertExactJson($response->json());
    }

    public function test_invalid_password_unknown_email_and_inactive_user_have_identical_errors(): void
    {
        $user = User::factory()->active()->create();
        $inactive = User::factory()->inactive()->create();
        $wrong = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'incorrect']);
        $unknown = $this->postJson('/api/login', ['email' => 'missing@example.test', 'password' => 'incorrect']);
        $disabled = $this->postJson('/api/login', ['email' => $inactive->email, 'password' => 'password']);
        foreach ([$wrong, $unknown, $disabled] as $response) {
            $response->assertUnprocessable()->assertJsonValidationErrors('email');
            $this->assertSame($wrong->json(), $response->json());
        }
        $this->assertGuest('web');
    }

    public function test_login_rejects_authority_fields_without_changing_user(): void
    {
        $user = User::factory()->active()->receptionist()->create();
        $this->postJson('/api/login', [
            'email' => $user->email, 'password' => 'password',
            'role' => User::ROLE_ADMIN, 'active' => true, 'user_id' => 999, 'id' => 999,
        ])->assertUnprocessable()->assertJsonValidationErrors(['role', 'active', 'user_id', 'id']);
        $this->assertGuest('web');
        $this->assertSame(User::ROLE_RECEPTIONIST, $user->fresh()->role);
    }

    public function test_login_validates_required_credentials(): void
    {
        $this->postJson('/api/login', [])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
        $this->postJson('/api/login', ['email' => 'invalid', 'password' => []])
            ->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_user_and_logout_require_authentication(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
        $this->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_logout_invalidates_session_and_rotates_csrf_token(): void
    {
        $user = User::factory()->active()->create();
        $login = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        $oldId = $login->getCookie(config('session.cookie'))->getValue();
        $oldToken = $login->getCookie('XSRF-TOKEN')->getValue();
        $this->continueSession($login);
        $logout = $this->postJson('/api/logout')->assertNoContent();
        $this->assertTrue($oldId !== $logout->getCookie(config('session.cookie'))->getValue(), 'Session must rotate on logout.');
        $this->assertTrue($oldToken !== $logout->getCookie('XSRF-TOKEN')->getValue(), 'CSRF token must rotate on logout.');
        $this->continueSession($logout);
        $this->getJson('/api/user')->assertUnauthorized();
        $this->withCookie(config('session.cookie'), $oldId);
        Auth::forgetGuards();
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_deactivation_ends_an_existing_session(): void
    {
        $user = User::factory()->active()->create();
        $login = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        $this->continueSession($login);
        $user->active = false;
        $user->save();
        $rejected = $this->getJson('/api/user')->assertUnauthorized();
        $this->continueSession($rejected);
        $user->active = true;
        $user->save();
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'missing@example.test', 'password' => 'incorrect'])->assertUnprocessable();
        }
        $this->postJson('/api/login', ['email' => 'missing@example.test', 'password' => 'incorrect'])
            ->assertStatus(429)->assertHeader('Retry-After');
    }

    public function test_database_defaults_and_mass_assignment_do_not_grant_authority(): void
    {
        $user = new User;
        $user->fill(['name' => 'Test', 'email' => 'defaults@example.test', 'password' => 'test-only-password',
            'role' => User::ROLE_ADMIN, 'active' => true]);
        $user->save();
        $user->refresh();
        $this->assertSame(User::ROLE_RECEPTIONIST, $user->role);
        $this->assertFalse($user->active);
    }
}
