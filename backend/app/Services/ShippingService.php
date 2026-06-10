<?php

namespace App\Services;

use App\DTOs\ShippableItemData;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShippingService
{
    /**
     * Calculate shipping rates based on items weight, dimensions and destination.
     *
     * @param ShippableItemData[] $items
     * @param string $address Destination address or ZIP code.
     * @return array Array of available shipping options with rates.
     */
    public function calculateRates(array $items, string $address): array
    {
        // 1. Calculate total weight
        $totalWeight = 0; 
        foreach ($items as $item) {
            $weight = $item->product->weight_kg ?? $item->product->weight ?? 0.5; // default 0.5
            $qty = $item->quantity;
            $totalWeight += floatval($weight) * $qty;
        }

        // 2. Extract postal code/ZIP code for distance approximations
        $zipCode = $this->extractZipCode($address);

        // If it's a 6-digit Indian Pin code, route via ShiprocketService
        if (strlen($zipCode) === 6) {
            $shiprocket = new ShiprocketService();
            $pickup = '380001'; // Default pickup from Ahmedabad
            
            // Try to find the seller's pickup zip code
            if (!empty($items)) {
                $productOwner = null;
                $itemProduct = $items[0]->product ?? null;
                $productOwner = $itemProduct?->user;
                if ($productOwner) {
                    if (isset($productOwner->postal_code) && $productOwner->postal_code) {
                        $pickup = $productOwner->postal_code;
                    } else if ($productOwner->address) {
                        $pickup = $this->extractZipCode($productOwner->address) ?: '380001';
                    }
                }
            }

            $token = null;
            if (isset($productOwner) && $productOwner && $productOwner->shiprocket_email && $productOwner->shiprocket_password) {
                $token = $shiprocket->authenticate($productOwner->shiprocket_email, $productOwner->shiprocket_password);
            }

            $res = $shiprocket->checkServiceability($pickup, $zipCode, $totalWeight, 1, $token);
            return $res['rates'];
        }

        // 3. Check if EasyPost API key is set
        $apiKey = config('services.easypost.api_key') ?: env('EASYPOST_API_KEY');

        if ($apiKey) {
            try {
                return $this->fetchEasyPostRates($apiKey, $totalWeight, $zipCode, $address);
            } catch (\Exception $e) {
                Log::error("EasyPost Shipping API failed: " . $e->getMessage() . ". Falling back to local calculator.");
            }
        }

        // 4. Local fallback weight/distance-based shipping calculator
        return $this->calculateFallbackRates($totalWeight, $zipCode);
    }

    /**
     * Fetch real rates from EasyPost API using basic HTTP requests.
     */
    private function fetchEasyPostRates(string $apiKey, float $weightLbs, string $zipCode, string $address): array
    {
        // Convert weight to ounces as EasyPost expects ounces for small parcels
        $weightOunces = max(1.0, $weightLbs * 16.0);

        $response = Http::withBasicAuth($apiKey, '')
            ->post('https://api.easypost.com/v2/shipments', [
                'shipment' => [
                    'to_address' => [
                        'street1' => $address,
                        'zip' => $zipCode,
                        'country' => 'US',
                    ],
                    'from_address' => [
                        'street1' => '100 Main St',
                        'city' => 'Austin',
                        'state' => 'TX',
                        'zip' => '78701',
                        'country' => 'US',
                    ],
                    'parcel' => [
                        'weight' => $weightOunces,
                    ],
                ]
            ]);

        if ($response->failed()) {
            throw new \Exception("EasyPost API returned status: " . $response->status() . " Body: " . $response->body());
        }

        $data = $response->json();
        $rates = $data['rates'] ?? [];

        if (empty($rates)) {
            throw new \Exception("No rates returned from EasyPost for this destination/weight.");
        }

        $formattedRates = [];
        foreach ($rates as $rate) {
            $formattedRates[] = [
                'id' => $rate['id'],
                'carrier' => $rate['carrier'],
                'service' => $rate['service'],
                'rate' => floatval($rate['rate']),
                'days' => $rate['delivery_days'] ?? null,
                'description' => $rate['carrier'] . ' (' . $rate['service'] . ')'
            ];
        }

        return $formattedRates;
    }

    /**
     * Local fallback shipping rates calculator.
     */
    private function calculateFallbackRates(float $weight, string $zipCode): array
    {
        // Base shipping fee structures
        $baseStandard = 4.99;
        $baseExpress = 14.99;

        // Weight surcharge: $0.75 per unit of weight
        $weightSurcharge = $weight * 0.75;

        // Simple region multiplier based on first digit of zip code to mock distance
        $regionFactor = 1.0;
        if (!empty($zipCode)) {
            $firstDigit = intval(substr($zipCode, 0, 1));
            // standard multiplier depending on distance from center warehouse zone (TX: 7xxxx)
            $distanceFromTexas = abs($firstDigit - 7);
            $regionFactor = 1.0 + ($distanceFromTexas * 0.15); // max 1.9x surcharge
        }

        $standardCost = ($baseStandard + $weightSurcharge) * $regionFactor;
        $expressCost = ($baseExpress + $weightSurcharge * 1.5) * $regionFactor;

        return [
            [
                'id' => 'rate_standard',
                'carrier' => 'USPS',
                'service' => 'Standard Ground',
                'rate' => round($standardCost, 2),
                'days' => 5,
                'description' => 'USPS (Standard Ground) - 5 Days'
            ],
            [
                'id' => 'rate_express',
                'carrier' => 'FedEx',
                'service' => 'Express Overnight',
                'rate' => round($expressCost, 2),
                'days' => 1,
                'description' => 'FedEx (Express Overnight) - 1 Day'
            ],
            [
                'id' => 'rate_economy',
                'carrier' => 'DHL',
                'service' => 'Economy Saver',
                'rate' => round($standardCost * 0.85, 2),
                'days' => 8,
                'description' => 'DHL (Economy Saver) - 8 Days'
            ]
        ];
    }

    /**
     * Helper to extract 5-digit ZIP code from an address string.
     */
    private function extractZipCode(string $address): string
    {
        // Match 6 digit Indian pin code first
        if (preg_match('/\b\d{6}\b/', $address, $matches)) {
            return $matches[0];
        }
        // Match 5 digit US zip code
        if (preg_match('/\b\d{5}(-\d{4})?\b/', $address, $matches)) {
            return $matches[0];
        }
        return '';
    }
}
