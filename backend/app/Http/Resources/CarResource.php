<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'company' => $this->whenLoaded('company', fn () => [
                'id' => $this->company->id,
                'slug' => $this->company->slug,
                'name' => $this->company->name,
                'rating_avg' => (float) $this->company->rating_avg,
                'roadside_24_7' => (bool) ($this->company->roadside_24_7 ?? false),
                'student_friendly' => (bool) ($this->company->student_friendly ?? false),
                'min_rental_days' => (int) ($this->company->min_rental_days ?? 1),
                'kilometre_policy' => $this->company->kilometre_policy ?? 'unlimited',
                'kilometre_limit_per_day_default' => $this->company->kilometre_limit_per_day_default,
                'min_driver_age_default' => (int) ($this->company->min_driver_age_default ?? 21),
                'whatsapp' => $this->company->whatsapp,
                'instagram' => $this->company->instagram,
                'facebook' => $this->company->facebook,
                'website' => $this->company->website,
                'email_public' => $this->company->email_public,
            ]),
            'brand' => $this->brand,
            'model' => $this->model,
            'name' => $this->brand.' '.$this->model,
            'year' => $this->year,
            'category' => $this->category,
            'transmission' => $this->transmission,
            'fuel' => $this->fuel,
            'seats' => $this->seats,
            'doors' => $this->doors,
            'price_per_day' => $this->price_per_day,
            'weekly_price' => $this->weekly_price,
            'city' => $this->city,
            'deposit' => $this->deposit,
            'mileage_policy' => $this->mileage_policy,
            'instant_book' => (bool) $this->instant_book,
            'status' => $this->status,
            'plate' => $this->when(! is_null($request->user()), $this->plate),
            'description' => $this->description,
            'min_driver_age' => $this->min_driver_age,
            'min_driver_age_override' => $this->min_driver_age_override,
            'engine_power_hp' => $this->engine_power_hp,
            'engine_cc' => $this->engine_cc,
            'has_ac' => (bool) ($this->has_ac ?? true),
            'kilometre_limit_per_day' => $this->kilometre_limit_per_day,
            'rating_avg' => (float) $this->rating_avg,
            'review_count' => $this->review_count,
            'image_seed' => $this->image_seed,
            'features' => $this->whenLoaded('features', fn () => $this->features->pluck('feature')->all(), []),
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($i) => [
                'id' => $i->id,
                'path' => $i->path,
                'position' => $i->position,
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
