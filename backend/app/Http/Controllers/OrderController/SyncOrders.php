<?php

namespace App\Http\Controllers\OrderController;

use App\Http\Controllers\Controller;
use App\Services\OrderService\QueueOrdersForSynchronization;
use Illuminate\Http\Request;

class SyncOrders extends Controller
{
    public function __construct(private readonly QueueOrdersForSynchronization $queueOrdersForSynchronization)
    {
    }

    public function __invoke(Request $request)
    {
        $count = $this->queueOrdersForSynchronization->handle();

        return response([
            'message' => "Queued {$count} orders for Shiprocket synchronization.",
        ], 200);
    }
}
