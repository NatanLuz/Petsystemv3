<?php

namespace Tests\Feature;

use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_and_persists_a_valid_service(): void
    {
        $payload = $this->validPayload();

        $response = $this->postJson('/api/services', $payload);

        $response->assertCreated()->assertJsonFragment($payload)
            ->assertJsonStructure(['id', 'created_at', 'updated_at']);
        $this->assertDatabaseHas('services', $payload);
        $this->getJson('/api/services/'.$response->json('id'))
            ->assertOk()->assertJsonFragment($payload);
    }

    public function test_it_defaults_to_active_and_accepts_zero_price(): void
    {
        $payload = ['name' => 'Orientação', 'price' => 0, 'duration_minutes' => 10];

        $response = $this->postJson('/api/services', $payload);

        $response->assertCreated()->assertJsonPath('active', true)
            ->assertJsonPath('price', '0.00')->assertJsonPath('description', null);
        $this->assertDatabaseHas('services', array_merge($payload, ['active' => true, 'description' => null]));
    }

    public function test_it_lists_active_and_inactive_services(): void
    {
        $first = Service::create($this->validPayload());
        $second = Service::create($this->validPayload(['name' => 'Retorno', 'active' => false]));

        $this->getJson('/api/services')->assertOk()->assertJsonCount(2)
            ->assertJsonFragment(['id' => $first->id, 'active' => true])
            ->assertJsonFragment(['id' => $second->id, 'active' => false]);
    }

    public function test_it_returns_an_individual_service(): void
    {
        $service = Service::create($this->validPayload());

        $this->getJson('/api/services/'.$service->id)->assertOk()
            ->assertJsonPath('id', $service->id)->assertJsonFragment($this->validPayload());
    }

    public function test_it_partially_updates_and_preserves_omitted_fields(): void
    {
        $service = Service::create($this->validPayload());

        $this->patchJson('/api/services/'.$service->id, ['active' => false, 'description' => null])
            ->assertOk()->assertJsonPath('active', false)->assertJsonPath('description', null)
            ->assertJsonPath('name', $service->name)->assertJsonPath('price', '150.50')
            ->assertJsonPath('duration_minutes', 30);
        $this->assertDatabaseHas('services', array_merge($this->validPayload(), [
            'id' => $service->id, 'active' => false, 'description' => null,
        ]));
    }

    public function test_it_updates_all_fields_using_put(): void
    {
        $service = Service::create($this->validPayload());
        $payload = $this->validPayload([
            'name' => 'Retorno', 'description' => 'Reavaliação', 'price' => '0.00',
            'duration_minutes' => 15, 'active' => false,
        ]);

        $this->putJson('/api/services/'.$service->id, $payload)->assertOk()->assertJsonFragment($payload);
        $this->assertDatabaseHas('services', array_merge($payload, ['id' => $service->id]));
    }

    public function test_it_deletes_a_service(): void
    {
        $service = Service::create($this->validPayload());

        $this->deleteJson('/api/services/'.$service->id)->assertNoContent();
        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    }

    public function test_it_requires_name_price_and_duration_on_creation(): void
    {
        foreach (['name', 'price', 'duration_minutes'] as $field) {
            $payload = $this->validPayload();
            unset($payload[$field]);
            $this->postJson('/api/services', $payload)->assertUnprocessable()->assertJsonValidationErrors([$field]);
        }
        $this->assertDatabaseCount('services', 0);
    }

    public function test_it_rejects_invalid_fields_on_creation_and_update(): void
    {
        $service = Service::create($this->validPayload());
        $invalidFields = [
            ['name', null], ['name', ''], ['name', str_repeat('a', 256)], ['name', 123],
            ['description', ['invalid']],
            ['price', null], ['price', -1], ['price', 'invalid'], ['price', '1.001'], ['price', '100000000.00'],
            ['duration_minutes', null], ['duration_minutes', 0], ['duration_minutes', -1],
            ['duration_minutes', 1.5], ['duration_minutes', 2147483648],
            ['active', null], ['active', 'invalid'], ['active', 2],
        ];

        foreach ($invalidFields as [$field, $value]) {
            $this->postJson('/api/services', $this->validPayload([$field => $value]))
                ->assertUnprocessable()->assertJsonValidationErrors([$field]);
            $this->patchJson('/api/services/'.$service->id, [$field => $value])
                ->assertUnprocessable()->assertJsonValidationErrors([$field]);
        }

        $this->assertDatabaseCount('services', 1);
        $this->assertDatabaseHas('services', array_merge($this->validPayload(), ['id' => $service->id]));
    }

    public function test_it_accepts_valid_boundaries_and_false_on_creation(): void
    {
        $payload = $this->validPayload([
            'name' => str_repeat('a', 255), 'description' => null, 'price' => '99999999.99',
            'duration_minutes' => 2147483647, 'active' => false,
        ]);

        $this->postJson('/api/services', $payload)->assertCreated()->assertJsonFragment($payload);
        $this->assertDatabaseHas('services', $payload);
    }

    public function test_it_returns_not_found_for_missing_services(): void
    {
        $this->getJson('/api/services/999999')->assertNotFound();
        $this->patchJson('/api/services/999999', ['name' => 'Retorno'])->assertNotFound();
        $this->deleteJson('/api/services/999999')->assertNotFound();
    }

    public function test_it_ignores_fields_outside_the_contract(): void
    {
        $response = $this->postJson('/api/services', $this->validPayload([
            'id' => 999999, 'client_id' => 123, 'created_at' => '2000-01-01 00:00:00',
        ]));

        $response->assertCreated()->assertJsonMissingPath('client_id');
        $this->assertNotSame(999999, $response->json('id'));
        $this->assertStringNotContainsString('2000-01-01', $response->json('created_at'));
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function validPayload(array $attributes = []): array
    {
        return array_merge([
            'name' => 'Consulta veterinária',
            'description' => 'Avaliação clínica',
            'price' => '150.50',
            'duration_minutes' => 30,
            'active' => true,
        ], $attributes);
    }
}
