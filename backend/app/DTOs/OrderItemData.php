<?php

namespace App\DTOs;

final class OrderItemData
{
    public function __construct(
        public readonly int $productId,
        public readonly int $quantity,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            productId: (int) $data['product_id'],
            quantity: (int) $data['quantity'],
        );
    }
}
