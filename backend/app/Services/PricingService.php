<?php

namespace App\Services;

use App\Models\Car;
use App\Models\InsurancePackage;
use App\Models\LengthDiscount;
use App\Models\PromoCode;
use App\Models\SeasonalPricing;
use App\Support\TenantContext;
use Carbon\CarbonImmutable;

class PricingService
{
    /**
     * Compute a quote in kuruş (smallest unit) for a single car booking.
     *
     * @param  array{type:string,price_per_day:int,label?:string}[]  $extras
     */
    public function quote(
        Car $car,
        CarbonImmutable $pickupAt,
        CarbonImmutable $returnAt,
        array $extras = [],
        ?string $promoCode = null,
        ?InsurancePackage $insurance = null,
    ): array {
        $days = max(1, (int) ceil($pickupAt->diffInHours($returnAt) / 24));

        $base = $car->price_per_day * $days;

        // Seasonal adjustments — pick max applicable adjustment_pct overlap.
        $seasonAdj = TenantContext::ignore(function () use ($car, $pickupAt, $returnAt) {
            return SeasonalPricing::query()
                ->where('company_id', $car->company_id)
                ->where('active', true)
                ->where('start_date', '<=', $returnAt->toDateString())
                ->where('end_date', '>=', $pickupAt->toDateString())
                ->orderByDesc('adjustment_pct')
                ->value('adjustment_pct');
        });

        if ($seasonAdj) {
            $base = (int) round($base * (1 + $seasonAdj / 100));
        }

        // Length-of-rental discount.
        $lengthDiscountPct = TenantContext::ignore(function () use ($car, $days) {
            return LengthDiscount::query()
                ->where('company_id', $car->company_id)
                ->where('min_days', '<=', $days)
                ->orderByDesc('min_days')
                ->value('discount_pct');
        }) ?? 0;

        $extrasTotal = 0;
        foreach ($extras as $extra) {
            $mode = $extra['charge_mode'] ?? 'per_day';
            if ($mode === 'per_rental') {
                $extrasTotal += (int) ($extra['price_per_rental'] ?? $extra['price_per_day'] ?? 0);
            } elseif ($mode === 'free') {
                // free extras add nothing
            } else {
                $extrasTotal += (int) ($extra['price_per_day'] ?? 0) * $days;
            }
        }

        $insurancePrice = 0;
        if ($insurance) {
            $insurancePrice = (int) $insurance->price_per_day * $days;
        }

        $subtotal = $base + $extrasTotal + $insurancePrice;

        $discountAmount = 0;
        if ($lengthDiscountPct > 0) {
            $discountAmount = (int) round($subtotal * $lengthDiscountPct / 100);
        }

        $promoApplied = null;
        if ($promoCode) {
            $promo = TenantContext::ignore(fn () => PromoCode::query()
                ->where('company_id', $car->company_id)
                ->where('code', $promoCode)
                ->where('active', true)
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()->toDateString());
                })
                ->where(function ($q) {
                    $q->whereNull('max_uses')->orWhereColumn('used_count', '<', 'max_uses');
                })
                ->first()
            );

            if ($promo) {
                $promoDiscount = $promo->discount_type === 'percent'
                    ? (int) round($subtotal * $promo->discount_value / 100)
                    : (int) $promo->discount_value;
                $discountAmount += $promoDiscount;
                $promoApplied = $promo->code;
            }
        }

        $discountAmount = min($discountAmount, $subtotal);
        $afterDiscount = $subtotal - $discountAmount;

        $serviceFee = (int) config('services.platform.service_fee_kurus', 12000);
        $kdvBps = (int) config('services.platform.kdv_bps', 1800);
        $taxAmount = (int) round(($afterDiscount + $serviceFee) * $kdvBps / 10000);
        $total = $afterDiscount + $serviceFee + $taxAmount;

        return [
            'days' => $days,
            'base_price' => $base,
            'extras_price' => $extrasTotal,
            'insurance_price' => $insurancePrice,
            'deposit_amount_snapshot' => (int) ($car->deposit ?? 0),
            'discount_amount' => $discountAmount,
            'service_fee' => $serviceFee,
            'tax_amount' => $taxAmount,
            'total_price' => $total,
            'promo_applied' => $promoApplied,
            'season_adjustment_pct' => $seasonAdj,
            'length_discount_pct' => $lengthDiscountPct,
        ];
    }
}
