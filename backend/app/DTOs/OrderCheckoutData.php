<?php

namespace App\DTOs;

final class OrderCheckoutData
{
    /**
     * @param OrderItemData[] $items
     */
    public function __construct(
        public readonly array $items,
        public readonly string $shippingAddress,
        public readonly ?string $billingAddress,
        public readonly string $buyerPhone,
        public readonly string $country,
        public readonly string $city,
        public readonly string $state,
        public readonly string $postalCode,
        public readonly ?string $companyName,
        public readonly ?string $buyerGstin,
        public readonly string $paymentMethod,
        public readonly ?string $shippingCarrier,
        public readonly ?string $shippingService,
        public readonly float $shippingCost,
        public readonly float $discountAmount,
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
            billingAddress: $data['billing_address'] ?? null,
            buyerPhone: $data['buyer_phone'],
            country: $data['country'],
            city: $data['city'],
            state: $data['state'],
            postalCode: $data['postal_code'],
            companyName: $data['company_name'] ?? null,
            buyerGstin: $data['buyer_gstin'] ?? null,
            paymentMethod: $data['payment_method'],
            shippingCarrier: $data['shipping_carrier'] ?? null,
            shippingService: $data['shipping_service'] ?? null,
            shippingCost: (float) ($data['shipping_cost'] ?? 0),
            discountAmount: (float) ($data['discount_amount'] ?? 0),
        );
    }
}
