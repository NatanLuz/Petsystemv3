<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Pet;
use App\Models\Service;
use App\Http\Requests\AppointmentOverlap;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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
        $appointment = DB::transaction(function () use ($validated): Appointment {
            $this->lockPets([(int) $validated['pet_id']]);
            $service = Service::findOrFail($validated['service_id']);
            if (AppointmentOverlap::exists((int) $validated['pet_id'], (string) $validated['scheduled_at'], (int) $service->duration_minutes)) {
                throw ValidationException::withMessages(['scheduled_at' => 'Este pet já possui um agendamento nesse período. Escolha outro horário.']);
            }
            return Appointment::create(array_merge($validated, [
                'price' => $service->price,
                'duration_minutes' => $service->duration_minutes,
                'status' => $validated['status'] ?? Appointment::STATUS_SCHEDULED,
            ]));
        }, 3);

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

        DB::transaction(function () use ($appointment, $validated): void {
            $lockedAppointment = Appointment::query()->lockForUpdate()->findOrFail($appointment->id);
            $petId = (int) ($validated['pet_id'] ?? $lockedAppointment->pet_id);
            $this->lockPets([(int) $lockedAppointment->pet_id, $petId]);
            $scheduledAt = (string) ($validated['scheduled_at'] ?? $lockedAppointment->getRawOriginal('scheduled_at'));
            $duration = (int) ($validated['duration_minutes'] ?? $lockedAppointment->duration_minutes);
            $status = (string) ($validated['status'] ?? $lockedAppointment->status);

            if (in_array($status, [Appointment::STATUS_SCHEDULED, Appointment::STATUS_CONFIRMED], true)
                && AppointmentOverlap::exists($petId, $scheduledAt, $duration, (int) $lockedAppointment->id)) {
                throw ValidationException::withMessages([
                    'scheduled_at' => 'Este pet já possui um agendamento nesse período. Escolha outro horário.',
                ]);
            }

            $lockedAppointment->update($validated);
        }, 3);
        $appointment->refresh();
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

    /** @param array<int> $petIds */
    private function lockPets(array $petIds): void
    {
        Pet::query()
            ->whereIn('id', array_values(array_unique($petIds)))
            ->orderBy('id')
            ->lockForUpdate()
            ->get(['id']);
    }
}
