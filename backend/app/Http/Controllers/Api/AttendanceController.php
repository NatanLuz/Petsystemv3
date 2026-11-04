<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Models\Appointment;
use App\Models\Attendance;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    public function index()
    {
        $attendances = Attendance::with(['appointment', 'client', 'pet', 'services', 'responsibleVeterinarian'])
            ->latest('started_at')->get();

        return response()->json($attendances->map(fn (Attendance $attendance) => $this->serializeAttendance($attendance)));
    }

    public function store(StoreAttendanceRequest $request)
    {
        $data = $request->validated();

        $attendance = DB::transaction(function () use ($data, $request): Attendance {
            $appointment = isset($data['appointment_id'])
                ? Appointment::with('pet')->lockForUpdate()->findOrFail($data['appointment_id'])
                : null;
            if ($appointment && Attendance::where('appointment_id', $appointment->id)->exists()) {
                throw ValidationException::withMessages(['appointment_id' => 'Este agendamento já possui um atendimento iniciado.']);
            }
            if ($appointment && $appointment->status !== Appointment::STATUS_CONFIRMED) {
                throw ValidationException::withMessages(['appointment_id' => 'Confirme o agendamento antes de iniciar o atendimento.']);
            }
            $serviceIds = $appointment ? [$appointment->service_id] : array_values(array_unique($data['service_ids']));
            $services = Service::whereIn('id', $serviceIds)->get()->keyBy('id');
            $amount = $services->sum(fn (Service $service) => (float) $service->price);
            $veterinarianId = $request->user()->role === User::ROLE_VETERINARIAN ? $request->user()->id : null;

            $attendance = Attendance::create([
                'appointment_id' => $appointment?->id,
                'client_id' => $appointment?->pet->client_id ?? $data['client_id'],
                'pet_id' => $appointment?->pet_id ?? $data['pet_id'],
                'responsible_veterinarian_id' => $veterinarianId,
                'status' => Attendance::STATUS_IN_PROGRESS,
                'amount_charged' => $data['amount_charged'] ?? $amount,
                'payment_method' => $data['payment_method'] ?? null,
                'notes' => $data['notes'] ?? null,
                'evolution' => $data['evolution'] ?? null,
                'started_at' => now(),
            ]);

            $sync = [];
            foreach ($services as $service) {
                $sync[$service->id] = ['price' => $service->price, 'duration_minutes' => $service->duration_minutes];
            }
            $attendance->services()->sync($sync);

            if ($appointment) {
                $appointment->update(['status' => Appointment::STATUS_IN_PROGRESS]);
            }

            return $attendance;
        });

        $attendance->load(['appointment', 'client', 'pet', 'services', 'responsibleVeterinarian']);

        return response()->json($this->serializeAttendance($attendance), 201);
    }

    public function show(Attendance $attendance)
    {
        $attendance->load(['appointment', 'client', 'pet', 'services', 'responsibleVeterinarian']);

        return response()->json($this->serializeAttendance($attendance));
    }

    public function update(UpdateAttendanceRequest $request, Attendance $attendance)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $attendance): void {
            if (isset($data['service_ids'])) {
                $services = Service::whereIn('id', array_values(array_unique($data['service_ids'])))->get()->keyBy('id');
                $sync = [];
                foreach ($services as $service) {
                    $sync[$service->id] = ['price' => $service->price, 'duration_minutes' => $service->duration_minutes];
                }
                $attendance->services()->sync($sync);
            }

            if (($data['status'] ?? null) === Attendance::STATUS_COMPLETED
                && $attendance->status !== Attendance::STATUS_COMPLETED) {
                $data['completed_at'] = now();
            }
            $attendance->update($data);

            if ($attendance->appointment && $attendance->status === Attendance::STATUS_COMPLETED) {
                $attendance->appointment->update(['status' => Appointment::STATUS_COMPLETED]);
            }
        });

        $attendance->refresh()->load(['appointment', 'client', 'pet', 'services', 'responsibleVeterinarian']);

        return response()->json($this->serializeAttendance($attendance));
    }

    public function destroy(Attendance $attendance)
    {
        return response()->json([
            'message' => 'Atendimentos são registros permanentes e não podem ser excluídos.',
        ], 409);
    }

    /** @return array<string, mixed> */
    private function serializeAttendance(Attendance $attendance): array
    {
        $data = $attendance->toArray();
        return $data;
    }
}
