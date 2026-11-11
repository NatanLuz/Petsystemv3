<?php
namespace Tests\Feature;
use App\Models\{Appointment, Client, Pet, Service, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
class ReviewAppointmentRegressionTest extends \Tests\TestCase
{
    use RefreshDatabase;
    private function pair(): array
    {
        $this->actingAs(User::factory()->active()->admin()->create(), 'web');
        $client = Client::create(['name' => 'Teste', 'phone' => '11999999999']);
        $pet = Pet::create(['name' => 'Teste', 'species' => 'Gato', 'client_id' => $client->id]);
        $service = Service::create(['name' => 'Consulta', 'price' => '50.00', 'duration_minutes' => 30, 'active' => true]);
        $data = ['pet_id' => $pet->id, 'service_id' => $service->id, 'price' => '50.00', 'duration_minutes' => 30, 'status' => 'scheduled'];
        $first = Appointment::create($data + ['scheduled_at' => '2027-01-15 10:00:00']);
        $second = Appointment::create($data + ['scheduled_at' => '2027-01-15 10:30:00']);
        return [$first, $second, $service];
    }
    public function test_edit_preserves_snapshot_duration_after_catalog_change(): void
    {
        [$first, $second, $service] = $this->pair();
        $service->update(['duration_minutes' => 60]);
        $this->patchJson('/api/appointments/'.$first->id, ['notes' => 'Atualizado'])->assertOk();
        $this->assertSame(30, $first->fresh()->duration_minutes);
    }
    public function test_cancelled_record_can_be_edited_after_slot_is_reused(): void
    {
        [$first, $second, $service] = $this->pair();
        $first->update(['status' => 'cancelled', 'cancellation_reason' => 'Teste']);
        $second->update(['scheduled_at' => '2027-01-15 10:00:00']);
        $this->patchJson('/api/appointments/'.$first->id, ['notes' => 'Atualizado'])->assertOk();
    }
}