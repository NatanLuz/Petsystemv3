<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $all = [User::ROLE_ADMIN, User::ROLE_RECEPTIONIST, User::ROLE_VETERINARIAN];
        $operations = [User::ROLE_ADMIN, User::ROLE_RECEPTIONIST];
        $admin = [User::ROLE_ADMIN];

        $capabilities = [
            'clients.view' => $all,
            'clients.create' => $all,
            'clients.update' => $all,
            'clients.delete' => $operations,
            'pets.view' => $all,
            'pets.create' => $all,
            'pets.update' => $all,
            'pets.delete' => $operations,
            'services.view' => $all,
            'services.create' => $admin,
            'services.update' => $admin,
            'services.delete' => $admin,
            'appointments.view' => $all,
            'appointments.create' => $all,
            'appointments.update' => $all,
            'appointments.delete' => $admin,
        ];

        foreach ($capabilities as $ability => $roles) {
            Gate::define($ability, fn (User $user): bool => in_array($user->role, $roles, true));
        }
    }
}
