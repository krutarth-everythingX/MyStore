<?php

namespace App\Http\Controllers\OrderController;

use App\Exceptions\ServiceException;
use App\Http\Controllers\Controller;
use App\Http\Controllers\OrderController\Concerns\InteractsWithResponses;
use App\Models\Order;
use App\Services\OrderService\CancelOrder;
use Illuminate\Http\Request;

class Cancel extends Controller
{
    use InteractsWithResponses;

    public function __construct(private readonly CancelOrder $cancelOrder)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        $order = Order::with('items.product')->find($id);

        if (! $order) {
            return $this->notFoundResponse($request, 'Order not found.');
        }

        $this->authorize('cancel', $order);

        try {
            $cancelledOrder = $this->cancelOrder->handle($order);
        } catch (ServiceException $exception) {
            return $this->serviceErrorResponse($request, $exception);
        }

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Order cancelled successfully.');
        }

        return response($cancelledOrder, 200);
    }
}
