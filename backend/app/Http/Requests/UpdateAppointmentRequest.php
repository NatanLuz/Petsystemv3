<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        ];
    }
}
