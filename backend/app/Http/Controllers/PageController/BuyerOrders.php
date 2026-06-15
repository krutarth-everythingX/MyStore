<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\OrderService\ListBuyerOrders;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BuyerOrders extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly ListBuyerOrders $listBuyerOrders)
    {
    }

    public function __invoke(Request $request)
    {
        $this->ensureBuyer($request);

        return Inertia::render('App', [
            'buyerOrders' => $this->listBuyerOrders->handle($request->user()->id),
        ]);
    }
}
