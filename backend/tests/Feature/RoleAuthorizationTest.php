<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureUserIsActive;
use App\Models\Appointment;
use App\Models\Client;
use App\Models\Pet;
use App\Models\Service;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['sanctum.stateful' => ['127.0.0.1:5173']]);
        $this->withHeader('Origin', 'http://127.0.0.1:5173')->withCredentials();
    }

    public static function matrix(): array
    {
        // Independent business expectations, not calculated from the Gate definitions.
        $allowed = [
            'admin' => ['clients' => true, 'pets' => true, 'services' => true, 'appointments' => true],
            'receptionist' => ['clients' => true, 'pets' => true, 'services' => false, 'appointments' => false],
            'veterinarian' => ['clients' => false, 'pets' => false, 'services' => false, 'appointments' => false],
        ];
        $cases = [];
        foreach ($allowed as $role => $resources) {
            foreach ($resources as $resource => $deleteAllowed) {
                foreach (['index', 'show', 'create', 'patch', 'put', 'delete'] as $action) {
                    $permit = match ($action) {
                        'index', 'show' => true,
                        'delete' => $deleteAllowed,
                        default => $resource !== 'services' || $role === 'admin',
                    };
                    $cases["$role $resource $action"] = [$role, $resource, $action, $permit];
                }
            }
        }
        return $cases;
    }

    private function fixture(string $resource): array
    {
        $client = Client::create(['name' => 'Tutor', 'phone' => '11999999999']);
        if ($resource === 'clients') return [$client, ['name' => 'Novo tutor', 'phone' => '11888888888']];
        $service = Service::create(['name' => 'Consulta', 'price' => '50.00', 'duration_minutes' => 30, 'active' => true]);
        if ($resource === 'services') return [$service, ['name' => 'Novo serviço', 'price' => '60.00', 'duration_minutes' => 45]];
        $pet = Pet::create(['client_id' => $client->id, 'name' => 'Rex', 'species' => 'Cachorro']);
        if ($resource === 'pets') return [$pet, ['client_id' => $client->id, 'name' => 'Luna', 'species' => 'Gato']];
        $payload = ['pet_id' => $pet->id, 'service_id' => $service->id, 'scheduled_at' => '2026-10-10 14:00:00'];
        $appointment = Appointment::create($payload + ['price' => '50.00', 'duration_minutes' => 30, 'status' => 'scheduled']);
        return [$appointment, $payload + ['notes' => 'Novo agendamento']];
    }

    private function snapshot(): array
    {
        $state = [];
        foreach (['clients', 'pets', 'services', 'appointments'] as $table) {
            $state[$table] = DB::table($table)->orderBy('id')->get()->toArray();
        }
        return $state;
    }

    #[DataProvider('matrix')]
    public function test_direct_api_access_obeys_the_matrix(string $role, string $resource, string $action, bool $allowed): void
    {
        [$record, $payload] = $this->fixture($resource);
        $user = User::factory()->active()->create(['role' => $role]);
        $login = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        $this->withCookie(config('session.cookie'), $login->getCookie(config('session.cookie'))->getValue());
        Auth::forgetGuards();
        $before = $this->snapshot();
        $method = match ($action) {
            'index', 'show' => 'GET', 'create' => 'POST', 'patch' => 'PATCH', 'put' => 'PUT', 'delete' => 'DELETE',
        };
        $path = '/api/'.$resource.(in_array($action, ['index', 'create'], true) ? '' : '/'.$record->id);
        if (in_array($action, ['patch', 'put'], true)) {
            $payload = $resource === 'appointments' ? ['status' => 'cancelled'] : ['name' => 'Atualizado'];
        }
        // Client-supplied authority must never grant an otherwise denied operation.
        $response = $this->json($method, $path, $payload + ['role' => 'admin', 'user_id' => 999, 'active' => true]);
        if (! $allowed) {
            $response->assertForbidden()->assertJsonStructure(['message']);
            $this->assertEquals($before, $this->snapshot());
            $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
            Auth::forgetGuards();
            $this->getJson('/api/user')->assertOk()->assertJsonPath('id', $user->id)->assertJsonPath('role', $role);
        } else {
            $response->assertStatus($action === 'create' ? 201 : ($action === 'delete' ? 204 : 200));
            if ($action === 'delete') $this->assertDatabaseMissing($resource, ['id' => $record->id]);
            if ($action === 'create') $this->assertDatabaseCount($resource, count($before[$resource]) + 1);
            if (in_array($action, ['patch', 'put'], true)) $this->assertDatabaseHas($resource, ['id' => $record->id] + $payload);
        }
        $this->assertSame($role, $user->fresh()->role);
    }

    public static function serviceRoles(): array
    {
        return [['admin', true], ['receptionist', false], ['veterinarian', false]];
    }

    #[DataProvider('serviceRoles')]
    public function test_service_activation_and_deactivation_require_admin(string $role, bool $allowed): void
    {
        [$service] = $this->fixture('services');
        $this->actingAs(User::factory()->active()->create(['role' => $role]), 'web');
        foreach (['PATCH', 'PUT'] as $method) {
            foreach ([false, true] as $active) {
                $service->active = ! $active;
                $service->save();
                $response = $this->json($method, '/api/services/'.$service->id, ['active' => $active]);
                $response->assertStatus($allowed ? 200 : 403);
                $this->assertSame($allowed ? $active : ! $active, $service->fresh()->active);
            }
        }
    }

    public function test_unknown_role_is_denied_by_every_capability_and_resource(): void
    {
        // Do not bypass the database enum: simulate an unexpected identity in memory.
        $user = User::factory()->active()->make(['role' => 'unknown']);
        $this->actingAs($user, 'web');
        foreach (['clients', 'pets', 'services', 'appointments'] as $resource) {
            [$record, $payload] = $this->fixture($resource);
            $before = $this->snapshot();
            foreach (['view', 'create', 'update', 'delete'] as $action) {
                $this->assertFalse(Gate::forUser($user)->allows("$resource.$action"));
            }
            $this->getJson('/api/'.$resource)->assertForbidden();
            $this->getJson('/api/'.$resource.'/'.$record->id)->assertForbidden();
            $this->postJson('/api/'.$resource, $payload)->assertForbidden();
            foreach (['PATCH', 'PUT', 'DELETE'] as $method) {
                $this->json($method, '/api/'.$resource.'/'.$record->id, $payload)->assertForbidden();
            }
            $this->assertEquals($before, $this->snapshot());
        }
    }

    public function test_inactive_user_is_rejected_before_an_otherwise_forbidden_action(): void
    {
        [$service] = $this->fixture('services');
        $user = User::factory()->active()->veterinarian()->create();
        $login = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        $this->withCookie(config('session.cookie'), $login->getCookie(config('session.cookie'))->getValue());
        $user->active = false;
        $user->save();
        Auth::forgetGuards();
        $before = $this->snapshot();
        $response = $this->deleteJson('/api/services/'.$service->id)->assertUnauthorized();
        $this->assertEquals($before, $this->snapshot());
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
        Auth::forgetGuards();
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_resolved_route_middleware_authenticates_and_checks_active_before_authorization(): void
    {
        $router = app('router');
        foreach (['clients', 'pets', 'services', 'appointments'] as $resource) {
            foreach (['index', 'show', 'store', 'update', 'destroy'] as $action) {
                $middleware = $router->gatherRouteMiddleware($router->getRoutes()->getByName("$resource.$action"));
                $auth = array_search(Authenticate::class.':sanctum', $middleware, true);
                $active = array_search(EnsureUserIsActive::class, $middleware, true);
                $gate = array_search('Illuminate\\Auth\\Middleware\\Authorize:'.$resource.'.'.match ($action) {
                    'index', 'show' => 'view', 'store' => 'create', 'update' => 'update', 'destroy' => 'delete',
                }, $middleware, true);
                $this->assertNotFalse($auth);
                $this->assertNotFalse($active);
                $this->assertNotFalse($gate);
                $this->assertTrue($auth < $active && $active < $gate);
            }
        }
    }
}
