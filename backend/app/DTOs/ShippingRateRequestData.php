<?php

namespace App\DTOs;

final class ShippingRateRequestData
{
    /**
     * @param OrderItemData[] $items
     */
    public function __construct(
        public readonly array $items,
        public readonly string $shippingAddress,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            items: array_map(
                static fn (array $item): OrderItemData => OrderItemData::fromArray($item),
                $data['items']
            ),
            shippingAddress: $data['shipping_address'],
        );
    }
}
