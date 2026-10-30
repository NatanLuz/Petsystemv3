<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePetRequest extends FormRequest
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
            'client_id' => ['sometimes', 'required', 'integer', 'exists:clients,id'],
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'species' => ['sometimes', 'required', 'string', 'max:50'],
            'breed' => ['sometimes', 'nullable', 'string', 'max:100'],
            'sex' => ['sometimes', 'nullable', 'string', 'max:20'],
            'birth_date' => ['sometimes', 'nullable', 'date', 'before_or_equal:today'],
            'weight' => ['sometimes', 'nullable', 'numeric', 'gt:0', 'max:9999.999'],
            'size' => ['sometimes', 'nullable', 'string', 'max:30'],
            'color' => ['sometimes', 'nullable', 'string', 'max:100'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'allergies' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'behavior_alerts' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
