<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'brand' => ['sometimes', 'string', 'max:64'],
            'model' => ['sometimes', 'string', 'max:64'],
            'year' => ['sometimes', 'integer', 'min:1990', 'max:'.(int) date('Y') + 1],
            'category' => ['sometimes', 'in:economy,compact,suv,luxury,van,electric'],
            'transmission' => ['sometimes', 'in:manual,automatic'],
            'fuel' => ['sometimes', 'in:petrol,diesel,hybrid,electric'],
            'seats' => ['sometimes', 'integer', 'min:1', 'max:9'],
            'doors' => ['sometimes', 'integer', 'min:2', 'max:6'],
            'price_per_day' => ['sometimes', 'integer', 'min:0'],
            'weekly_price' => ['nullable', 'integer', 'min:0'],
            'city' => ['sometimes', 'string', 'max:64'],
            'deposit' => ['nullable', 'integer', 'min:0'],
            'mileage_policy' => ['nullable', 'string', 'max:191'],
            'instant_book' => ['nullable', 'boolean'],
            'status' => ['sometimes', 'in:active,draft,maintenance,hidden'],
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
