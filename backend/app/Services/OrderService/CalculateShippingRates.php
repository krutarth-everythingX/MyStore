<?php

namespace App\Services\OrderService;

use App\DTOs\ShippableItemData;
use App\DTOs\ShippingRateRequestData;
use App\Models\Product;
use App\Services\ShippingService\CalculateRates as CalculateShippingRatesService;

class CalculateShippingRates
{
    public function __construct(private readonly CalculateShippingRatesService $calculateRatesService)
    {
    }

    public function handle(ShippingRateRequestData $shippingRateRequest): array
    {
        $itemsWithProducts = array_map(function ($itemData) {
            return new ShippableItemData(
                product: Product::findOrFail($itemData->productId),
                quantity: $itemData->quantity,
            );
        }, $shippingRateRequest->items);

        return $this->calculateRatesService->handle($itemsWithProducts, $shippingRateRequest->shippingAddress);
    }
}
