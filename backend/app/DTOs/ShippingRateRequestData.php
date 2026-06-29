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
        public readonly string $country,
        public readonly string $postalCode,
        public readonly array $allowedChannels = [],
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
            country: $data['country'],
            postalCode: $data['postal_code'],
            allowedChannels: array_values(array_filter($data['allowed_channels'] ?? [])),
        );
    }
}
