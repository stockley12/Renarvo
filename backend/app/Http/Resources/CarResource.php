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
