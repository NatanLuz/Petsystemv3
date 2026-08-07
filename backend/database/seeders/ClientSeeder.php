<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        Client::factory()
            ->active()
            ->create([
                'name' => 'Mariana Souza',
                'email' => 'mariana.souza@example.com',
                'phone' => '(11) 99999-1001',
                'document' => '123.456.789-01',
                'address' => 'Rua das Flores, 120',
                'notes' => 'Cliente frequente para banho e tosa.',
            ]);

        Client::factory()
            ->active()
            ->create([
                'name' => 'Carlos Henrique',
                'email' => 'carlos.henrique@example.com',
                'phone' => '(11) 99999-1002',
                'document' => '987.654.321-09',
                'address' => 'Avenida Central, 455',
                'notes' => 'Prefere atendimento no período da manhã.',
            ]);

        Client::factory()
            ->inactive()
            ->create([
                'name' => 'Ana Martins',
                'email' => 'ana.martins@example.com',
                'phone' => '(11) 99999-1003',
                'document' => '456.789.123-00',
                'address' => 'Rua dos Pinheiros, 88',
                'notes' => 'Cadastro mantido para histórico.',
            ]);
    }
}
