<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use App\Models\Service;

class StoreAppointmentRequest extends FormRequest
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
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'service_id' => [
                'required',
                'integer',
                Rule::exists('services', 'id')->where('active', true),
            ],
            'scheduled_at' => ['required', 'date'],
            'status' => ['sometimes', Rule::in([Appointment::STATUS_SCHEDULED])],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            if ($this->user()?->role !== \App\Models\User::ROLE_ADMIN
                && AppointmentOverlap::isInPast((string) $this->input('scheduled_at'))) {
                $validator->errors()->add('scheduled_at', 'Agendamentos no passado só podem ser registrados por um administrador.');
                return;
            }

            $service = Service::find($this->input('service_id'));
            if ($service && AppointmentOverlap::exists(
                (int) $this->input('pet_id'),
                (string) $this->input('scheduled_at'),
                (int) $service->duration_minutes,
            )) {
                $validator->errors()->add('scheduled_at', 'Este pet já possui um agendamento nesse período. Escolha outro horário.');
            }
        }];
    }
}
