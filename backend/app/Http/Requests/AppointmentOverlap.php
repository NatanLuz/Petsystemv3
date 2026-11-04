<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Carbon\CarbonImmutable;

class AppointmentOverlap
{
    public const CLINIC_TIME_ZONE = 'America/Sao_Paulo';

    public static function exists(int $petId, string $scheduledAt, int $durationMinutes, ?int $ignoreId = null): bool
    {
        $start = CarbonImmutable::parse($scheduledAt, self::CLINIC_TIME_ZONE);
        $end = $start->addMinutes($durationMinutes);
        $appointments = Appointment::query()
            ->where('pet_id', $petId)
            ->whereIn('status', [Appointment::STATUS_SCHEDULED, Appointment::STATUS_CONFIRMED])
            ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->get(['id', 'scheduled_at', 'duration_minutes']);

        foreach ($appointments as $appointment) {
            $existingStart = CarbonImmutable::parse(
                $appointment->getRawOriginal('scheduled_at'),
                self::CLINIC_TIME_ZONE,
            );
            $existingEnd = $existingStart->addMinutes((int) $appointment->duration_minutes);
            if ($start->lt($existingEnd) && $end->gt($existingStart)) {
                return true;
            }
        }

        return false;
    }

    public static function isInPast(string $scheduledAt): bool
    {
        return CarbonImmutable::parse($scheduledAt, self::CLINIC_TIME_ZONE)
            ->lt(CarbonImmutable::now(self::CLINIC_TIME_ZONE));
    }
}
