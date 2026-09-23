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
        return response()->json(Appointment::with(['pet.client', 'service'])->get());
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

        return response()->json($appointment, 201);
    }

    public function show(Appointment $appointment)
    {
        $appointment->load(['pet.client', 'service']);

        return response()->json($appointment);
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

        return response()->json($appointment);
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();

        return response()->noContent();
    }
}
