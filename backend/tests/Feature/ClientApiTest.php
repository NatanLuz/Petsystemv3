<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->active()->create(), 'web');
    }

    public function test_it_creates_a_valid_client(): void
    {
        $payload = [
            'name' => 'Ana Souza',
            'email' => 'ana@example.com',
            'phone' => '11999999999',
            'address' => 'Rua das Flores, 100',
        ];

        $response = $this->postJson('/api/clients', $payload);

        $response
            ->assertCreated()
            ->assertJsonFragment($payload);

        $this->assertDatabaseHas('clients', $payload);
    }

    public function test_it_rejects_an_invalid_client_payload(): void
    {
        $response = $this->postJson('/api/clients', [
            'email' => 'invalid-email',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'phone']);

        $this->assertDatabaseCount('clients', 0);
    }

    public function test_it_normalizes_client_contacts_and_rejects_duplicate_phone_or_email(): void
    {
        $existing = $this->createClient();

        $this->postJson('/api/clients', [
            'name' => 'Outro Tutor',
            'phone' => '(11) 98888-7777',
            'email' => strtoupper($existing->email),
        ])->assertUnprocessable()->assertJsonValidationErrors(['phone', 'email']);

        $this->postJson('/api/clients', [
            'name' => 'Novo Tutor',
            'phone' => '(11) 97777-6666',
            'email' => '  NOVO@EXAMPLE.COM ',
        ])->assertCreated()->assertJsonPath('phone', '11977776666')
            ->assertJsonPath('email', 'novo@example.com');
    }

    public function test_it_lists_registered_clients(): void
    {
        $firstClient = $this->createClient([
            'name' => 'Ana Souza',
            'email' => 'ana@example.com',
        ]);
        $secondClient = $this->createClient([
            'name' => 'Bruno Lima',
            'email' => 'bruno@example.com',
        ]);

        $response = $this->getJson('/api/clients');

        $response
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['id' => $firstClient->id, 'name' => 'Ana Souza'])
            ->assertJsonFragment(['id' => $secondClient->id, 'name' => 'Bruno Lima']);
    }

    public function test_it_returns_an_existing_client(): void
    {
        $client = $this->createClient();

        $response = $this->getJson("/api/clients/{$client->id}");

        $response
            ->assertOk()
            ->assertJsonFragment([
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'address' => $client->address,
            ]);
    }

    public function test_client_detail_includes_pets_and_their_recent_appointments(): void
    {
        $client = $this->createClient();
        $pet = $client->pets()->create(['name' => 'Rex', 'species' => 'Cachorro']);
        $service = Service::create(['name' => 'Consulta', 'price' => 100, 'duration_minutes' => 30]);
        $pet->appointments()->create([
            'service_id' => $service->id,
            'scheduled_at' => '2026-10-13 10:00:00',
            'price' => 100,
            'duration_minutes' => 30,
            'status' => Appointment::STATUS_CONFIRMED,
        ]);

        $this->actingAs(User::factory()->active()->create(['role' => User::ROLE_VETERINARIAN]), 'web')
            ->getJson("/api/clients/{$client->id}")
            ->assertOk()
            ->assertJsonPath('pets.0.name', 'Rex')
            ->assertJsonPath('pets.0.appointments.0.service.name', 'Consulta');
    }

    public function test_client_cannot_reuse_another_clients_phone_or_email_on_update(): void
    {
        $client = $this->createClient();
        $other = $this->createClient(['name' => 'Outro', 'email' => 'outro@example.com', 'phone' => '11977776666']);

        $this->patchJson("/api/clients/{$client->id}", [
            'phone' => $other->phone,
            'email' => $other->email,
        ])->assertUnprocessable()->assertJsonValidationErrors(['phone', 'email']);

        $this->assertDatabaseHas('clients', ['id' => $client->id, 'phone' => '11988887777']);
    }

    public function test_it_partially_updates_an_existing_client(): void
    {
        $client = $this->createClient();

        $response = $this->patchJson("/api/clients/{$client->id}", [
            'name' => 'Ana Souza Atualizada',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('name', 'Ana Souza Atualizada')
            ->assertJsonPath('phone', $client->phone);

        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'name' => 'Ana Souza Atualizada',
            'phone' => $client->phone,
        ]);
    }

    public function test_it_rejects_invalid_client_fields_on_update_without_changing_the_record(): void
    {
        $client = $this->createClient();

        $this->patchJson("/api/clients/{$client->id}", [
            'email' => 'not-an-email',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'email' => $client->email,
        ]);
    }

    public function test_it_deletes_an_existing_client(): void
    {
        $client = $this->createClient();

        $response = $this->deleteJson("/api/clients/{$client->id}");

        $response->assertNoContent();

        $this->assertDatabaseMissing('clients', [
            'id' => $client->id,
        ]);
    }

    public function test_it_does_not_delete_a_client_with_pets(): void
    {
        $client = $this->createClient();
        $pet = $client->pets()->create([
            'name' => 'Rex',
            'species' => 'Cachorro',
        ]);

        $response = $this->deleteJson("/api/clients/{$client->id}");

        $response
            ->assertConflict()
            ->assertJsonPath(
                'message',
                'Não é possível excluir um cliente que possui pets cadastrados.',
            );

        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
        ]);
        $this->assertDatabaseHas('pets', [
            'id' => $pet->id,
            'client_id' => $client->id,
        ]);
    }

    /**
     * @param  array<string, string|null>  $attributes
     */
    private function createClient(array $attributes = []): Client
    {
        return Client::create(array_merge([
            'name' => 'Cliente Teste',
            'email' => 'cliente@example.com',
            'phone' => '11988887777',
            'address' => 'Rua de Teste, 10',
        ], $attributes));
    }
}
