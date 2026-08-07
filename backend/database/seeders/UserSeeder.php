<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@petsystem.local'],
            [
                'name' => 'Administrador Demo',
                'password' => 'password',
                'role' => UserRole::Administrator->value,
                'email_verified_at' => now(),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'recepcao@petsystem.local'],
            [
                'name' => 'Recepcionista Demo',
                'password' => 'password',
                'role' => UserRole::Receptionist->value,
                'email_verified_at' => now(),
            ]
        );
    }
}
