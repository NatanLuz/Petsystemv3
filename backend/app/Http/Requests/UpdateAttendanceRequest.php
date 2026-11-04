<?php

namespace App\Http\Requests;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;
        if ($role === User::ROLE_ADMIN) return true;
        $allowed = $role === User::ROLE_VETERINARIAN
            ? ['notes', 'evolution', 'service_ids', 'status']
            : ['amount_charged', 'payment_method'];
        if ($role === User::ROLE_VETERINARIAN && $this->input('status') === Attendance::STATUS_COMPLETED) {
            $allowed[] = 'completed_at';
        }

        return count(array_diff(array_keys($this->all()), $allowed)) === 0;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'service_ids' => ['sometimes', 'array', 'min:1'],
            'service_ids.*' => ['integer', Rule::exists('services', 'id')->where('active', true)],
            'amount_charged' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'payment_method' => ['sometimes', 'nullable', 'string', 'max:40'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'evolution' => ['sometimes', 'nullable', 'string', 'max:20000'],
            'status' => ['sometimes', 'required', Rule::in([Attendance::STATUS_IN_PROGRESS, Attendance::STATUS_COMPLETED])],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) return;
            /** @var Attendance $attendance */
            $attendance = $this->route('attendance');
            if ($attendance->status === Attendance::STATUS_COMPLETED
                && $this->exists('status')
                && $this->input('status') !== Attendance::STATUS_COMPLETED) {
                $validator->errors()->add('status', 'Um atendimento concluído não pode ser reaberto.');
            }
            if ($this->input('status') === Attendance::STATUS_COMPLETED
                && $attendance->status !== Attendance::STATUS_IN_PROGRESS) {
                $validator->errors()->add('status', 'Somente atendimentos em andamento podem ser concluídos.');
            }
            if ($this->input('status') === Attendance::STATUS_COMPLETED
                && $this->user()?->role === User::ROLE_VETERINARIAN
                && ! trim((string) $this->input('evolution', $attendance->evolution ?? ''))) {
                $validator->errors()->add('evolution', 'Registre a evolução clínica antes de concluir o atendimento.');
            }
        }];
    }
}
