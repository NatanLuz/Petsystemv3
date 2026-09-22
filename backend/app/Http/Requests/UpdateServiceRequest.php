<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'decimal:0,2', 'min:0', 'max:99999999.99'],
            'duration_minutes' => ['sometimes', 'required', 'integer', 'min:1', 'max:2147483647'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
