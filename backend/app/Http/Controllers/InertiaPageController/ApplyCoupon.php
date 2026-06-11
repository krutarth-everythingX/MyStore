<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Exceptions\ServiceException;
use App\Http\Controllers\Controller;
use App\Services\CouponService\ValidateCoupon;
use Illuminate\Http\Request;

class ApplyCoupon extends Controller
{
    public function __construct(private readonly ValidateCoupon $validateCoupon)
    {
    }

    public function __invoke(Request $request)
    {
        $fields = $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        try {
            $payload = $this->validateCoupon->handle($fields['code'], (float) $fields['subtotal']);
        } catch (ServiceException $exception) {
            return to_route('cart')->with('error', $exception->getMessage());
        }

        return to_route('cart')->with('couponPayload', $payload);
    }
}
