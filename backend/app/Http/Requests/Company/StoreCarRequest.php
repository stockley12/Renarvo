<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class StoreCarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'brand' => ['required', 'string', 'max:64'],
            'model' => ['required', 'string', 'max:64'],
            'year' => ['required', 'integer', 'min:1990', 'max:'.(int) date('Y') + 1],
            'category' => ['required', 'in:economy,compact,suv,luxury,van,electric'],
            'transmission' => ['required', 'in:manual,automatic'],
            'fuel' => ['required', 'in:petrol,diesel,hybrid,electric'],
            'seats' => ['required', 'integer', 'min:1', 'max:9'],
            'doors' => ['required', 'integer', 'min:2', 'max:6'],
            'price_per_day' => ['required', 'integer', 'min:0', 'max:100000000'],
            'weekly_price' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'city' => ['required', 'string', 'max:64'],
            'deposit' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'mileage_policy' => ['nullable', 'string', 'max:191'],
            'instant_book' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:active,draft,maintenance,hidden'],
            'plate' => ['nullable', 'string', 'max:24'],
            'vin' => ['nullable', 'string', 'max:17'],
            'description' => ['nullable', 'string', 'max:5000'],
            'min_driver_age' => ['nullable', 'integer', 'min:18', 'max:99'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:64'],
            'image_seed' => ['nullable', 'string', 'max:64'],
        ];
    }
}
