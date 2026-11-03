<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Client;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_finance_metric_sums_only_completed_attendances_in_the_local_month(): void
    {
        $client = Client::create(['name' => 'Tutor', 'phone' => '11988887777']);
        $pet = Pet::create(['client_id' => $client->id, 'name' => 'Rex', 'species' => 'Cachorro']);
        Attendance::create([
            'client_id' => $client->id, 'pet_id' => $pet->id, 'status' => Attendance::STATUS_COMPLETED,
            'amount_charged' => '125.50', 'completed_at' => now(),
        ]);
        Attendance::create([
            'client_id' => $client->id, 'pet_id' => $pet->id, 'status' => Attendance::STATUS_IN_PROGRESS,
            'amount_charged' => '80.00', 'completed_at' => null,
        ]);
        Attendance::create([
            'client_id' => $client->id, 'pet_id' => $pet->id, 'status' => Attendance::STATUS_COMPLETED,
            'amount_charged' => '40.00', 'completed_at' => now('America/Sao_Paulo')->subMonthNoOverflow()->utc(),
        ]);

        $this->actingAs(User::factory()->active()->receptionist()->create(), 'web')
            ->getJson('/api/dashboard/metrics')
            ->assertOk()
            ->assertJsonPath('revenue', '125.50')
            ->assertJsonPath('currency', 'BRL')
            ->assertJsonPath('time_zone', 'America/Sao_Paulo');
    }

    public function test_administrator_can_view_financial_metrics(): void
    {
        $this->actingAs(User::factory()->active()->admin()->create(), 'web')
            ->getJson('/api/dashboard/metrics')->assertOk();
    }

    public function test_veterinarian_cannot_view_financial_metrics(): void
    {
        $this->actingAs(User::factory()->active()->veterinarian()->create(), 'web')
            ->getJson('/api/dashboard/metrics')->assertForbidden();
    }
    public function test_receptionist_can_view_financial_metrics(): void
    {
        $this->actingAs(User::factory()->active()->receptionist()->create(), 'web')
            ->getJson('/api/dashboard/metrics')
            ->assertOk();
    }
}
