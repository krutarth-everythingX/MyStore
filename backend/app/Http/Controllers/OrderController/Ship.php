<?php

namespace App\Http\Controllers\OrderController;

use App\Exceptions\ServiceException;
use App\Http\Controllers\Controller;
use App\Http\Controllers\OrderController\Concerns\InteractsWithResponses;
use App\Models\Order;
use App\Services\OrderService\ShipOrder;
use Illuminate\Http\Request;

class Ship extends Controller
{
    use InteractsWithResponses;

    public function __construct(private readonly ShipOrder $shipOrder)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        $order = Order::with(['buyer', 'items.product'])->find($id);

        if (! $order) {
            return $this->notFoundResponse($request, 'Order not found');
        }

        $this->authorize('ship', $order);

        try {
            $shippedOrder = $this->shipOrder->handle($order, $request->user());
        } catch (ServiceException $exception) {
            return $this->serviceErrorResponse($request, $exception);
        }

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Order successfully shipped via Shiprocket!');
        }

        return response([
            'message' => 'Order successfully shipped via Shiprocket!',
            'order' => $shippedOrder,
        ], 200);
    }
}
