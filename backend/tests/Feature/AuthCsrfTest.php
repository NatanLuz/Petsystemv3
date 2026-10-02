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
        config(['sanctum.stateful' => ['127.0.0.1:5173']]);
        $this->withHeader('Origin', 'http://127.0.0.1:5173');
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

    public function test_csrf_failure_precedes_authorization_and_forbidden_response_preserves_session(): void
    {
        $user = User::factory()->active()->receptionist()->create();
        $csrf = $this->getJson('/sanctum/csrf-cookie')->assertNoContent();
        $this->withCookie(config('session.cookie'), $csrf->getCookie(config('session.cookie'))->getValue());
        $login = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'], [
            'X-XSRF-TOKEN' => $csrf->getCookie('XSRF-TOKEN', false)->getValue(),
        ])->assertOk();
        $this->withCookie(config('session.cookie'), $login->getCookie(config('session.cookie'))->getValue());
        Auth::forgetGuards();
        $payload = ['name' => 'Denied', 'price' => '50.00', 'duration_minutes' => 30, 'role' => 'admin'];
        $this->postJson('/api/services', $payload)->assertStatus(419);
        $this->postJson('/api/services', $payload, ['X-XSRF-TOKEN' => 'invalid'])->assertStatus(419);
        $denied = $this->postJson('/api/services', $payload, [
            'X-XSRF-TOKEN' => $login->getCookie('XSRF-TOKEN', false)->getValue(),
        ])->assertForbidden();
        $this->assertDatabaseCount('services', 0);
        $this->withCookie(config('session.cookie'), $denied->getCookie(config('session.cookie'))->getValue());
        Auth::forgetGuards();
        $this->getJson('/api/user')->assertOk()->assertJsonPath('id', $user->id)->assertJsonPath('role', 'receptionist');
    }

    public function test_stateful_resource_writes_require_csrf_and_authentication(): void
    {
        $csrf = $this->getJson('/sanctum/csrf-cookie')->assertNoContent();
        $this->withCookie(config('session.cookie'), $csrf->getCookie(config('session.cookie'))->getValue());
        foreach (['clients', 'pets', 'services', 'appointments'] as $resource) {
            foreach (['POST', 'PATCH', 'PUT', 'DELETE'] as $method) {
                $path = '/api/'.$resource.($method === 'POST' ? '' : '/1');
                $payload = ['name' => 'Denied', 'phone' => '11999999999'];
                $this->json($method, $path, $payload)->assertStatus(419);
                $this->json($method, $path, $payload, ['X-XSRF-TOKEN' => 'invalid'])->assertStatus(419);
                $this->json($method, $path, $payload, [
                    'X-XSRF-TOKEN' => $csrf->getCookie('XSRF-TOKEN', false)->getValue(),
                ])->assertUnauthorized();
            }
            $this->assertDatabaseCount($resource, 0);
        }
    }

    public function test_authenticated_stateful_writes_require_csrf_without_changing_data_on_rejection(): void
    {
        $user = User::factory()->active()->create();
        $csrf = $this->getJson('/sanctum/csrf-cookie')->assertNoContent();
        $this->withCookie(config('session.cookie'), $csrf->getCookie(config('session.cookie'))->getValue());
        $login = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'], [
            'X-XSRF-TOKEN' => $csrf->getCookie('XSRF-TOKEN', false)->getValue(),
        ])->assertOk();
        $this->withCookie(config('session.cookie'), $login->getCookie(config('session.cookie'))->getValue());
        Auth::forgetGuards();
        $headers = ['X-XSRF-TOKEN' => $login->getCookie('XSRF-TOKEN', false)->getValue()];
        $payload = ['name' => 'Teste', 'phone' => '11999999999'];
        $this->postJson('/api/clients', $payload)->assertStatus(419);
        $this->assertDatabaseCount('clients', 0);
        $created = $this->postJson('/api/clients', $payload, $headers)->assertCreated();
        $path = '/api/clients/'.$created->json('id');
        foreach (['PATCH', 'PUT', 'DELETE'] as $method) {
            $this->json($method, $path, ['name' => 'Denied'])->assertStatus(419);
            $this->assertDatabaseHas('clients', ['id' => $created->json('id'), 'name' => 'Teste']);
        }
        $this->patchJson($path, ['name' => 'Atualizado'], $headers)->assertOk();
        $this->putJson($path, ['name' => 'Atualizado novamente'], $headers)->assertOk();
        $this->deleteJson($path, [], $headers)->assertNoContent();
        $this->assertDatabaseCount('clients', 0);
    }
}
