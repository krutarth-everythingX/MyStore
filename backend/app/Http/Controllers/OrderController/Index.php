<?php

namespace App\Http\Controllers\OrderController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\OrderService\ListBuyerOrders;
use Illuminate\Http\Request;

class Index extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly ListBuyerOrders $listBuyerOrders)
    {
    }

    public function __invoke(Request $request)
    {
        $this->ensureBuyer($request);

        return response($this->listBuyerOrders->handle($request->user()->id), 200);
    }
}
