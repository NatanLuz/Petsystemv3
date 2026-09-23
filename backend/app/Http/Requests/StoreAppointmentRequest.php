<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'status' => ['sometimes', Rule::in(Appointment::STATUSES)],
            'notes' => ['nullable', 'string'],
        ];
    }
}
