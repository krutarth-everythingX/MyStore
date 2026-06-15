<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case OutForDelivery = 'out_for_delivery';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public static function values(): array
    {
        return array_map(
            static fn (self $status) => $status->value,
            self::cases()
        );
    }

    public static function cancellableValues(): array
    {
        return [
            self::Pending->value,
            self::Processing->value,
        ];
    }

    public static function reviewEligibleValues(): array
    {
        return [
            self::Processing->value,
            self::Shipped->value,
            self::OutForDelivery->value,
            self::Completed->value,
        ];
    }
}
