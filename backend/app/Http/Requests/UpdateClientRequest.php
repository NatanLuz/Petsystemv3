<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
{
    
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $normalized = [];
        if ($this->exists('phone')) {
            $phone = $this->input('phone');
            $normalized['phone'] = is_string($phone) ? preg_replace('/\D+/', '', $phone) : $phone;
        }
        if ($this->exists('email')) {
            $email = $this->input('email');
            $normalized['email'] = is_string($email) ? strtolower(trim($email)) : $email;
        }
        $this->merge($normalized);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'nullable', 'email', 'max:150', Rule::unique('clients', 'email')->ignore($this->route('client'))],
            'phone' => ['sometimes', 'required', 'string', 'max:20', Rule::unique('clients', 'phone')->ignore($this->route('client'))],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
