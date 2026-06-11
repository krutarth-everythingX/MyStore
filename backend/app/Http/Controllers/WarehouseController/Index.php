<?php

namespace App\Http\Controllers\WarehouseController;

use App\Http\Controllers\Controller;
use App\Services\WarehouseService\ListForSeller;
use Illuminate\Http\Request;

class Index extends Controller
{
    public function __construct(private readonly ListForSeller $listForSeller)
    {
    }

    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        return response($this->listForSeller->handle($request->user()->id), 200);
    }
}
