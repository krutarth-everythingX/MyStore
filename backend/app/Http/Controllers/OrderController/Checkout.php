<?php

namespace App\Http\Controllers\OrderController;

use App\DTOs\OrderCheckoutData;
use App\Exceptions\ServiceException;
use App\Http\Controllers\Concerns\HasOrderCheckoutRules;
use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Http\Controllers\OrderController\Concerns\InteractsWithResponses;
use App\Services\OrderService\Checkout as CheckoutService;
use Illuminate\Http\Request;

class Checkout extends Controller
{
    use EnsuresRoles;
    use HasOrderCheckoutRules;
    use InteractsWithResponses;

    public function __construct(private readonly CheckoutService $checkoutService)
    {
    }

    public function __invoke(Request $request)
    {
        $this->ensureBuyer($request);

        try {
            $result = $this->checkoutService->handle(
                OrderCheckoutData::fromArray($request->validate($this->checkoutRules())),
                $request->user(),
            );
        } catch (ServiceException $exception) {
            return $this->serviceErrorResponse($request, $exception);
        }

        if ($request->header('X-Inertia')) {
            return back()->with('checkout', [
                'order' => $result['order'],
                'client_secret' => $result['client_secret'],
                'requires_payment_confirmation' => $result['requires_payment_confirmation'],
            ]);
        }

        return response($result, 201);
    }
}
