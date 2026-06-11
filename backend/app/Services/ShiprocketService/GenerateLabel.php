<?php

namespace App\Services\ShiprocketService;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateLabel
{
    protected string $apiBase = 'https://apiv2.shiprocket.in/v1/external';

    /**
     * Generate Label from Shiprocket.
     */
    public function handle(string $shipmentId, ?string $token = null): ?string
    {
        if ($token) {
            try {
                $response = Http::withToken($token)
                    ->post("{$this->apiBase}/courier/generate/label", [
                        'shipment_id' => [$shipmentId]
                    ]);

                if ($response->successful()) {
                    return $response->json('label_url');
                }
            } catch (\Exception $e) {
                Log::error("Shiprocket Generate Label failed: " . $e->getMessage());
            }
        }

        // Mock label URL (placeholder PDF receipt/label)
        return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    }
}
