<?php

use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\HealthCheckController;
use App\Http\Controllers\Api\PetController;
use Illuminate\Http\Request;
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

Route::apiResource('clients', ClientController::class);
Route::apiResource('pets', PetController::class);

// Rota de exemplo para usuário autenticado via Sanctum
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
