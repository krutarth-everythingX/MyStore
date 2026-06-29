<?php

namespace App\Services\ShippingService;

use App\DTOs\ShippableItemData;
use App\Services\ShiprocketService\CheckServiceability as ShiprocketCheckServiceability;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CalculateRates
{
    public function __construct(
        private readonly ShiprocketCheckServiceability $shiprocketCheckServiceability,
    ) {
    }

    /**
     * Calculate shipping rates based on items weight, dimensions and destination.
     *
     * @param ShippableItemData[] $items
     * @param string $address Destination address or ZIP code.
     * @return array Array of available shipping options with rates.
     */
    public function handle(
        array $items,
        string $address,
        array $allowedChannels = [],
        ?string $destinationCountry = null,
        ?string $postalCode = null,
    ): array
    {
        // 1. Calculate total weight
        $totalWeight = 0;
        foreach ($items as $item) {
            $weight = $item->product->weight_kg ?? $item->product->weight ?? 0.5; // default 0.5
            $qty = $item->quantity;
            $totalWeight += floatval($weight) * $qty;
        }

        $originCountry = $this->resolveOriginCountry($items);
        $destinationCountry = country_name_for($destinationCountry ?: $originCountry);
        $originCurrency = currency_for_country($originCountry);
        $destinationCurrency = currency_for_country($destinationCountry);

        // 2. Extract postal code/ZIP code for distance approximations
        $zipCode = $this->extractPostalCode($postalCode ?: $address);

        // If it's a 6-digit Indian Pin code, route via ShiprocketService
        if (strcasecmp($destinationCountry, 'India') === 0 && preg_match('/^\d{6}$/', $zipCode)) {
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
                        $pickup = $this->extractPostalCode($productOwner->address) ?: '380001';
                    }
                }
            }

            $res = $this->shiprocketCheckServiceability->handle($pickup, $zipCode, $totalWeight, 1);

            return $this->convertRatesCurrency(
                $this->filterRatesByAllowedChannels($res['rates'], $allowedChannels),
                'INR',
                $destinationCurrency,
            );
        }

        // 3. Check if EasyPost API key is set
        $apiKey = config('services.easypost.api_key') ?: env('EASYPOST_API_KEY');

        if ($apiKey && $this->shouldUseEasyPost($originCountry, $destinationCountry)) {
            try {
                return $this->convertRatesCurrency(
                    $this->filterRatesByAllowedChannels(
                        $this->fetchEasyPostRates($apiKey, $totalWeight, $zipCode, $address, $destinationCountry),
                        $allowedChannels,
                    ),
                    'USD',
                    $destinationCurrency,
                );
            } catch (\Exception $e) {
                Log::error("EasyPost Shipping API failed: " . $e->getMessage() . ". Falling back to local calculator.");
            }
        }

        // 4. Local fallback weight/distance-based shipping calculator
        return $this->convertRatesCurrency(
            $this->filterRatesByAllowedChannels(
                $this->calculateFallbackRates($totalWeight, $zipCode, $originCountry, $destinationCountry),
                $allowedChannels,
            ),
            $originCurrency,
            $destinationCurrency,
        );
    }

    private function filterRatesByAllowedChannels(array $rates, array $allowedChannels): array
    {
        $normalizedChannels = array_values(array_filter(array_map(
            static fn ($channel) => strtolower(trim((string) $channel)),
            $allowedChannels
        )));

        if ($normalizedChannels === []) {
            return $rates;
        }

        $filtered = array_values(array_filter($rates, function (array $rate) use ($normalizedChannels) {
            $carrier = strtolower(trim((string) ($rate['carrier'] ?? '')));
            $service = strtolower(trim((string) ($rate['service'] ?? '')));
            $description = strtolower(trim((string) ($rate['description'] ?? '')));

            foreach ($normalizedChannels as $channel) {
                if (
                    str_contains($carrier, $channel)
                    || str_contains($service, $channel)
                    || str_contains($description, $channel)
                    || str_contains($channel, $carrier)
                    || str_contains($channel, $service)
                ) {
                    return true;
                }
            }

            return false;
        }));

        if ($filtered !== []) {
            return $filtered;
        }

        if (count($normalizedChannels) === 1 && $rates !== []) {
            $channelLabel = trim((string) reset($allowedChannels));

            return array_map(static function (array $rate) use ($channelLabel) {
                $rate['channel'] = $channelLabel;
                return $rate;
            }, $rates);
        }

        return $rates;
    }

    /**
     * Fetch real rates from EasyPost API using basic HTTP requests.
     */
    private function fetchEasyPostRates(string $apiKey, float $weightLbs, string $zipCode, string $address, string $destinationCountry): array
    {
        // Convert weight to ounces as EasyPost expects ounces for small parcels
        $weightOunces = max(1.0, $weightLbs * 16.0);

        $response = Http::withBasicAuth($apiKey, '')
            ->post('https://api.easypost.com/v2/shipments', [
                'shipment' => [
                    'to_address' => [
                        'street1' => $address,
                        'zip' => $zipCode,
                        'country' => country_code_for($destinationCountry),
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
    private function calculateFallbackRates(float $weight, string $zipCode, string $originCountry, string $destinationCountry): array
    {
        $baseStandard = $this->baseStandardRateForCountry($originCountry);
        $baseExpress = round($baseStandard * 2.35, 2);

        $billableWeight = max(0.5, $weight);
        $weightSurcharge = max(0, ($billableWeight - 0.5)) * ($baseStandard * 0.55);

        $countryFactor = $this->countryMultiplier($originCountry, $destinationCountry);
        $postalFactor = $this->postalCodeMultiplier($zipCode, $originCountry, $destinationCountry);

        $standardCost = ($baseStandard + $weightSurcharge) * $countryFactor * $postalFactor;
        $expressCost = ($baseExpress + ($weightSurcharge * 1.5)) * ($countryFactor + 0.12) * $postalFactor;
        $economyCost = max($baseStandard * 0.82, $standardCost * 0.88);

        return [
            [
                'id' => 'rate_standard',
                'carrier' => 'Seller Shipping',
                'service' => 'Standard Delivery',
                'rate' => round($standardCost, 2),
                'days' => $countryFactor > 1.5 ? 8 : 5,
                'description' => 'Standard delivery based on seller channel and destination'
            ],
            [
                'id' => 'rate_express',
                'carrier' => 'Seller Shipping',
                'service' => 'Priority Delivery',
                'rate' => round($expressCost, 2),
                'days' => $countryFactor > 1.5 ? 4 : 2,
                'description' => 'Priority delivery based on seller channel and destination'
            ],
            [
                'id' => 'rate_economy',
                'carrier' => 'Seller Shipping',
                'service' => 'Economy Delivery',
                'rate' => round($economyCost, 2),
                'days' => $countryFactor > 1.5 ? 10 : 7,
                'description' => 'Economy delivery based on seller channel and destination'
            ]
        ];
    }

    /**
     * Helper to extract a postal code from a free-form address string.
     */
    private function extractPostalCode(string $address): string
    {
        // Match 6 digit Indian pin code first
        if (preg_match('/\b\d{6}\b/', $address, $matches)) {
            return $matches[0];
        }
        // Match 5 digit US zip code
        if (preg_match('/\b\d{5}(-\d{4})?\b/', $address, $matches)) {
            return $matches[0];
        }

        if (preg_match('/\b[A-Z0-9][A-Z0-9\s-]{1,9}[A-Z0-9]\b/i', strtoupper(trim($address)), $matches)) {
            return preg_replace('/\s+/', '', $matches[0]) ?: '';
        }

        return '';
    }

    private function resolveOriginCountry(array $items): string
    {
        $sellerCountry = $items[0]->product->user?->country ?? config('localization.default_country', 'India');

        return country_name_for($sellerCountry);
    }

    private function shouldUseEasyPost(string $originCountry, string $destinationCountry): bool
    {
        return strcasecmp($originCountry, 'United States') === 0
            || strcasecmp($destinationCountry, 'United States') === 0;
    }

    private function convertRatesCurrency(array $rates, string $fromCurrency, string $toCurrency): array
    {
        return array_map(static function (array $rate) use ($fromCurrency, $toCurrency) {
            $rate['rate'] = convert_money((float) ($rate['rate'] ?? 0), $fromCurrency, $toCurrency);
            $rate['currency'] = strtoupper($toCurrency);

            return $rate;
        }, $rates);
    }

    private function baseStandardRateForCountry(string $originCountry): float
    {
        return match (country_code_for($originCountry)) {
            'IN' => 80.0,
            'GB' => 6.5,
            'CA' => 8.5,
            'AU' => 9.0,
            'AE' => 24.0,
            'SG' => 7.0,
            'JP' => 850.0,
            'EU' => 7.5,
            default => 6.5,
        };
    }

    private function countryMultiplier(string $originCountry, string $destinationCountry): float
    {
        if (strcasecmp($originCountry, $destinationCountry) === 0) {
            return 1.0;
        }

        if ($this->sameShippingRegion($originCountry, $destinationCountry)) {
            return 1.35;
        }

        return 1.85;
    }

    private function sameShippingRegion(string $originCountry, string $destinationCountry): bool
    {
        $regions = [
            'north_america' => ['US', 'CA'],
            'europe' => ['GB', 'EU'],
            'asia' => ['IN', 'AE', 'SG', 'JP', 'AU'],
        ];

        $originCode = country_code_for($originCountry);
        $destinationCode = country_code_for($destinationCountry);

        foreach ($regions as $codes) {
            if (in_array($originCode, $codes, true) && in_array($destinationCode, $codes, true)) {
                return true;
            }
        }

        return false;
    }

    private function postalCodeMultiplier(string $postalCode, string $originCountry, string $destinationCountry): float
    {
        $normalized = strtoupper(trim($postalCode));

        if ($normalized === '') {
            return strcasecmp($originCountry, $destinationCountry) === 0 ? 1.05 : 1.18;
        }

        $digitsOnly = preg_replace('/\D+/', '', $normalized);
        if ($digitsOnly !== '') {
            $sum = array_sum(array_map('intval', str_split($digitsOnly)));
            return 1.0 + min(0.32, ($sum % 7) * 0.045);
        }

        $alphaSeed = 0;
        foreach (str_split($normalized) as $char) {
            $alphaSeed += ord($char);
        }

        return 1.0 + min(0.28, ($alphaSeed % 6) * 0.04);
    }
}
