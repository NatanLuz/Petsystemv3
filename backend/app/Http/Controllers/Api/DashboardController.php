<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Carbon\CarbonImmutable;

class DashboardController extends Controller
{
    public function metrics()
    {
        $timeZone = 'America/Sao_Paulo';
        $now = CarbonImmutable::now($timeZone);
        $start = $now->startOfMonth();
        $revenue = Attendance::query()
            ->where('status', Attendance::STATUS_COMPLETED)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $start->utc()->format('Y-m-d H:i:s'))
            ->where('completed_at', '<=', $now->utc()->format('Y-m-d H:i:s'))
            ->sum('amount_charged');

        return response()->json([
            'revenue' => number_format((float) $revenue, 2, '.', ''),
            'currency' => 'BRL',
            'time_zone' => $timeZone,
            'period' => [
                'from' => $start->toDateString(),
                'through' => $now->toDateString(),
            ],
        ]);
    }
}
