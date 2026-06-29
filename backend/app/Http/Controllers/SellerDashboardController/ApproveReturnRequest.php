<?php

namespace App\Http\Controllers\SellerDashboardController;

use App\Http\Controllers\Controller;
use App\Services\OrderService\ReturnOrder;
use App\Services\SellerDashboardService\FindOrderForSeller;
use Illuminate\Http\Request;

class ApproveReturnRequest extends Controller
{
    public function __construct(
        private readonly FindOrderForSeller $findOrderForSeller,
        private readonly ReturnOrder $returnOrder,
    ) {
    }

    public function __invoke(Request $request, int $id)
    {
        $sellerId = $request->user()->id;

        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $order = $this->findOrderForSeller->handle($sellerId, $id);

        if (! $order) {
            return response(['message' => 'Order not found for your products'], 404);
        }

        $updatedOrder = $this->returnOrder->handle(
            $order,
            $request->validate([
                'review_note' => ['nullable', 'string', 'max:2000'],
            ])['review_note'] ?? null,
        );

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Return request approved and refund processed.');
        }

        return response([
            'message' => 'Return request approved and refund processed.',
            'order' => $updatedOrder,
        ], 200);
    }
}
