<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;

class ConfirmCheckout extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly OrderService $orderService)
    {
    }

    public function __invoke(Request $request)
    {
        $this->ensureBuyer($request);

        $fields = $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
        ]);

        $order = Order::with(['buyer', 'items.product'])
            ->where('buyer_id', $request->user()->id)
            ->findOrFail($fields['order_id']);

        $this->orderService->confirmOrderPayment($order);

        return redirect()->route('orders', ['success' => 'true'])
            ->with('success', 'Order placed successfully.');
    }
}
