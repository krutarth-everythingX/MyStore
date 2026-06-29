<?php

namespace App\Http\Controllers\OrderController;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService\GenerateShippingSlipHtml;
use Illuminate\Http\Request;

class ShippingSlip extends Controller
{
    public function __construct(private readonly GenerateShippingSlipHtml $generateShippingSlipHtml)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        $order = Order::with(['buyer', 'items.product.user'])->find($id);

        if (! $order) {
            return response(['message' => 'Order not found'], 404);
        }

        $user = $request->user();
        $belongsToBuyer = $user && (int) $order->buyer_id === (int) $user->id;
        $belongsToSeller = $user
            && $user->role === 'seller'
            && $order->items->contains(fn ($item) => (int) ($item->product?->user_id ?? 0) === (int) $user->id);

        abort_unless($belongsToBuyer || $belongsToSeller, 403);

        return response(
            $this->generateShippingSlipHtml->handle($order),
            200,
        )->header('Content-Type', 'text/html');
    }
}
