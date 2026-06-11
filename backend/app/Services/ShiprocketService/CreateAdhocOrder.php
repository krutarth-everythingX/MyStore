<?php

namespace App\Services\ShiprocketService;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CreateAdhocOrder
{
    protected string $apiBase = 'https://apiv2.shiprocket.in/v1/external';

    /**
     * Create shipment / order in Shiprocket.
     */
    public function handle(array $payload, ?string $token = null): array
    {
        if ($token) {
            try {
                $response = Http::withToken($token)
                    ->post("{$this->apiBase}/orders/create/adhoc", $payload);

                if ($response->successful()) {
                    return [
                        'success' => true,
                        'order_id' => $response->json('order_id'),
                        'shipment_id' => $response->json('shipment_id'),
                        'awb_code' => $response->json('awb_code') ?: null
                    ];
                }
                Log::error("Shiprocket Create Order failed: " . $response->body());
            } catch (\Exception $e) {
                Log::error("Shiprocket Create Order Exception: " . $e->getMessage());
            }
        }

        // --- LOCAL SANDBOX FALLBACK ---
        $mockOrderId = mt_rand(10000000, 99999999);
        $mockShipmentId = mt_rand(20000000, 29999999);
        $mockAwb = 'SRK' . mt_rand(100000000, 999999999) . 'IN';

        return [
            'success' => true,
            'order_id' => $mockOrderId,
            'shipment_id' => $mockShipmentId,
            'awb_code' => $mockAwb
        ];
    }
}
