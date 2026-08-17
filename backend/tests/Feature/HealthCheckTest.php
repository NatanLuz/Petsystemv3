<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_liveness_returns_ok_without_accessing_the_database(): void
    {
        DB::shouldReceive('select')->never();

        $response = $this->getJson('/api/health/live');

        $response
            ->assertOk()
            ->assertExactJson(['status' => 'ok']);
    }

    public function test_readiness_returns_ok_when_the_database_is_available(): void
    {
        DB::shouldReceive('select')
            ->once()
            ->with('select 1')
            ->andReturn([(object) ['result' => 1]]);

        $response = $this->getJson('/api/health/ready');

        $response
            ->assertOk()
            ->assertExactJson([
                'status' => 'ok',
                'database' => 'up',
            ]);
    }

    public function test_readiness_returns_service_unavailable_without_exposing_the_exception(): void
    {
        DB::shouldReceive('select')
            ->once()
            ->with('select 1')
            ->andThrow(new RuntimeException('sensitive connection details'));

        $response = $this->getJson('/api/health/ready');

        $response
            ->assertStatus(503)
            ->assertExactJson([
                'status' => 'unavailable',
                'database' => 'down',
            ])
            ->assertDontSee('sensitive connection details');
    }

    public function test_cors_allows_the_local_react_frontend(): void
    {
        $response = $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->getJson('/api/health/live');

        $response
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    public function test_cors_allows_the_frontend_preflight_request(): void
    {
        $response = $this->call(
            'OPTIONS',
            '/api/health/ready',
            server: [
                'HTTP_ORIGIN' => 'http://127.0.0.1:5173',
                'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
                'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type',
            ]
        );

        $response
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    public function test_cors_does_not_allow_an_unknown_origin(): void
    {
        $response = $this
            ->withHeader('Origin', 'https://example.com')
            ->getJson('/api/health/live');

        $response
            ->assertOk()
            ->assertHeaderMissing('Access-Control-Allow-Origin');
    }
}
