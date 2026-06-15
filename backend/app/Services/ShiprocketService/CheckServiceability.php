<?php

namespace App\Services\ShiprocketService;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckServiceability
{
    protected string $apiBase = 'https://apiv2.shiprocket.in/v1/external';

    /**
     * Check pin code serviceability.
     */
    public function handle(string $pickup, string $delivery, float $weight, int $cod = 1, ?string $token = null): array
    {
        if ($token) {
            try {
                $response = Http::withToken($token)
                    ->get("{$this->apiBase}/courier/serviceability", [
                        'pickup_postcode' => $pickup,
                        'delivery_postcode' => $delivery,
                        'weight' => $weight,
                        'cod' => $cod,
                    ]);

                if ($response->successful() && $response->json('status') == 200) {
                    $couriers = $response->json('data.available_courier_companies') ?: [];
                    $formatted = [];
                    foreach ($couriers as $c) {
                        $formatted[] = [
                            'id' => 'sr_' . $c['courier_company_id'],
                            'carrier' => $c['courier_name'],
                            'service' => $c['mode'] ?? 'Surface',
                            'rate' => floatval($c['rate'] ?? 40.00),
                            'days' => $c['estimated_delivery_days'] ?? 3,
                            'description' => $c['courier_name'] . ' (' . ($c['mode'] ?? 'Surface') . ')'
                        ];
                    }
                    if (!empty($formatted)) {
                        return [
                            'serviceable' => true,
                            'rates' => $formatted
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::error("Shiprocket Pincode serviceability check failed: " . $e->getMessage());
            }
        }

        // --- LOCAL SANDBOX FALLBACK ---
        // Validate Indian Pin codes (must be 6 digits)
        if (!preg_match('/^\d{6}$/', $delivery)) {
            return [
                'serviceable' => false,
                'rates' => []
            ];
        }

        // Standard rates calculation based on weight and region
        $baseRate = 45.00; // Flat INR 45
        $weightSurcharge = max(0, ($weight - 0.5) * 40.00); // 40 INR per extra 500g

        // Gujarat Pincodes check (usually starts with 36xxxx - 39xxxx)
        $isGujarat = false;
        $prefix = substr($delivery, 0, 2);
        if ($prefix >= '36' && $prefix <= '39') {
            $isGujarat = true;
        }

        $standardCost = $baseRate + $weightSurcharge;
        $expressCost = ($baseRate * 1.5) + $weightSurcharge;

        if ($isGujarat) {
            // Gujarat pincodes have faster and cheaper delivery options (simulating regional logistics)
            return [
                'serviceable' => true,
                'rates' => [
                    [
                        'id' => 'sr_delhivery_surface',
                        'carrier' => 'Delhivery',
                        'service' => 'Surface Standard',
                        'rate' => round($standardCost * 0.9, 2),
                        'days' => 2,
                        'description' => 'Delhivery (Surface Standard) - 2 Days (Gujarat Delivery)'
                    ],
                    [
                        'id' => 'local_air_express',
                        'carrier' => 'MyStore Air Express',
                        'service' => 'Air Express',
                        'rate' => round($expressCost * 0.9, 2),
                        'days' => 1,
                        'description' => 'MyStore Air Express - 1 Day (Ahmedabad Hub)'
                    ]
                ]
            ];
        } else {
            // Rest of India
            return [
                'serviceable' => true,
                'rates' => [
                    [
                        'id' => 'sr_shadowfax',
                        'carrier' => 'Shadowfax',
                        'service' => 'Surface Saver',
                        'rate' => round($standardCost, 2),
                        'days' => 4,
                        'description' => 'Shadowfax (Surface Saver) - 4 Days'
                    ],
                    [
                        'id' => 'sr_fedex_india',
                        'carrier' => 'FedEx India',
                        'service' => 'Express Premium',
                        'rate' => round($expressCost, 2),
                        'days' => 2,
                        'description' => 'FedEx India (Express Premium) - 2 Days'
                    ]
                ]
            ];
        }
    }
}
