<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class CreateReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'car_id' => ['required', 'integer', 'exists:cars,id'],
            'pickup_at' => ['required', 'date', 'after:now'],
            'return_at' => ['required', 'date', 'after:pickup_at'],
            'pickup_location' => ['required', 'string', 'max:191'],
            'return_location' => ['nullable', 'string', 'max:191'],
            'flight_number' => ['nullable', 'string', 'max:16'],
            'driving_license_number' => ['nullable', 'string', 'max:64'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'promo_code' => ['nullable', 'string', 'max:32'],
            'extras' => ['nullable', 'array'],
            'extras.*.type' => ['required_with:extras', 'in:gps,child_seat,additional_driver,full_insurance,other'],
            'extras.*.price_per_day' => ['required_with:extras', 'integer', 'min:0'],
            'extras.*.label' => ['nullable', 'string', 'max:100'],
        ];
    }
}
