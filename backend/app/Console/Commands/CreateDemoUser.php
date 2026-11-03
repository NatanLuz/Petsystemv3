<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Throwable;

class CreateDemoUser extends Command
{
    protected $signature = 'petsystem:create-user';

    protected $description = 'Cria interativamente um usuário local no banco SQLite de demonstração';

    public function handle(): int
    {
        if (config('app.env') !== 'demo') {
            $this->error('Este comando só pode ser executado no ambiente demo.');

            return self::FAILURE;
        }

        if (config('database.default') !== 'sqlite'
            || filled(config('database.connections.sqlite.url'))) {
            $this->error('Este comando exige a conexão SQLite sem URL externa.');

            return self::FAILURE;
        }

        if (! app()->runningUnitTests()) {
            $target = realpath(database_path('petsystem_demo.sqlite'));
            $configured = realpath((string) config('database.connections.sqlite.database'));

            if ($target === false || $configured === false || strcasecmp($target, $configured) !== 0) {
                $this->error('A conexão SQLite não aponta para o banco isolado de demonstração.');

                return self::FAILURE;
            }
        }

        try {
            if (DB::connection()->getDriverName() !== 'sqlite') {
                $this->error('A conexão ativa não é SQLite.');

                return self::FAILURE;
            }
        } catch (Throwable) {
            $this->error('Não foi possível abrir a conexão SQLite de demonstração.');

            return self::FAILURE;
        }

        $name = trim((string) $this->ask('Nome'));
        $email = mb_strtolower(trim((string) $this->ask('E-mail')));
        $role = trim((string) $this->ask('Perfil (admin, receptionist, veterinarian)'));
        $password = (string) $this->secret('Senha');
        $passwordConfirmation = (string) $this->secret('Confirme a senha');

        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'role' => $role,
            'password' => $password,
            'password_confirmation' => $passwordConfirmation,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'role' => ['required', Rule::in(User::ROLES)],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'email.email' => 'Informe um e-mail válido.',
            'email.unique' => 'Já existe um usuário com esse e-mail.',
            'role.in' => 'O perfil informado não é válido.',
            'password.min' => 'A senha deve ter pelo menos 8 caracteres.',
            'password.confirmed' => 'A confirmação da senha não confere.',
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $data = $validator->validated();
        $user = new User([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);
        $user->forceFill([
            'role' => $data['role'],
            'active' => true,
        ]);

        try {
            DB::transaction(fn () => $user->save());
        } catch (UniqueConstraintViolationException) {
            $this->error('Já existe um usuário com esse e-mail.');

            return self::FAILURE;
        }

        $this->info('Usuário ativo criado com sucesso.');

        return self::SUCCESS;
    }
}
