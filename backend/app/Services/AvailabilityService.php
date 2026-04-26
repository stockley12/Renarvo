<?php

namespace App\Services;

use App\Models\Car;
use App\Models\Reservation;
use Carbon\CarbonImmutable;

class AvailabilityService
{
    public function isCarAvailable(Car $car, CarbonImmutable $pickupAt, CarbonImmutable $returnAt, ?int $ignoreReservationId = null): bool
    {
        if ($car->status !== Car::STATUS_ACTIVE) {
            return false;
        }

        $query = Reservation::query()
            ->where('car_id', $car->id)
            ->whereIn('status', ['pending', 'confirmed', 'active'])
            ->where(function ($q) use ($pickupAt, $returnAt) {
                $q->where(function ($qq) use ($pickupAt, $returnAt) {
                    $qq->where('pickup_at', '<', $returnAt)
                        ->where('return_at', '>', $pickupAt);
                });
            });

        if ($ignoreReservationId) {
            $query->where('id', '!=', $ignoreReservationId);
        }

        return ! $query->exists();
    }
}
