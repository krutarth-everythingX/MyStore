<?php

namespace App\Http\Controllers\SellerDashboardController;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Services\SellerDashboardService\FindOrderForSeller;
use App\Services\SellerDashboardService\UpdateOrderStatus as UpdateOrderStatusService;
use Illuminate\Http\Request;

class UpdateOrderStatus extends Controller
{
    public function __construct(
        private readonly FindOrderForSeller $findOrderForSeller,
        private readonly UpdateOrderStatusService $updateOrderStatusService,
    ) {
    }

    public function __invoke(Request $request, int $id)
    {
        $sellerId = $request->user()->id;

        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $order = $this->findOrderForSeller->handle($sellerId, $id);

        if (! $order) {
            return response(['message' => 'Order not found for your products'], 404);
        }

        $updatedOrder = $this->updateOrderStatusService->handle(
            $order,
            $request->validate([
                'status' => 'required|string|in:' . implode(',', OrderStatus::values()),
                'shipping_carrier' => 'nullable|string',
                'tracking_number' => 'nullable|string',
            ]),
            $sellerId,
        );

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Order updated successfully');
        }

        return response([
            'message' => 'Order updated successfully',
            'order' => $updatedOrder,
        ], 200);
    }
}
