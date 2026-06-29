<?php

namespace App\Http\Controllers\OrderController;

use App\Exceptions\ServiceException;
use App\Http\Controllers\Controller;
use App\Http\Controllers\OrderController\Concerns\InteractsWithResponses;
use App\Models\Order;
use App\Services\OrderService\RequestReturn as RequestReturnService;
use Illuminate\Http\Request;

class ReturnOrder extends Controller
{
    use InteractsWithResponses;

    public function __construct(private readonly RequestReturnService $requestReturnService)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
            'reason_note' => ['nullable', 'string', 'max:2000'],
            'image_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $order = Order::with('items.product')->find($id);

        if (! $order) {
            return $this->notFoundResponse($request, 'Order not found.');
        }

        $this->authorize('return', $order);

        try {
            $returnedOrder = $this->requestReturnService->handle(
                $order,
                $data['reason'],
                $data['reason_note'] ?? null,
                $data['image_url'] ?? null,
            );
        } catch (ServiceException $exception) {
            return $this->serviceErrorResponse($request, $exception);
        }

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Return request submitted successfully.');
        }

        return response($returnedOrder, 200);
    }
}
