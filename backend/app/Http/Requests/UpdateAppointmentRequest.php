<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use App\Models\Service;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'pet_id' => ['sometimes', 'required', 'integer', 'exists:pets,id'],
            'service_id' => ['sometimes', 'required', 'integer', 'exists:services,id'],
            'scheduled_at' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', 'required', Rule::in(Appointment::STATUSES)],
            'notes' => ['sometimes', 'nullable', 'string'],
            'cancellation_reason' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'reschedule_reason' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var Appointment $appointment */
            $appointment = $this->route('appointment');
            $nextStatus = (string) $this->input('status', $appointment->status);
            if (! $this->isAllowedTransition($appointment->status, $nextStatus)) {
                $validator->errors()->add('status', 'A transição de status solicitada não é permitida.');
                return;
            }
            if ($nextStatus === Appointment::STATUS_CANCELLED
                && $appointment->status !== Appointment::STATUS_CANCELLED
                && ! trim((string) $this->input('cancellation_reason', ''))) {
                $validator->errors()->add('cancellation_reason', 'Informe o motivo do cancelamento.');
            }
            if ($nextStatus === Appointment::STATUS_NO_SHOW
                && $appointment->status !== Appointment::STATUS_NO_SHOW
                && ! trim((string) $this->input('cancellation_reason', ''))) {
                $validator->errors()->add('cancellation_reason', 'Informe o motivo do registro de falta.');
            }
            $petId = (int) $this->input('pet_id', $appointment->pet_id);
            $serviceId = (int) $this->input('service_id', $appointment->service_id);
            $scheduledAt = (string) $this->input('scheduled_at', $appointment->getRawOriginal('scheduled_at'));
            if ($this->exists('scheduled_at')
                && $scheduledAt !== $appointment->getRawOriginal('scheduled_at')
                && ! trim((string) $this->input('reschedule_reason', ''))) {
                $validator->errors()->add('reschedule_reason', 'Informe o motivo do reagendamento.');
            }
            if ($this->exists('scheduled_at')
                && $this->user()?->role !== \App\Models\User::ROLE_ADMIN
                && AppointmentOverlap::isInPast($scheduledAt)) {
                $validator->errors()->add('scheduled_at', 'Agendamentos no passado só podem ser registrados por um administrador.');
                return;
            }
            $service = Service::find($serviceId);

            $duration = $serviceId === (int) $appointment->service_id
                ? (int) $appointment->duration_minutes
                : (int) $service?->duration_minutes;
            if ($service && in_array($nextStatus, [Appointment::STATUS_SCHEDULED, Appointment::STATUS_CONFIRMED], true)
                && AppointmentOverlap::exists(
                $petId,
                $scheduledAt,
                $duration,
                (int) $appointment->id,
            )) {
                $validator->errors()->add('scheduled_at', 'Este pet já possui um agendamento nesse período. Escolha outro horário.');
            }
        }];
    }

    private function isAllowedTransition(string $current, string $next): bool
    {
        if ($current === $next) return true;
        if (in_array($current, [Appointment::STATUS_COMPLETED, Appointment::STATUS_CANCELLED, Appointment::STATUS_NO_SHOW], true)) return false;
        if (in_array($next, [Appointment::STATUS_IN_PROGRESS, Appointment::STATUS_COMPLETED], true)) return false;
        if ($next === Appointment::STATUS_CANCELLED) return true;

        return match ($current) {
            Appointment::STATUS_SCHEDULED => $next === Appointment::STATUS_CONFIRMED,
            Appointment::STATUS_CONFIRMED => $next === Appointment::STATUS_NO_SHOW,
            Appointment::STATUS_IN_PROGRESS => false,
            default => false,
        };
    }
}
