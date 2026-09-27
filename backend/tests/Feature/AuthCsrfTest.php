<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthCsrfTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Enable the real token validation path; only remove Laravel's test bypass.
        $this->app->bind(ValidateCsrfToken::class, fn ($app) => new class($app, $app['encrypter']) extends ValidateCsrfToken
        {
            protected function runningUnitTests()
            {
                return false;
            }
        });
        $this->withCredentials();
    }

    public function test_login_requires_csrf_and_cookie_flow_authenticates_and_logs_out(): void
    {
        $user = User::factory()->active()->create();
        $credentials = ['email' => $user->email, 'password' => 'password'];
        $this->postJson('/api/login', $credentials)->assertStatus(419);

        $csrf = $this->getJson('/sanctum/csrf-cookie')->assertNoContent();
        $this->withCookie(config('session.cookie'), $csrf->getCookie(config('session.cookie'))->getValue());
        $this->postJson('/api/login', $credentials, ['X-XSRF-TOKEN' => 'invalid'])->assertStatus(419);
        $login = $this->postJson('/api/login', $credentials, [
            'X-XSRF-TOKEN' => $csrf->getCookie('XSRF-TOKEN', false)->getValue(),
        ])->assertOk();

        $this->withCookie(config('session.cookie'), $login->getCookie(config('session.cookie'))->getValue());
        Auth::forgetGuards();
        $this->getJson('/api/user')->assertOk()->assertJsonPath('id', $user->id);
        $this->postJson('/api/logout')->assertStatus(419);
        $logout = $this->postJson('/api/logout', [], [
            'X-XSRF-TOKEN' => $login->getCookie('XSRF-TOKEN', false)->getValue(),
        ])->assertNoContent();
        $this->withCookie(config('session.cookie'), $logout->getCookie(config('session.cookie'))->getValue());
        Auth::forgetGuards();
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_existing_crud_still_accepts_writes_without_session_or_csrf(): void
    {
        $this->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/clients', ['name' => 'Teste', 'phone' => '11999999999'])
            ->assertCreated();
    }
}
