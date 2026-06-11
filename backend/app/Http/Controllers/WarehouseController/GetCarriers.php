<?php

namespace App\Http\Controllers\WarehouseController;

use App\Http\Controllers\Controller;
use App\Services\WarehouseService\GetAvailableCarriers;

class GetCarriers extends Controller
{
    public function __construct(private readonly GetAvailableCarriers $getAvailableCarriers)
    {
    }

    public function __invoke()
    {
        return response([
            'carriers' => $this->getAvailableCarriers->handle(),
        ], 200);
    }
}
