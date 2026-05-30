<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:191', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:191'],
            'name' => ['required', 'string', 'max:191'],
            'phone' => ['required', 'string', 'max:32'],
            'otp_code' => ['required', 'string', 'max:8'],
            'locale' => ['nullable', 'in:tr,en,ru,fa'],
        ];
    }
}
