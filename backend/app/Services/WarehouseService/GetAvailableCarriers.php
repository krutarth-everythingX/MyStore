<?php

namespace App\Services\WarehouseService;

class GetAvailableCarriers
{
    public function handle(): array
    {
        return ['Blue Dart', 'FedEx', 'DHL', 'UPS', 'Delhivery', 'Speed Post'];
    }
}
