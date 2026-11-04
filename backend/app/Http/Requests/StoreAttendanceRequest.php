<?php

namespace App\Http\Requests;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;
        if ($role === User::ROLE_ADMIN) return true;
        $allowed = ['appointment_id', 'client_id', 'pet_id', 'service_ids', 'notes'];
        if ($role === User::ROLE_VETERINARIAN) $allowed[] = 'evolution';
        if ($role === User::ROLE_RECEPTIONIST) array_push($allowed, 'amount_charged', 'payment_method');

        return count(array_diff(array_keys($this->all()), $allowed)) === 0;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'appointment_id' => ['sometimes', 'nullable', 'integer', 'exists:appointments,id'],
            'client_id' => ['required_without:appointment_id', 'integer', 'exists:clients,id'],
            'pet_id' => ['required_without:appointment_id', 'integer', 'exists:pets,id'],
            'service_ids' => ['required_without:appointment_id', 'array', 'min:1'],
            'service_ids.*' => ['integer', Rule::exists('services', 'id')->where('active', true)],
            'amount_charged' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'payment_method' => ['sometimes', 'nullable', 'string', 'max:40'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'evolution' => ['sometimes', 'nullable', 'string', 'max:20000'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) return;

            if ($this->filled('appointment_id')) {
                $appointment = $this->route('appointment');
                $appointment = $appointment ?? \App\Models\Appointment::find($this->input('appointment_id'));
                if ($appointment && \App\Models\Attendance::where('appointment_id', $appointment->id)->exists()) {
                    $validator->errors()->add('appointment_id', 'Este agendamento já possui um atendimento iniciado.');
                }
                if ($appointment && $appointment->status !== 'confirmed') {
                    $validator->errors()->add('appointment_id', 'Confirme o agendamento antes de iniciar o atendimento.');
                }
                return;
            }

            $pet = Pet::find($this->input('pet_id'));
            if ($pet && (int) $pet->client_id !== (int) $this->input('client_id')) {
                $validator->errors()->add('pet_id', 'O pet selecionado não pertence ao cliente informado.');
            }
        }];
    }
}
