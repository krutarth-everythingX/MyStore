<?php

namespace App\Http\Controllers\OrderController;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService\GenerateInvoiceHtml;
use Illuminate\Http\Request;

class Invoice extends Controller
{
    public function __construct(private readonly GenerateInvoiceHtml $generateInvoiceHtml)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        $order = Order::with(['buyer', 'items.product.user'])->find($id);

        if (! $order) {
            return response(['message' => 'Order not found'], 404);
        }

        return response(
            $this->generateInvoiceHtml->handle($order),
            200,
        )->header('Content-Type', 'text/html');
    }
}
