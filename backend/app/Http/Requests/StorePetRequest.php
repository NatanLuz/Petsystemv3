<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePetRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'name' => ['required', 'string', 'max:100'],
            'species' => ['required', 'string', 'max:50'],
            'breed' => ['nullable', 'string', 'max:100'],
            'sex' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date', 'before_or_equal:today'],
            'weight' => ['nullable', 'numeric', 'gt:0', 'max:9999.999'],
            'size' => ['nullable', 'string', 'max:30'],
            'color' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'allergies' => ['nullable', 'string', 'max:5000'],
            'behavior_alerts' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
