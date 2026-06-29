<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\OrderService\ListBuyerOrders;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BuyerOrderDetails extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly ListBuyerOrders $listBuyerOrders)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        $this->ensureBuyer($request);

        $orders = $this->listBuyerOrders->handle($request->user()->id);
        $order = $orders->firstWhere('id', $id);

        abort_unless($order, 404);

        return Inertia::render('App', [
            'buyerOrders' => $orders,
            'buyerOrder' => $order,
        ]);
    }
}
