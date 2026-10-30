<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Attendance;
use App\Models\Client;
use App\Models\Pet;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AttendanceApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->active()->receptionist()->create(), 'web');
    }

    public function test_receptionist_starts_attendance_from_confirmed_appointment_and_records_payment(): void
    {
        [$client, $pet, $service] = $this->records();
        $appointment = $this->appointment($pet, $service);

        $response = $this->postJson('/api/attendances', [
            'appointment_id' => $appointment->id,
            'amount_charged' => '140.00',
            'payment_method' => 'Pix',
        ]);

        $response->assertCreated()
            ->assertJsonPath('appointment_id', $appointment->id)
            ->assertJsonPath('client.id', $client->id)
            ->assertJsonPath('pet.id', $pet->id)
            ->assertJsonPath('services.0.id', $service->id)
            ->assertJsonPath('amount_charged', '140.00')
            ->assertJsonPath('payment_method', 'Pix');

        $this->assertDatabaseHas('appointments', ['id' => $appointment->id, 'status' => Appointment::STATUS_IN_PROGRESS]);
        $this->postJson('/api/attendances', ['appointment_id' => $appointment->id])
            ->assertUnprocessable()->assertJsonValidationErrors(['appointment_id']);
    }

    public function test_avulso_attendance_requires_a_pet_owned_by_the_selected_client(): void
    {
        [$client, $pet, $service] = $this->records();
        $this->postJson('/api/attendances', [
            'client_id' => $client->id,
            'pet_id' => $pet->id,
            'service_ids' => [$service->id],
        ])->assertCreated()->assertJsonPath('appointment_id', null);

        $otherClient = $this->client('Outro cliente', 'outro@example.com', '11977776666');
        $this->postJson('/api/attendances', [
            'client_id' => $otherClient->id,
            'pet_id' => $pet->id,
            'service_ids' => [$service->id],
        ])->assertUnprocessable()->assertJsonValidationErrors(['pet_id']);
    }

    public function test_veterinarian_can_record_clinical_evolution_but_not_payment_fields(): void
    {
        [$client, $pet, $service] = $this->records();
        $this->actingAs(User::factory()->active()->veterinarian()->create(), 'web');
        $attendance = $this->postJson('/api/attendances', [
            'client_id' => $client->id,
            'pet_id' => $pet->id,
            'service_ids' => [$service->id],
            'evolution' => 'Exame clínico realizado.',
        ])->assertCreated()->json();

        $this->getJson('/api/attendances/'.$attendance['id'])->assertOk()
            ->assertJsonPath('evolution', 'Exame clínico realizado.')
            ->assertJsonMissingPath('amount_charged')
            ->assertJsonMissingPath('payment_method');

        $this->patchJson('/api/attendances/'.$attendance['id'], ['amount_charged' => 100])
            ->assertForbidden();
    }

    public function test_veterinarian_api_responses_never_include_monetary_values(): void
    {
        [$client, $pet, $service] = $this->records();
        $appointment = $this->appointment($pet, $service);
        $this->actingAs(User::factory()->active()->veterinarian()->create(), 'web');
        $attendance = $this->postJson('/api/attendances', [
            'client_id' => $client->id,
            'pet_id' => $pet->id,
            'service_ids' => [$service->id],
            'evolution' => 'Exame realizado.',
        ])->assertCreated()->json();

        $this->getJson('/api/attendances/'.$attendance['id'])->assertOk()
            ->assertJsonMissingPath('amount_charged')
            ->assertJsonMissingPath('payment_method')
            ->assertJsonMissingPath('services.0.price')
            ->assertJsonMissingPath('services.0.pivot.price');
        $this->getJson('/api/appointments')->assertOk()
            ->assertJsonMissingPath('0.price')
            ->assertJsonMissingPath('0.service.price');
        $this->getJson('/api/services')->assertOk()->assertJsonMissingPath('0.price');
        $this->getJson('/api/pets/'.$pet->id)->assertOk()
            ->assertJsonMissingPath('appointments.0.price')
            ->assertJsonMissingPath('appointments.0.service.price');
    }

    public function test_receptionist_can_update_payment_but_cannot_write_clinical_evolution(): void
    {
        [$client, $pet, $service] = $this->records();
        $attendance = $this->postJson('/api/attendances', [
            'client_id' => $client->id,
            'pet_id' => $pet->id,
            'service_ids' => [$service->id],
        ])->assertCreated()->json();

        $this->patchJson('/api/attendances/'.$attendance['id'], [
            'amount_charged' => '125.00',
            'payment_method' => 'Cartão de débito',
        ])->assertOk()->assertJsonPath('amount_charged', '125.00');

        $this->patchJson('/api/attendances/'.$attendance['id'], ['evolution' => 'Exame'])
            ->assertForbidden();
    }

    public function test_only_veterinarian_or_admin_can_complete_after_recording_evolution(): void
    {
        [$client, $pet, $service] = $this->records();
        $this->actingAs(User::factory()->active()->veterinarian()->create(), 'web');
        $attendance = $this->postJson('/api/attendances', [
            'client_id' => $client->id, 'pet_id' => $pet->id, 'service_ids' => [$service->id],
        ])->assertCreated()->json();

        $this->patchJson('/api/attendances/'.$attendance['id'], ['status' => 'completed'])
            ->assertUnprocessable()->assertJsonValidationErrors(['evolution']);
        $this->patchJson('/api/attendances/'.$attendance['id'], [
            'status' => 'completed', 'evolution' => 'Tratamento concluído.',
        ])->assertOk()->assertJsonPath('status', 'completed')->assertJsonStructure(['completed_at']);
    }

    public function test_scheduled_appointment_must_be_confirmed_before_starting_attendance(): void
    {
        [, $pet, $service] = $this->records();
        $appointment = $this->appointment($pet, $service, Appointment::STATUS_SCHEDULED);
        $this->postJson('/api/attendances', ['appointment_id' => $appointment->id])
            ->assertUnprocessable()->assertJsonValidationErrors(['appointment_id']);
    }

    public function test_receptionist_cannot_delete_attendance_records(): void
    {
        [$client, $pet, $service] = $this->records();
        $attendance = $this->postJson('/api/attendances', [
            'client_id' => $client->id, 'pet_id' => $pet->id, 'service_ids' => [$service->id],
        ])->assertCreated()->json();

        $this->deleteJson('/api/attendances/'.$attendance['id'])->assertForbidden();
    }

    public function test_admin_cannot_delete_permanent_attendance_records(): void
    {
        [$client, $pet, $service] = $this->records();
        $attendance = $this->postJson('/api/attendances', [
            'client_id' => $client->id, 'pet_id' => $pet->id, 'service_ids' => [$service->id],
        ])->assertCreated()->json();
        Auth::forgetGuards();
        $this->actingAs(User::factory()->active()->admin()->create(), 'web')
            ->deleteJson('/api/attendances/'.$attendance['id'])->assertStatus(409);
        $this->assertDatabaseHas('attendances', ['id' => $attendance['id']]);
    }

    /** @return array{Client, Pet, Service} */
    private function records(): array
    {
        $client = $this->client();
        $pet = Pet::create(['client_id' => $client->id, 'name' => 'Rex', 'species' => 'Cachorro']);
        $service = Service::create(['name' => 'Consulta', 'price' => '125.00', 'duration_minutes' => 30, 'active' => true]);

        return [$client, $pet, $service];
    }

    private function client(string $name = 'Tutor', string $email = 'tutor@example.com', string $phone = '11988887777'): Client
    {
        return Client::create(['name' => $name, 'email' => $email, 'phone' => $phone]);
    }

    private function appointment(Pet $pet, Service $service, string $status = Appointment::STATUS_CONFIRMED): Appointment
    {
        return Appointment::create([
            'pet_id' => $pet->id, 'service_id' => $service->id,
            'scheduled_at' => now('America/Sao_Paulo')->addDay()->format('Y-m-d H:i:s'),
            'price' => $service->price, 'duration_minutes' => $service->duration_minutes, 'status' => $status,
        ]);
    }
}
