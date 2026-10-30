<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Service;

class AppointmentController extends Controller
{
    public function index()
    {
        $appointments = Appointment::with(['pet.client', 'service'])->get();

        return response()->json($appointments->map(
            fn (Appointment $appointment) => $this->serializeAppointment($appointment),
        ));
    }

    public function store(StoreAppointmentRequest $request)
    {
        $validated = $request->validated();
        $service = Service::findOrFail($validated['service_id']);

        $appointment = Appointment::create(array_merge($validated, [
            'price' => $service->price,
            'duration_minutes' => $service->duration_minutes,
            'status' => $validated['status'] ?? Appointment::STATUS_SCHEDULED,
        ]));

        $appointment->load(['pet.client', 'service']);

        return response()->json($this->serializeAppointment($appointment), 201);
    }

    public function show(Appointment $appointment)
    {
        $appointment->load(['pet.client', 'service']);

        return response()->json($this->serializeAppointment($appointment));
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment)
    {
        $validated = $request->validated();

        if (
            array_key_exists('service_id', $validated)
            && (int) $validated['service_id'] !== (int) $appointment->service_id
        ) {
            $service = Service::findOrFail($validated['service_id']);

            if (! $service->active) {
                return response()->json([
                    'message' => 'O serviço selecionado está inativo.',
                    'errors' => [
                        'service_id' => ['O serviço selecionado está inativo.'],
                    ],
                ], 422);
            }

            $validated['price'] = $service->price;
            $validated['duration_minutes'] = $service->duration_minutes;
        }

        $appointment->update($validated);
        $appointment->load(['pet.client', 'service']);

        return response()->json($this->serializeAppointment($appointment));
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();

        return response()->noContent();
    }

    /**
     * Keep scheduled_at as the clinic's timezone-free operational wall time.
     * Other model timestamps retain Laravel's standard UTC JSON serialization.
     *
     * @return array<string, mixed>
     */
    private function serializeAppointment(Appointment $appointment): array
    {
        $data = $appointment->toArray();
        $data['scheduled_at'] = $appointment->getRawOriginal('scheduled_at');

        return $data;
    }
}
