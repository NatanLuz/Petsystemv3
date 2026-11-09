<?php

// Leitura local sem nomes, e-mails, senhas ou chaves na saída.
require __DIR__.'/../backend/vendor/autoload.php';
$app = require __DIR__.'/../backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$expected = realpath(__DIR__.'/../backend/database/petsystem_demo.sqlite');
$configured = realpath((string) config('database.connections.sqlite.database'));
if (config('app.env') !== 'demo' || config('database.default') !== 'sqlite'
    || config('database.connections.sqlite.url') || ! $expected
    || ! $configured || strcasecmp($expected, $configured) !== 0) {
    fwrite(STDERR, "Ambiente ou banco divergente; inspeção cancelada.\n");
    exit(1);
}
$db = Illuminate\Support\Facades\DB::connection();
$db->statement('PRAGMA query_only = ON');
$roles = $db->select('SELECT role, COUNT(*) AS active_accounts FROM users WHERE active = 1 GROUP BY role');
$health = $app->make(App\Http\Controllers\Api\HealthCheckController::class)->ready();
echo json_encode([
    'environment' => config('app.env'),
    'driver' => $db->getDriverName(),
    'expected_database' => true,
    'debug' => config('app.debug'),
    'key_configured' => filled(config('app.key')),
    'session_driver' => config('session.driver'),
    'active_roles' => $roles,
    'readiness_status' => $health->getStatusCode(),
    'readiness' => $health->getData(true),
    'integrity' => $db->select('PRAGMA quick_check'),
    'foreign_key_violations' => count($db->select('PRAGMA foreign_key_check')),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
