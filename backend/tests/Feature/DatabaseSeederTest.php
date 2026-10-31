<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_seeder_does_not_create_a_known_password_account(): void
    {
        $this->seed();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_optional_demo_seeder_is_fake_and_idempotent(): void
    {
        Artisan::call('db:seed', ['--class' => \Database\Seeders\DemoDataSeeder::class]);
        Artisan::call('db:seed', ['--class' => \Database\Seeders\DemoDataSeeder::class]);

        $this->assertDatabaseCount('clients', 2);
        $this->assertDatabaseCount('pets', 2);
        $this->assertDatabaseCount('services', 2);
        $this->assertDatabaseCount('appointments', 2);
        $this->assertDatabaseCount('users', 0);
    }
}
