<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthCheckController extends Controller
{
    /**
     * Indica que a aplicação Laravel está respondendo.
     */
    public function live(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
        ]);
    }

    /**
     * Indica se a aplicação está pronta para operar com o banco de dados.
     */
    public function ready(): JsonResponse
    {
        try {
            DB::select('select 1');
        } catch (Throwable) {
            return response()->json([
                'status' => 'unavailable',
                'database' => 'down',
            ], 503);
        }

        return response()->json([
            'status' => 'ok',
            'database' => 'up',
        ]);
    }
}
