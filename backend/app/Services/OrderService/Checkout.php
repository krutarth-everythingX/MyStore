<?php

namespace App\Services\OrderService;

use App\Actions\PlaceOrderAction;
use App\DTOs\OrderCheckoutData;
use App\Exceptions\ServiceException;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;

class Checkout
{
    public function __construct(private readonly PlaceOrderAction $placeOrderAction)
    {
    }

    public function handle(OrderCheckoutData $checkoutData, User $buyer): array
    {
        try {
            return $this->placeOrderAction->handle($checkoutData, $buyer);
        } catch (HttpResponseException $exception) {
            $response = $exception->getResponse();
            $payload = method_exists($response, 'getData')
                ? $response->getData(true)
                : [];

            throw new ServiceException(
                $payload['message'] ?? 'Checkout failed.',
                method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 400,
            );
        }
    }
}
