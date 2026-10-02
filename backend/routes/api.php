<?php

use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\HealthCheckController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| PETSYSTEM V3 API REST initial routes configuration.
|
*/

// Liveness: confirma que a aplicação Laravel está respondendo.
Route::get('/health/live', [HealthCheckController::class, 'live']);

// Readiness: confirma que a aplicação está pronta para operar com o banco.
Route::get('/health/ready', [HealthCheckController::class, 'ready']);

Route::middleware(['auth:sanctum', EnsureUserIsActive::class])->group(function () {
    foreach ([
        'clients' => ClientController::class,
        'pets' => PetController::class,
        'services' => ServiceController::class,
        'appointments' => AppointmentController::class,
    ] as $resource => $controller) {
        Route::apiResource($resource, $controller)
            ->middlewareFor(['index', 'show'], 'can:'.$resource.'.view')
            ->middlewareFor('store', 'can:'.$resource.'.create')
            ->middlewareFor('update', 'can:'.$resource.'.update')
            ->middlewareFor('destroy', 'can:'.$resource.'.delete');
    }
});
