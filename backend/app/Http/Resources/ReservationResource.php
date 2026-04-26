<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'car_id' => $this->car_id,
            'company_id' => $this->company_id,
            'customer_id' => $this->customer_id,
            'pickup_at' => $this->pickup_at?->toIso8601String(),
            'return_at' => $this->return_at?->toIso8601String(),
            'actual_return_at' => $this->actual_return_at?->toIso8601String(),
            'pickup_location' => $this->pickup_location,
            'return_location' => $this->return_location,
            'days' => $this->days,
            'price' => [
                'base' => $this->base_price,
                'extras' => $this->extras_price,
                'discount' => $this->discount_amount,
                'service_fee' => $this->service_fee,
                'tax' => $this->tax_amount,
                'total' => $this->total_price,
                'currency' => $this->currency_snapshot,
            ],
            'status' => $this->status,
            'promo_code' => $this->promo_code,
            'flight_number' => $this->flight_number,
            'notes' => $this->notes,
            'cancellation_reason' => $this->cancellation_reason,
            'extras' => $this->whenLoaded('extras', fn () => $this->extras->map(fn ($e) => [
                'type' => $e->type,
                'label' => $e->label,
                'price_per_day' => $e->price_per_day,
            ])),
            'car' => $this->whenLoaded('car', fn () => [
                'id' => $this->car->id,
                'brand' => $this->car->brand,
                'model' => $this->car->model,
                'image_seed' => $this->car->image_seed,
            ]),
            'company' => $this->whenLoaded('company', fn () => [
                'id' => $this->company->id,
                'name' => $this->company->name,
                'slug' => $this->company->slug,
                'phone' => $this->company->phone,
            ]),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
                'phone' => $this->customer->phone,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
