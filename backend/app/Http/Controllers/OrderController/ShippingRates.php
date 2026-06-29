<?php

namespace App\Http\Controllers\OrderController;

use App\DTOs\ShippingRateRequestData;
use App\Http\Controllers\Controller;
use App\Services\OrderService\CalculateShippingRates;
use Illuminate\Http\Request;

class ShippingRates extends Controller
{
    public function __construct(private readonly CalculateShippingRates $calculateShippingRates)
    {
    }

    public function __invoke(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'shipping_address' => 'required|string',
            'country' => 'required|string|max:120',
            'postal_code' => 'required|string|max:20',
            'allowed_channels' => 'nullable|array',
            'allowed_channels.*' => 'nullable|string|max:120',
        ]);

        $rates = $this->calculateShippingRates->handle(
            ShippingRateRequestData::fromArray($validated),
        );

        if ($request->header('X-Inertia')) {
            return back()->with('shipping_rates', $rates);
        }

        return response(['rates' => $rates], 200);
    }
}
