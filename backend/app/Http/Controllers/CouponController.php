<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /**
     * Validate a coupon code.
     */
    public function validateCoupon(Request $request)
    {
        $fields = $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($fields['code']))
            ->first();

        if (!$coupon) {
            return response(['message' => 'Invalid discount code.'], 404);
        }

        if (!$coupon->active) {
            return response(['message' => 'This discount code is no longer active.'], 400);
        }

        if ($coupon->expiry_date && $coupon->expiry_date->isPast()) {
            return response(['message' => 'This discount code has expired.'], 400);
        }

        $subtotal = floatval($fields['subtotal']);
        if ($subtotal < floatval($coupon->min_spend)) {
            return response([
                'message' => "Minimum spend of $" . number_format($coupon->min_spend, 2) . " required to use this code."
            ], 400);
        }

        $discount = $coupon->calculateDiscount($subtotal);

        return response([
            'valid' => true,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount_amount' => round($discount, 2)
        ], 200);
    }
}
