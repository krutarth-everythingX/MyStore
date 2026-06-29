<?php

namespace App\Services\CouponService;

use App\Exceptions\ServiceException;
use App\Models\Coupon;

class ValidateCoupon
{
    public function handle(string $code, float $subtotal): array
    {
        $coupon = Coupon::where('code', strtoupper($code))->first();
        $defaultCountry = config('localization.default_country', 'India');

        if (! $coupon) {
            throw ServiceException::notFound('Invalid discount code.');
        }

        if (! $coupon->active) {
            throw ServiceException::badRequest('This discount code is no longer active.');
        }

        if ($coupon->expiry_date && $coupon->expiry_date->isPast()) {
            throw ServiceException::badRequest('This discount code has expired.');
        }

        if ($subtotal < (float) $coupon->min_spend) {
            throw ServiceException::badRequest(
                'Minimum spend of ' . format_money((float) $coupon->min_spend, currency_for_country($defaultCountry), locale_for_country($defaultCountry)) . ' required to use this code.',
            );
        }

        return [
            'valid' => true,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount_amount' => round($coupon->calculateDiscount($subtotal), 2),
        ];
    }
}
