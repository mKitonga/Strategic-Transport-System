<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roles = array_keys(config('transport.roles', []));
        $role = (string) $this->input('role');
        $definition = config('transport.roles.'.$role, []);
        $profileRules = [];

        foreach (array_keys($definition['registration_fields'] ?? []) as $field) {
            $profileRules['profile_data.'.$field] = $this->profileFieldRules($field);
        }

        return array_merge([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^(\+254|0)[17]\d{8}$/'],
            'email' => ['required', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'regex:/[a-z]/', 'regex:/[0-9]/', 'confirmed'],
            'role' => ['required', Rule::in($roles)],
            'profile_data' => ['nullable', 'array'],
        ], $profileRules);
    }

    public function messages(): array
    {
        return [
            'role.in' => 'Please choose a supported transport user role.',
            'phone.regex' => 'Phone number must be in Kenyan format: +2547..., +2541..., 07..., or 01....',
            'profile_data.number_plate.regex' => 'Number plate must follow a Kenyan vehicle format such as KCA123A or KCA 123A.',
        ];
    }

    private function profileFieldRules(string $field): array
    {
        return match ($field) {
            'bus_capacity' => ['required', 'integer', 'min:1'],
            'number_plate' => ['required', 'string', 'regex:/^K[A-Z]{2}\s?\d{3}[A-Z]$/'],
            default => ['required', 'string', 'max:255'],
        };
    }
}
