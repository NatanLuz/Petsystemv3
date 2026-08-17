<?php

namespace Tests\Feature;

use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientApiTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_it_deletes_an_existing_client(): void
    {
        $client = $this->createClient();

        $response = $this->deleteJson("/api/clients/{$client->id}");

        $response->assertNoContent();

        $this->assertDatabaseMissing('clients', [
            'id' => $client->id,
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
