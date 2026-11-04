<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateUserCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_an_active_user_with_a_hashed_password_and_valid_role(): void
    {
        config(['app.env' => 'demo']);

        $this->artisan('petsystem:create-user')
            ->expectsQuestion('Nome', 'Admin Demo')
            ->expectsQuestion('E-mail', 'ADMIN.DEMO@example.invalid')
            ->expectsQuestion('Perfil (admin, receptionist, veterinarian)', User::ROLE_ADMIN)
            ->expectsQuestion('Senha', 'demo-only-password')
            ->expectsQuestion('Confirme a senha', 'demo-only-password')
            ->expectsOutputToContain('Usuário ativo criado com sucesso.')
            ->assertExitCode(0);

        $user = User::query()->where('email', 'admin.demo@example.invalid')->firstOrFail();

        $this->assertSame(User::ROLE_ADMIN, $user->role);
        $this->assertTrue($user->active);
        $this->assertNotSame('demo-only-password', $user->password);
        $this->assertTrue(Hash::check('demo-only-password', $user->password));
    }

    public function test_it_rejects_a_duplicate_email_without_creating_another_user(): void
    {
        config(['app.env' => 'demo']);
        User::factory()->create(['email' => 'already-used@example.invalid']);

        $this->artisan('petsystem:create-user')
            ->expectsQuestion('Nome', 'Second User')
            ->expectsQuestion('E-mail', 'ALREADY-USED@example.invalid')
            ->expectsQuestion('Perfil (admin, receptionist, veterinarian)', User::ROLE_RECEPTIONIST)
            ->expectsQuestion('Senha', 'demo-only-password')
            ->expectsQuestion('Confirme a senha', 'demo-only-password')
            ->expectsOutputToContain('Já existe um usuário com esse e-mail.')
            ->assertExitCode(1);

        $this->assertDatabaseCount('users', 1);
    }

    public function test_it_rejects_a_password_shorter_than_eight_characters(): void
    {
        config(['app.env' => 'demo']);

        $this->artisan('petsystem:create-user')
            ->expectsQuestion('Nome', 'Demo User')
            ->expectsQuestion('E-mail', 'short-password@example.invalid')
            ->expectsQuestion('Perfil (admin, receptionist, veterinarian)', User::ROLE_VETERINARIAN)
            ->expectsQuestion('Senha', 'short')
            ->expectsQuestion('Confirme a senha', 'short')
            ->expectsOutputToContain('A senha deve ter pelo menos 8 caracteres.')
            ->assertExitCode(1);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_it_refuses_to_run_outside_the_demo_environment(): void
    {
        config(['app.env' => 'testing']);

        $this->artisan('petsystem:create-user')
            ->expectsOutputToContain('Este comando só pode ser executado no ambiente demo.')
            ->assertExitCode(1);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_it_refuses_to_run_when_the_default_connection_is_not_sqlite(): void
    {
        config([
            'app.env' => 'demo',
            'database.default' => 'mysql',
        ]);

        try {
            $this->artisan('petsystem:create-user')
                ->expectsOutputToContain('Este comando exige a conexão SQLite sem URL externa.')
                ->assertExitCode(1);
        } finally {
            config(['database.default' => 'sqlite']);
        }

        $this->assertDatabaseCount('users', 0);
    }
}
