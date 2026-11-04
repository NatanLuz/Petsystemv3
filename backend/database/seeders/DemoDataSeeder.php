<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Pet;
use App\Models\Service;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $clients = collect([
            ['name' => 'Marina Costa (Demonstração)', 'email' => 'marina.demo@example.invalid', 'phone' => '11987654321'],
            ['name' => 'Rafael Nunes (Demonstração)', 'email' => 'rafael.demo@example.invalid', 'phone' => '11976543210'],
        ])->map(fn (array $data) => Client::query()->firstOrCreate(['email' => $data['email']], $data));

        $pets = collect([
            ['client' => $clients[0], 'name' => 'Luna Demo', 'species' => 'Cão', 'breed' => 'SRD'],
            ['client' => $clients[1], 'name' => 'Milo Demo', 'species' => 'Gato', 'breed' => 'SRD'],
        ])->map(fn (array $data) => Pet::query()->firstOrCreate(
            ['client_id' => $data['client']->id, 'name' => $data['name']],
            ['species' => $data['species'], 'breed' => $data['breed'], 'notes' => 'Registro fictício para demonstração.'],
        ));

        $services = collect([
            ['name' => 'Consulta demonstrativa', 'description' => 'Serviço fictício para demonstração.', 'price' => 120, 'duration_minutes' => 45],
            ['name' => 'Banho demonstrativo', 'description' => 'Serviço fictício para demonstração.', 'price' => 70, 'duration_minutes' => 60],
        ])->map(fn (array $data) => Service::query()->firstOrCreate(['name' => $data['name']], $data));

        $date = now('America/Sao_Paulo')->addDay()->toDateString();
        foreach ([
            [$pets[0], $services[0], '10:00', 'DEMO-SEEDER:appointment-1'],
            [$pets[1], $services[1], '11:00', 'DEMO-SEEDER:appointment-2'],
        ] as [$pet, $service, $time, $marker]) {
            Appointment::query()->firstOrCreate(
                ['notes' => $marker],
                [
                    'pet_id' => $pet->id,
                    'service_id' => $service->id,
                    'scheduled_at' => "{$date} {$time}:00",
                    'price' => $service->price,
                    'duration_minutes' => $service->duration_minutes,
                    'status' => Appointment::STATUS_SCHEDULED,
                ],
            );
        }
    }
}
