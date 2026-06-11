<?php

namespace App\Http\Controllers\Concerns;

use App\Rules\IndianPostalCode;

trait HasOrderCheckoutRules
{
    protected function checkoutRules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'shipping_address' => 'required|string',
            'billing_address' => 'nullable|string',
            'buyer_phone' => 'required|string',
            'country' => 'required|string',
            'city' => 'required|string',
            'state' => 'required|string',
            'postal_code' => ['required', 'string', new IndianPostalCode()],
            'company_name' => 'nullable|string',
            'buyer_gstin' => 'nullable|string|max:15',
            'payment_method' => 'required|string',
            'shipping_carrier' => 'nullable|string',
            'shipping_service' => 'nullable|string',
            'shipping_cost' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
        ];
    }
}
