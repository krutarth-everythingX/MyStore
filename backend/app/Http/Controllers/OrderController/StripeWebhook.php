<?php

namespace App\Http\Controllers\OrderController;

use App\Exceptions\ServiceException;
use App\Http\Controllers\Controller;
use App\Services\OrderService\HandleStripeWebhook;
use Illuminate\Http\Request;

class StripeWebhook extends Controller
{
    public function __construct(private readonly HandleStripeWebhook $handleStripeWebhook)
    {
    }

    public function __invoke(Request $request)
    {
        try {
            $this->handleStripeWebhook->handle(
                $request->getContent(),
                $request->header('Stripe-Signature'),
            );
        } catch (ServiceException $exception) {
            return response(['message' => $exception->getMessage()], $exception->statusCode());
        }

        return response(['status' => 'success'], 200);
    }
}
