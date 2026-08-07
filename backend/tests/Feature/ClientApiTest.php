<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_clients(): void
    {
        $this->getJson('/api/clients')->assertUnauthorized();
    }

    public function test_authenticated_user_can_list_clients(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Client::factory()->count(3)->active()->create();

        $this->getJson('/api/clients')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email', 'phone', 'document', 'address', 'status', 'notes'],
                ],
                'links',
                'meta',
            ]);
    }

    public function test_authenticated_user_can_create_client(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $payload = [
            'name' => 'Fernanda Lima',
            'email' => 'fernanda.lima@example.com',
            'phone' => '(11) 98888-7777',
            'document' => '111.222.333-44',
            'address' => 'Rua Pet Feliz, 50',
            'status' => 'active',
            'notes' => 'Cliente criada pelo teste.',
        ];

        $this->postJson('/api/clients', $payload)
            ->assertCreated()
            ->assertJsonPath('data.name', 'Fernanda Lima')
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('clients', [
            'email' => 'fernanda.lima@example.com',
        ]);
    }

    public function test_client_creation_requires_name_and_phone(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/clients', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'phone']);
    }

    public function test_authenticated_user_can_update_client(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $client = Client::factory()->active()->create();

        $this->putJson("/api/clients/{$client->id}", [
            'name' => 'Nome Atualizado',
            'status' => 'inactive',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nome Atualizado')
            ->assertJsonPath('data.status', 'inactive');

        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'name' => 'Nome Atualizado',
            'status' => 'inactive',
        ]);
    }

    public function test_authenticated_user_can_soft_delete_client(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $client = Client::factory()->create();

        $this->deleteJson("/api/clients/{$client->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('clients', [
            'id' => $client->id,
        ]);
    }

    public function test_authenticated_user_can_filter_clients_by_search_and_status(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Client::factory()->active()->create(['name' => 'Mariana Souza']);
        Client::factory()->inactive()->create(['name' => 'Carlos Souza']);

        $this->getJson('/api/clients?search=Mariana&status=active')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Mariana Souza');
    }
}
