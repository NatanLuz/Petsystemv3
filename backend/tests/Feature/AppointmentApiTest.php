<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Pet;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_appointments_with_pet_client_and_service(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);
        $service = $this->createService();
        $appointment = $this->createAppointment($pet, $service);

        $response = $this->getJson('/api/appointments');

        $response
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $appointment->id)
            ->assertJsonPath('0.pet.id', $pet->id)
            ->assertJsonPath('0.pet.client.id', $client->id)
            ->assertJsonPath('0.service.id', $service->id);
    }

    public function test_it_creates_a_valid_appointment(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);
        $service = $this->createService();

        $response = $this->postJson('/api/appointments', $this->validPayload($pet, $service));

        $response
            ->assertCreated()
            ->assertJsonPath('pet_id', $pet->id)
            ->assertJsonPath('service_id', $service->id)
            ->assertJsonPath('pet.client.id', $client->id)
            ->assertJsonPath('service.id', $service->id);

        $this->assertDatabaseHas('appointments', [
            'pet_id' => $pet->id,
            'service_id' => $service->id,
            'scheduled_at' => '2026-09-25 14:00:00',
            'notes' => 'Primeira consulta',
        ]);
    }

    public function test_creation_copies_price_from_service(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService(['price' => '275.90']);

        $response = $this->postJson('/api/appointments', $this->validPayload($pet, $service));

        $response->assertCreated()->assertJsonPath('price', '275.90');
        $this->assertDatabaseHas('appointments', [
            'id' => $response->json('id'),
            'price' => '275.90',
        ]);
    }

    public function test_creation_copies_duration_minutes_from_service(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService(['duration_minutes' => 45]);

        $response = $this->postJson('/api/appointments', $this->validPayload($pet, $service));

        $response->assertCreated()->assertJsonPath('duration_minutes', 45);
        $this->assertDatabaseHas('appointments', [
            'id' => $response->json('id'),
            'duration_minutes' => 45,
        ]);
    }

    public function test_client_cannot_overwrite_price_snapshot_on_creation(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService(['price' => '150.50']);
        $payload = $this->validPayload($pet, $service, ['price' => '1.00']);

        $response = $this->postJson('/api/appointments', $payload);

        $response->assertCreated()->assertJsonPath('price', '150.50');
        $this->assertDatabaseHas('appointments', [
            'id' => $response->json('id'),
            'price' => '150.50',
        ]);
        $this->assertDatabaseMissing('appointments', [
            'id' => $response->json('id'),
            'price' => '1.00',
        ]);
    }

    public function test_client_cannot_overwrite_duration_minutes_snapshot_on_creation(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService(['duration_minutes' => 30]);
        $payload = $this->validPayload($pet, $service, ['duration_minutes' => 999]);

        $response = $this->postJson('/api/appointments', $payload);

        $response->assertCreated()->assertJsonPath('duration_minutes', 30);
        $this->assertDatabaseHas('appointments', [
            'id' => $response->json('id'),
            'duration_minutes' => 30,
        ]);
        $this->assertDatabaseMissing('appointments', [
            'id' => $response->json('id'),
            'duration_minutes' => 999,
        ]);
    }

    public function test_it_rejects_a_nonexistent_pet_id(): void
    {
        $service = $this->createService();

        $this->postJson('/api/appointments', [
            'pet_id' => 999999,
            'service_id' => $service->id,
            'scheduled_at' => '2026-09-25 14:00:00',
        ])->assertUnprocessable()->assertJsonValidationErrors(['pet_id']);
    }

    public function test_it_rejects_a_nonexistent_service_id(): void
    {
        $pet = $this->createPet($this->createClient());

        $this->postJson('/api/appointments', [
            'pet_id' => $pet->id,
            'service_id' => 999999,
            'scheduled_at' => '2026-09-25 14:00:00',
        ])->assertUnprocessable()->assertJsonValidationErrors(['service_id']);
    }

    public function test_inactive_service_cannot_be_used_for_new_appointment(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService(['active' => false]);

        $this->postJson('/api/appointments', $this->validPayload($pet, $service))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['service_id']);

        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_it_rejects_invalid_scheduled_at(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService();

        $this->postJson('/api/appointments', $this->validPayload($pet, $service, [
            'scheduled_at' => 'invalid-date',
        ]))->assertUnprocessable()->assertJsonValidationErrors(['scheduled_at']);
    }

    public function test_it_rejects_invalid_status(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService();

        $this->postJson('/api/appointments', $this->validPayload($pet, $service, [
            'status' => 'completed',
        ]))->assertUnprocessable()->assertJsonValidationErrors(['status']);
    }

    public function test_it_defaults_status_to_scheduled(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService();

        $response = $this->postJson('/api/appointments', $this->validPayload($pet, $service));

        $response->assertCreated()->assertJsonPath('status', 'scheduled');
        $this->assertDatabaseHas('appointments', [
            'id' => $response->json('id'),
            'status' => 'scheduled',
        ]);
    }

    public function test_it_returns_an_individual_appointment(): void
    {
        $client = $this->createClient();
        $pet = $this->createPet($client);
        $service = $this->createService();
        $appointment = $this->createAppointment($pet, $service);

        $this->getJson('/api/appointments/'.$appointment->id)
            ->assertOk()
            ->assertJsonPath('id', $appointment->id)
            ->assertJsonPath('pet.id', $pet->id)
            ->assertJsonPath('pet.client.id', $client->id)
            ->assertJsonPath('service.id', $service->id);
    }

    public function test_it_partially_updates_an_appointment(): void
    {
        $appointment = $this->createAppointment(
            $this->createPet($this->createClient()),
            $this->createService(),
        );

        $this->patchJson('/api/appointments/'.$appointment->id, [
            'status' => 'confirmed',
            'notes' => 'Confirmado por telefone',
        ])->assertOk()
            ->assertJsonPath('status', 'confirmed')
            ->assertJsonPath('notes', 'Confirmado por telefone');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'confirmed',
            'notes' => 'Confirmado por telefone',
        ]);
    }

    public function test_changing_service_id_recalculates_snapshot(): void
    {
        $pet = $this->createPet($this->createClient());
        $oldService = $this->createService(['price' => '100.00', 'duration_minutes' => 20]);
        $newService = $this->createService(['price' => '250.75', 'duration_minutes' => 60]);
        $appointment = $this->createAppointment($pet, $oldService);

        $this->patchJson('/api/appointments/'.$appointment->id, [
            'service_id' => $newService->id,
        ])->assertOk()
            ->assertJsonPath('service_id', $newService->id)
            ->assertJsonPath('price', '250.75')
            ->assertJsonPath('duration_minutes', 60);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'service_id' => $newService->id,
            'price' => '250.75',
            'duration_minutes' => 60,
        ]);
    }

    public function test_patch_without_changing_service_id_preserves_snapshot_after_service_changes(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService(['price' => '100.00', 'duration_minutes' => 20]);
        $appointment = $this->createAppointment($pet, $service);

        $service->update(['price' => '999.99', 'duration_minutes' => 120]);

        $this->patchJson('/api/appointments/'.$appointment->id, [
            'notes' => 'Sem troca de serviço',
        ])->assertOk()
            ->assertJsonPath('price', '100.00')
            ->assertJsonPath('duration_minutes', 20)
            ->assertJsonPath('notes', 'Sem troca de serviço');
    }

    public function test_appointment_with_service_later_inactive_can_be_updated_without_changing_service(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService();
        $appointment = $this->createAppointment($pet, $service);
        $service->update(['active' => false]);

        $this->patchJson('/api/appointments/'.$appointment->id, [
            'status' => 'confirmed',
        ])->assertOk()
            ->assertJsonPath('status', 'confirmed')
            ->assertJsonPath('service_id', $service->id);
    }

    public function test_it_rejects_changing_to_inactive_service(): void
    {
        $pet = $this->createPet($this->createClient());
        $activeService = $this->createService();
        $inactiveService = $this->createService(['active' => false]);
        $appointment = $this->createAppointment($pet, $activeService);

        $this->patchJson('/api/appointments/'.$appointment->id, [
            'service_id' => $inactiveService->id,
        ])->assertUnprocessable()->assertJsonValidationErrors(['service_id']);
    }

    public function test_it_deletes_an_appointment(): void
    {
        $appointment = $this->createAppointment(
            $this->createPet($this->createClient()),
            $this->createService(),
        );

        $this->deleteJson('/api/appointments/'.$appointment->id)->assertNoContent();
        $this->assertDatabaseMissing('appointments', ['id' => $appointment->id]);
    }

    public function test_it_returns_not_found_for_missing_appointments(): void
    {
        $this->getJson('/api/appointments/999999')->assertNotFound();
        $this->patchJson('/api/appointments/999999', ['status' => 'confirmed'])->assertNotFound();
        $this->deleteJson('/api/appointments/999999')->assertNotFound();
    }

    public function test_pet_with_appointment_cannot_be_deleted(): void
    {
        $pet = $this->createPet($this->createClient());
        $this->createAppointment($pet, $this->createService());

        $this->deleteJson('/api/pets/'.$pet->id)
            ->assertConflict()
            ->assertJsonPath('message', 'Não é possível excluir um pet que possui agendamentos cadastrados.');

        $this->assertDatabaseHas('pets', ['id' => $pet->id]);
    }

    public function test_pet_without_appointment_can_be_deleted(): void
    {
        $pet = $this->createPet($this->createClient());

        $this->deleteJson('/api/pets/'.$pet->id)->assertNoContent();
        $this->assertDatabaseMissing('pets', ['id' => $pet->id]);
    }

    public function test_service_with_appointment_cannot_be_deleted(): void
    {
        $service = $this->createService();
        $this->createAppointment($this->createPet($this->createClient()), $service);

        $this->deleteJson('/api/services/'.$service->id)
            ->assertConflict()
            ->assertJsonPath('message', 'Não é possível excluir um serviço que possui agendamentos cadastrados.');

        $this->assertDatabaseHas('services', ['id' => $service->id]);
    }

    public function test_service_without_appointment_can_be_deleted(): void
    {
        $service = $this->createService();

        $this->deleteJson('/api/services/'.$service->id)->assertNoContent();
        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    }

    public function test_associated_service_can_be_deactivated(): void
    {
        $service = $this->createService();
        $this->createAppointment($this->createPet($this->createClient()), $service);

        $this->patchJson('/api/services/'.$service->id, ['active' => false])
            ->assertOk()
            ->assertJsonPath('active', false);

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'active' => false,
        ]);
    }

    public function test_pet_client_relationship_is_loaded(): void
    {
        $client = $this->createClient(['name' => 'Ana Souza']);
        $pet = $this->createPet($client, ['name' => 'Rex']);
        $appointment = $this->createAppointment($pet, $this->createService());

        $this->getJson('/api/appointments/'.$appointment->id)
            ->assertOk()
            ->assertJsonPath('pet.name', 'Rex')
            ->assertJsonPath('pet.client.name', 'Ana Souza');
    }

    public function test_service_relationship_is_loaded(): void
    {
        $service = $this->createService(['name' => 'Banho']);
        $appointment = $this->createAppointment($this->createPet($this->createClient()), $service);

        $this->getJson('/api/appointments/'.$appointment->id)
            ->assertOk()
            ->assertJsonPath('service.name', 'Banho');
    }

    public function test_it_updates_using_put(): void
    {
        $pet = $this->createPet($this->createClient());
        $service = $this->createService();
        $appointment = $this->createAppointment($pet, $service);

        $this->putJson('/api/appointments/'.$appointment->id, [
            'pet_id' => $pet->id,
            'service_id' => $service->id,
            'scheduled_at' => '2026-10-01 09:30:00',
            'status' => 'cancelled',
            'notes' => null,
        ])->assertOk()
            ->assertJsonPath('status', 'cancelled')
            ->assertJsonPath('notes', null)
            ->assertJsonPath('price', '150.50')
            ->assertJsonPath('duration_minutes', 30);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'scheduled_at' => '2026-10-01 09:30:00',
            'status' => 'cancelled',
            'notes' => null,
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

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createService(array $attributes = []): Service
    {
        return Service::create(array_merge([
            'name' => 'Consulta veterinária',
            'description' => 'Avaliação clínica',
            'price' => '150.50',
            'duration_minutes' => 30,
            'active' => true,
        ], $attributes));
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createAppointment(Pet $pet, Service $service, array $attributes = []): Appointment
    {
        return Appointment::create(array_merge([
            'pet_id' => $pet->id,
            'service_id' => $service->id,
            'scheduled_at' => '2026-09-25 14:00:00',
            'price' => $service->price,
            'duration_minutes' => $service->duration_minutes,
            'status' => 'scheduled',
            'notes' => 'Primeira consulta',
        ], $attributes));
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function validPayload(Pet $pet, Service $service, array $attributes = []): array
    {
        return array_merge([
            'pet_id' => $pet->id,
            'service_id' => $service->id,
            'scheduled_at' => '2026-09-25 14:00:00',
            'notes' => 'Primeira consulta',
        ], $attributes);
    }
}
