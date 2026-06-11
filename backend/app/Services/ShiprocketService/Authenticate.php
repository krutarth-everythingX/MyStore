<?php

namespace App\Services\ShiprocketService;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class Authenticate
{
    protected string $apiBase = 'https://apiv2.shiprocket.in/v1/external';

    /**
     * Authenticate and get token.
     */
    public function handle(string $email, string $password): ?string
    {
        try {
            $response = Http::post("{$this->apiBase}/auth/login", [
                'email' => $email,
                'password' => $password,
            ]);

            if ($response->successful()) {
                return $response->json('token');
            }
            Log::error("Shiprocket Login failed: " . $response->body());
        } catch (\Exception $e) {
            Log::error("Shiprocket Auth exception: " . $e->getMessage());
        }
        return null;
    }
}
