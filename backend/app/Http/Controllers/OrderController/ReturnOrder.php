<?php

namespace App\Http\Controllers\OrderController;

use App\Exceptions\ServiceException;
use App\Http\Controllers\Controller;
use App\Http\Controllers\OrderController\Concerns\InteractsWithResponses;
use App\Models\Order;
use App\Services\OrderService\ReturnOrder as ReturnOrderService;
use Illuminate\Http\Request;

class ReturnOrder extends Controller
{
    use InteractsWithResponses;

    public function __construct(private readonly ReturnOrderService $returnOrderService)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        $order = Order::with('items.product')->find($id);

        if (! $order) {
            return $this->notFoundResponse($request, 'Order not found.');
        }

        $this->authorize('return', $order);

        try {
            $returnedOrder = $this->returnOrderService->handle($order);
        } catch (ServiceException $exception) {
            return $this->serviceErrorResponse($request, $exception);
        }

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Return and refund processed successfully.');
        }

        return response($returnedOrder, 200);
    }
}
