<?php

namespace App\Http\Controllers\InertiaPageController;

use App\DTOs\OrderCheckoutData;
use App\Exceptions\ServiceException;
use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Concerns\HasOrderCheckoutRules;
use App\Http\Controllers\Controller;
use App\Services\OrderService;
use Illuminate\Http\Request;

class PlaceCheckout extends Controller
{
    use EnsuresRoles;
    use HasOrderCheckoutRules;

    public function __construct(private readonly OrderService $orderService)
    {
    }

    public function __invoke(Request $request)
    {
        $this->ensureBuyer($request);

        try {
            $data = $this->orderService->checkout(
                OrderCheckoutData::fromArray($request->validate($this->checkoutRules())),
                $request->user(),
            );
        } catch (ServiceException $exception) {
            return to_route('checkout')->with('error', $exception->getMessage());
        }

        if (($data['order']['payment_method'] ?? null) === 'COD') {
            return redirect()->route('orders', ['success' => 'true'])
                ->with('success', 'Order placed successfully.');
        }

        return to_route('checkout')->with('checkoutIntent', [
            'order_id' => $data['order']['id'],
            'client_secret' => $data['client_secret'],
        ]);
    }
}
