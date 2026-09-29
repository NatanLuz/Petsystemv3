<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProtectedApiTest extends TestCase
{
    use RefreshDatabase;

    private const RESOURCES = ['clients', 'pets', 'services', 'appointments'];

    protected function setUp(): void
    {
        parent::setUp();
        config(['sanctum.stateful' => ['127.0.0.1:5173']]);
        $this->withHeader('Origin', 'http://127.0.0.1:5173')->withCredentials();
    }

    private function continueSession(TestResponse $response): void
    {
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
        Auth::forgetGuards();
    }

    private function login(User $user): void
    {
        $response = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        $this->continueSession($response);
    }

    public function test_guests_cannot_access_any_resource_action_or_write_data(): void
    {
        foreach (self::RESOURCES as $resource) {
            $this->getJson('/api/'.$resource)->assertUnauthorized();
            $this->getJson('/api/'.$resource.'/1')->assertUnauthorized();
            $this->postJson('/api/'.$resource, ['name' => 'Denied'])->assertUnauthorized();
            foreach (['PATCH', 'PUT', 'DELETE'] as $method) {
                $this->json($method, '/api/'.$resource.'/1', ['name' => 'Denied'])->assertUnauthorized();
            }
            $this->assertDatabaseCount($resource, 0);
        }
    }

    public function test_requests_without_a_stateful_origin_cannot_use_session_cookies(): void
    {
        $this->login(User::factory()->active()->create());
        $this->flushHeaders();
        // Laravel feature requests share the in-memory session store. Clear only
        // its loaded attributes, keeping the saved session and cookie intact.
        $this->app['session.store']->flush();
        foreach (self::RESOURCES as $resource) {
            Auth::forgetGuards();
            $this->getJson('/api/'.$resource)->assertUnauthorized();
        }
        $this->withHeader('Origin', 'http://127.0.0.1:5173');
        Auth::forgetGuards();
        $this->getJson('/api/clients')->assertOk();
    }

    public static function roles(): array
    {
        return array_map(fn ($role) => [$role], User::ROLES);
    }

    #[DataProvider('roles')]
    public function test_every_active_role_has_the_same_full_resource_access(string $role): void
    {
        $this->login(User::factory()->active()->create(['role' => $role]));
        $client = $this->postJson('/api/clients', ['name' => 'Cliente', 'phone' => '11999999999'])->assertCreated()->json();
        $pet = $this->postJson('/api/pets', ['name' => 'Rex', 'species' => 'Cachorro', 'client_id' => $client['id']])->assertCreated()->json();
        $service = $this->postJson('/api/services', ['name' => 'Banho', 'price' => '50.00', 'duration_minutes' => 30])->assertCreated()->json();
        $appointment = $this->postJson('/api/appointments', [
            'pet_id' => $pet['id'], 'service_id' => $service['id'], 'scheduled_at' => '2026-10-01 14:00:00',
        ])->assertCreated()->json();

        $records = ['clients' => $client, 'pets' => $pet, 'services' => $service, 'appointments' => $appointment];
        foreach ($records as $resource => $record) {
            Auth::forgetGuards();
            $this->getJson('/api/'.$resource)->assertOk()->assertJsonCount(1);
            $path = '/api/'.$resource.'/'.$record['id'];
            $this->getJson($path)->assertOk()->assertJsonPath('id', $record['id']);
            $payload = $resource === 'appointments' ? ['status' => 'confirmed'] : ['name' => 'Atualizado'];
            $this->patchJson($path, $payload)->assertOk()->assertJsonFragment($payload);
            $this->putJson($path, $payload)->assertOk()->assertJsonFragment($payload);
        }
        foreach (['appointments', 'pets', 'services', 'clients'] as $resource) {
            $this->deleteJson('/api/'.$resource.'/'.$records[$resource]['id'])->assertNoContent();
            $this->assertDatabaseCount($resource, 0);
        }
    }

    public static function resources(): array
    {
        return array_map(fn ($resource) => [$resource], self::RESOURCES);
    }

    #[DataProvider('resources')]
    public function test_deactivation_on_each_resource_invalidates_the_session(string $resource): void
    {
        $user = User::factory()->active()->create();
        $this->login($user);
        $user->active = false;
        $user->save();
        Auth::forgetGuards();
        $rejected = $this->getJson('/api/'.$resource)->assertUnauthorized();
        $this->continueSession($rejected);
        $user->active = true;
        $user->save();
        foreach (self::RESOURCES as $path) {
            Auth::forgetGuards();
            $this->getJson('/api/'.$path)->assertUnauthorized();
            $this->assertDatabaseCount($path, 0);
        }
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_logout_prevents_subsequent_resource_access(): void
    {
        $this->login(User::factory()->active()->create());
        $this->continueSession($this->postJson('/api/logout')->assertNoContent());
        foreach (self::RESOURCES as $resource) {
            Auth::forgetGuards();
            $this->getJson('/api/'.$resource)->assertUnauthorized();
        }
    }

    public function test_health_checks_remain_public(): void
    {
        $this->getJson('/api/health/live')->assertOk()->assertJsonPath('status', 'ok');
        $this->getJson('/api/health/ready')->assertOk()->assertJsonPath('database', 'up');
    }
}
