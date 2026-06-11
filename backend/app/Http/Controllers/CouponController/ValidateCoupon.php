<?php

namespace App\Http\Controllers\CouponController;

use App\Exceptions\ServiceException;
use App\Http\Controllers\Controller;
use App\Services\CouponService\ValidateCoupon as ValidateCouponService;
use Illuminate\Http\Request;

class ValidateCoupon extends Controller
{
    public function __construct(private readonly ValidateCouponService $validateCouponService)
    {
    }

    public function __invoke(Request $request)
    {
        $fields = $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        try {
            $payload = $this->validateCouponService->handle($fields['code'], (float) $fields['subtotal']);
        } catch (ServiceException $exception) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', $exception->getMessage());
            }

            return response(['message' => $exception->getMessage()], $exception->statusCode());
        }

        if ($request->header('X-Inertia')) {
            return back()->with('coupon', $payload);
        }

        return response($payload, 200);
    }
}
