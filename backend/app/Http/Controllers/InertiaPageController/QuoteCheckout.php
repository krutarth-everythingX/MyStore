<?php

namespace App\Http\Controllers\InertiaPageController;

use App\DTOs\ShippingRateRequestData;
use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\OrderService\CalculateShippingRates;
use Illuminate\Http\Request;

class QuoteCheckout extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly CalculateShippingRates $calculateShippingRates)
    {
    }

    public function __invoke(Request $request)
    {
        $this->ensureBuyer($request);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'shipping_address' => 'required|string',
        ]);

        $rates = $this->calculateShippingRates->handle(
            ShippingRateRequestData::fromArray($validated),
        );

        return to_route('checkout')->with('quote', [
            'rates' => $rates,
            'serviceable' => ! empty($rates),
        ]);
    }
}
