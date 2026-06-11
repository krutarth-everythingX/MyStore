<?php

namespace App\Services\SellerDashboardService;

use App\Models\Product;

class BuildInventoryExportRows
{
    public function handle(int $sellerId): array
    {
        $products = Product::with(['brand', 'categories', 'warehouses'])
            ->where('user_id', $sellerId)
            ->latest()
            ->get();

        $rows = [];

        foreach ($products as $product) {
            $warehouseAllocations = [];

            foreach ($product->warehouses as $warehouse) {
                $warehouseAllocations[] = "{$warehouse->name} ({$warehouse->code}): Qty {$warehouse->pivot->quantity} at {$warehouse->pivot->bin_location}";
            }

            $rows[] = [
                $product->id,
                $product->sku ?? 'N/A',
                $product->name,
                $product->brand->name ?? 'N/A',
                $product->categories->pluck('name')->implode(', ') ?: 'None',
                $product->regular_price,
                $product->sale_price ?? 'N/A',
                $product->manage_stock ? 'Yes' : 'No',
                $product->manage_stock ? $product->stock_quantity : 'Unlimited',
                $product->stock_status,
                $product->low_stock_amount ?? '0',
                implode(' | ', $warehouseAllocations) ?: 'None',
            ];
        }

        return $rows;
    }
}
