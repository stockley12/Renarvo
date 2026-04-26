<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->name,
            'phone' => $this->phone,
            'role' => $this->role,
            'avatar_path' => $this->avatar_path,
            'locale' => $this->locale,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'status' => $this->status,
            'company_id' => $this->whenLoaded('ownedCompany', fn () => $this->ownedCompany?->id)
                ?? $this->whenLoaded('staffCompany', fn () => $this->staffCompany?->company_id),
        ];
    }
}
