<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use App\Models\Pet;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PetApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->active()->create(), 'web');
    }

    public function test_it_creates_a_valid_pet(): void
    {
        $client = $this->createClient();
        $payload = $this->validPetPayload($client);

        $response = $this->postJson('/api/pets', $payload);

        $response
            ->assertCreated()
            ->assertJsonFragment([
                'client_id' => $client->id,
                'name' => 'Rex',
                'species' => 'Cachorro',
            ]);

        $this->assertDatabaseHas('pets', [
            'client_id' => $client->id,
            'name' => 'Rex',
            'species' => 'Cachorro',
        ]);
    }

    public function test_it_saves_clinical_pet_details_for_veterinarian_profile(): void
    {
        $this->actingAs(User::factory()->active()->create(['role' => User::ROLE_VETERINARIAN]), 'web');
        $client = $this->createClient();

        $this->postJson('/api/pets', $this->validPetPayload($client, [
            'size' => 'Médio',
            'color' => 'Caramelo',
            'allergies' => 'Alergia a determinado medicamento',
            'behavior_alerts' => 'Fica ansioso durante coleta',
        ]))->assertCreated()
            ->assertJsonPath('size', 'Médio')
            ->assertJsonPath('color', 'Caramelo')
            ->assertJsonPath('allergies', 'Alergia a determinado medicamento')
            ->assertJsonPath('behavior_alerts', 'Fica ansioso durante coleta');
    }

    public function test_clinical_pet_details_are_validated_on_update(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);

        $this->patchJson("/api/pets/{$pet->id}", [
            'size' => str_repeat('x', 31),
            'allergies' => str_repeat('x', 5001),
        ])->assertUnprocessable()->assertJsonValidationErrors(['size', 'allergies']);

        $this->assertDatabaseHas('pets', ['id' => $pet->id, 'size' => null, 'allergies' => null]);
    }

    public function test_public_code_is_generated_automatically(): void
    {
        $client = $this->createClient();

        $response = $this->postJson('/api/pets', $this->validPetPayload($client));

        $response
            ->assertCreated()
            ->assertJsonStructure(['public_code']);

        $publicCode = $response->json('public_code');

        $this->assertIsString($publicCode);
        $this->assertMatchesRegularExpression('/^[0-9]{6}$/D', $publicCode);
    }

    public function test_two_created_pets_receive_distinct_public_codes(): void
    {
        $client = $this->createClient();

        $firstResponse = $this->postJson('/api/pets', $this->validPetPayload($client));
        $secondResponse = $this->postJson('/api/pets', $this->validPetPayload($client, [
            'name' => 'Luna',
        ]));

        $firstResponse->assertCreated();
        $secondResponse->assertCreated();
        $this->assertNotSame(
            $firstResponse->json('public_code'),
            $secondResponse->json('public_code'),
        );
    }

    public function test_it_rejects_a_nonexistent_client_id(): void
    {
        $response = $this->postJson('/api/pets', [
            'client_id' => 999999,
            'name' => 'Rex',
            'species' => 'Cachorro',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['client_id']);

        $this->assertDatabaseCount('pets', 0);
    }

    public function test_it_rejects_an_invalid_payload(): void
    {
        $client = $this->createClient();

        $response = $this->postJson('/api/pets', [
            'client_id' => $client->id,
            'name' => '',
            'species' => str_repeat('a', 51),
            'birth_date' => now()->addDay()->toDateString(),
            'weight' => 0,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'species', 'birth_date', 'weight']);

        $this->assertDatabaseCount('pets', 0);
    }

    public function test_it_lists_pets_with_their_clients(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);

        $response = $this->getJson('/api/pets');

        $response
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $pet->id)
            ->assertJsonPath('0.client.id', $client->id)
            ->assertJsonPath('0.client.name', $client->name);
    }

    public function test_it_returns_the_requested_pet_with_its_client(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);

        $response = $this->getJson("/api/pets/{$pet->id}");

        $response
            ->assertOk()
            ->assertJsonPath('id', $pet->id)
            ->assertJsonPath('name', $pet->name)
            ->assertJsonPath('client.id', $client->id)
            ->assertJsonPath('client.name', $client->name);
    }

    public function test_veterinarian_pet_ficha_includes_appointments_and_alerts(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client, [
            'allergies' => 'Alergia a medicamento X',
            'behavior_alerts' => 'Ansioso durante coleta',
        ]);
        $service = Service::create(['name' => 'Consulta', 'price' => 100, 'duration_minutes' => 30]);
        $pet->appointments()->create([
            'service_id' => $service->id,
            'scheduled_at' => '2026-10-13 10:00:00',
            'price' => 100,
            'duration_minutes' => 30,
            'status' => 'confirmed',
        ]);

        $this->actingAs(User::factory()->active()->create(['role' => User::ROLE_VETERINARIAN]), 'web')
            ->getJson("/api/pets/{$pet->id}")
            ->assertOk()
            ->assertJsonPath('allergies', 'Alergia a medicamento X')
            ->assertJsonPath('appointments.0.service.name', 'Consulta');
    }

    public function test_it_partially_updates_a_pet(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);

        $response = $this->patchJson("/api/pets/{$pet->id}", [
            'name' => 'Rex Atualizado',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('name', 'Rex Atualizado')
            ->assertJsonPath('species', $pet->species)
            ->assertJsonPath('client.id', $client->id);

        $this->assertDatabaseHas('pets', [
            'id' => $pet->id,
            'name' => 'Rex Atualizado',
            'species' => $pet->species,
        ]);
    }

    public function test_pet_with_an_appointment_cannot_be_deleted(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);
        $service = Service::create(['name' => 'Consulta', 'price' => 90, 'duration_minutes' => 30]);
        $pet->appointments()->create([
            'service_id' => $service->id,
            'scheduled_at' => '2026-10-13 10:00:00',
            'price' => 90,
            'duration_minutes' => 30,
            'status' => 'cancelled',
        ]);

        $this->deleteJson('/api/pets/'.$pet->id)->assertStatus(409)
            ->assertJsonPath('message', 'Não é possível excluir um pet que possui agendamentos ou atendimentos cadastrados.');
        $this->assertDatabaseHas('pets', ['id' => $pet->id]);
    }

    public function test_pet_with_an_unlinked_attendance_cannot_be_deleted(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);
        $service = Service::create(['name' => 'Consulta', 'price' => 90, 'duration_minutes' => 30]);
        $attendance = \App\Models\Attendance::create([
            'client_id' => $client->id,
            'pet_id' => $pet->id,
            'status' => 'in_progress',
            'started_at' => now(),
        ]);
        $attendance->services()->attach($service->id, ['price' => 90, 'duration_minutes' => 30]);

        $this->deleteJson('/api/pets/'.$pet->id)->assertStatus(409)
            ->assertJsonPath('message', 'Não é possível excluir um pet que possui agendamentos ou atendimentos cadastrados.');
        $this->assertDatabaseHas('pets', ['id' => $pet->id]);
    }

    public function test_it_can_reassign_a_pet_to_another_existing_client(): void
    {
        $originalClient = $this->createClient();
        $newClient = $this->createClient([
            'name' => 'Novo Tutor',
            'email' => 'novo-tutor@example.com',
        ]);
        $pet = $this->createPet($originalClient);

        $this->patchJson("/api/pets/{$pet->id}", [
            'client_id' => $newClient->id,
        ])->assertOk()
            ->assertJsonPath('client_id', $newClient->id)
            ->assertJsonPath('client.id', $newClient->id)
            ->assertJsonPath('client.name', 'Novo Tutor');

        $this->assertDatabaseHas('pets', [
            'id' => $pet->id,
            'client_id' => $newClient->id,
        ]);
    }

    public function test_it_rejects_reassigning_a_pet_to_a_nonexistent_client(): void
    {
        $originalClient = $this->createClient();
        $pet = $this->createPet($originalClient);

        $this->patchJson("/api/pets/{$pet->id}", [
            'client_id' => 999999,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['client_id']);

        $this->assertDatabaseHas('pets', [
            'id' => $pet->id,
            'client_id' => $originalClient->id,
        ]);
    }

    public function test_partial_update_does_not_change_public_code(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);
        $originalPublicCode = $pet->public_code;

        $response = $this->patchJson("/api/pets/{$pet->id}", [
            'species' => 'Canino',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('public_code', $originalPublicCode);

        $this->assertSame($originalPublicCode, $pet->fresh()->public_code);
    }

    public function test_client_cannot_control_public_code(): void
    {
        $client = $this->createClient();
        $payload = $this->validPetPayload($client, [
            'public_code' => 'abcdef',
        ]);

        $response = $this->postJson('/api/pets', $payload);

        $response->assertCreated();
        $this->assertMatchesRegularExpression('/^[0-9]{6}$/D', $response->json('public_code'));
        $this->assertDatabaseMissing('pets', ['public_code' => 'abcdef']);
    }

    public function test_it_deletes_a_pet(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);

        $response = $this->deleteJson("/api/pets/{$pet->id}");

        $response->assertNoContent();

        $this->assertDatabaseMissing('pets', [
            'id' => $pet->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function validPetPayload(Client $client, array $attributes = []): array
    {
        return array_merge([
            'client_id' => $client->id,
            'name' => 'Rex',
            'species' => 'Cachorro',
            'breed' => 'Labrador',
            'sex' => 'Macho',
            'birth_date' => '2022-05-10',
            'weight' => 28.750,
            'notes' => 'Pet dócil.',
        ], $attributes);
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

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createPet(Client $client, array $attributes = []): Pet
    {
        return Pet::create(array_merge([
            'client_id' => $client->id,
            'name' => 'Rex',
            'species' => 'Cachorro',
            'breed' => 'Labrador',
            'sex' => 'Macho',
            'birth_date' => '2022-05-10',
            'weight' => 28.750,
            'notes' => 'Pet dócil.',
        ], $attributes));
    }
}
