<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'city' => $this->city,
            'description' => $this->description,
            'logo_path' => $this->logo_path,
            'logo_color' => $this->logo_color,
            'phone' => $this->when($request->user()?->role !== 'customer', $this->phone),
            'tax_number' => $this->when($request->user()?->isSuperadmin(), $this->tax_number),
            'address' => $this->address,
            'status' => $this->status,
            'founded_year' => $this->founded_year,
            'commission_rate_bps' => $this->commission_rate_bps,
            'languages_spoken' => $this->languages_spoken,
            'rating_avg' => (float) $this->rating_avg,
            'review_count' => $this->review_count,
            'fleet_size' => $this->fleet_size,
            // Rental policy
            'min_rental_days' => (int) ($this->min_rental_days ?? 1),
            'kilometre_policy' => $this->kilometre_policy ?? 'unlimited',
            'kilometre_limit_per_day_default' => $this->kilometre_limit_per_day_default,
            'min_driver_age_default' => (int) ($this->min_driver_age_default ?? 21),
            'student_friendly' => (bool) ($this->student_friendly ?? false),
            'roadside_24_7' => (bool) ($this->roadside_24_7 ?? false),
            // Public contact / social
            'email_public' => $this->email_public,
            'whatsapp' => $this->whatsapp,
            'instagram' => $this->instagram,
            'facebook' => $this->facebook,
            'website' => $this->website,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
