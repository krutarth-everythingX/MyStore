<?php

namespace App\Services\InventoryService;

use App\Models\InventoryAdjustment;
use App\Models\InventoryBatch;
use App\Models\InventoryReservation;
use App\Models\InventorySerialNumber;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Warehouse;

class SellerInventorySnapshot
{
    public function handle(int $sellerId): array
    {
        $warehouses = Warehouse::with('zones.aisles.racks.shelves.bins')
            ->where('user_id', $sellerId)
            ->get();

        $products = Product::with(['warehouses', 'categories', 'brand'])
            ->where('user_id', $sellerId)
            ->where('type', '!=', 'variation')
            ->get();

        $productIds = $products->pluck('id');
        $warehouseIds = $warehouses->pluck('id');

        $allocations = $products->flatMap(function (Product $product) {
            return $product->warehouses->map(function (Warehouse $warehouse) use ($product) {
                $quantity = (int) ($warehouse->pivot->quantity ?? 0);
                $reserved = (int) ($warehouse->pivot->reserved_quantity ?? 0);
                $available = (int) ($warehouse->pivot->available_quantity ?? max(0, $quantity - $reserved));
                $unitCost = $warehouse->pivot->unit_cost !== null
                    ? (float) $warehouse->pivot->unit_cost
                    : (float) ($product->sale_price ?? $product->regular_price ?? 0);

                return [
                    'id' => "{$product->id}-{$warehouse->id}",
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku ?: $product->mystore_product_id,
                    'warehouse_id' => $warehouse->id,
                    'warehouse_name' => $warehouse->name,
                    'warehouse_code' => $warehouse->code,
                    'quantity' => $quantity,
                    'reserved_quantity' => $reserved,
                    'available_quantity' => $available,
                    'safety_stock' => (int) ($warehouse->pivot->safety_stock ?? 0),
                    'bin_location' => $warehouse->pivot->bin_location ?: 'Unassigned',
                    'stock_status' => $warehouse->pivot->stock_status ?: ($available > 0 ? 'available' : 'out_of_stock'),
                    'unit_cost' => $unitCost,
                    'valuation' => round($available * $unitCost, 2),
                ];
            });
        })->values();

        $totalOnHand = $allocations->sum('quantity');
        $totalReserved = $allocations->sum('reserved_quantity');
        $totalAvailable = $allocations->sum('available_quantity');
        $totalValuation = round($allocations->sum('valuation'), 2);

        $lowStockCount = $allocations->filter(fn (array $row) => $row['available_quantity'] <= max(1, $row['safety_stock']))->count();
        $unassignedBinCount = $allocations->filter(fn (array $row) => $row['bin_location'] === 'Unassigned')->count();

        $locationCounts = [
            'warehouses' => $warehouses->count(),
            'zones' => $warehouses->flatMap->zones->count(),
            'aisles' => $warehouses->flatMap(fn (Warehouse $warehouse) => $warehouse->zones->flatMap->aisles)->count(),
            'racks' => $warehouses->flatMap(fn (Warehouse $warehouse) => $warehouse->zones->flatMap(fn ($zone) => $zone->aisles->flatMap->racks))->count(),
            'shelves' => $warehouses->flatMap(fn (Warehouse $warehouse) => $warehouse->zones->flatMap(fn ($zone) => $zone->aisles->flatMap(fn ($aisle) => $aisle->racks->flatMap->shelves)))->count(),
            'bins' => $warehouses->flatMap(fn (Warehouse $warehouse) => $warehouse->zones->flatMap(fn ($zone) => $zone->aisles->flatMap(fn ($aisle) => $aisle->racks->flatMap(fn ($rack) => $rack->shelves->flatMap->bins))))->count(),
        ];

        return [
            'metrics' => [
                'products' => $products->count(),
                'warehouses' => $warehouses->count(),
                'on_hand' => $totalOnHand,
                'available' => $totalAvailable,
                'reserved' => $totalReserved,
                'low_stock' => $lowStockCount,
                'unassigned_bins' => $unassignedBinCount,
                'valuation' => $totalValuation,
                'batches' => InventoryBatch::whereIn('product_id', $productIds)->count(),
                'serials' => InventorySerialNumber::whereIn('product_id', $productIds)->count(),
                'open_reservations' => InventoryReservation::whereIn('product_id', $productIds)->where('status', 'reserved')->sum('quantity'),
                'adjustments' => InventoryAdjustment::whereIn('product_id', $productIds)->count(),
                'movements' => InventoryTransaction::whereIn('product_id', $productIds)->count(),
            ],
            'location_counts' => $locationCounts,
            'allocations' => $allocations,
            'recent_movements' => InventoryTransaction::with(['product', 'warehouse'])
                ->whereIn('product_id', $productIds)
                ->latest()
                ->take(8)
                ->get(),
            'recent_adjustments' => InventoryAdjustment::with(['product', 'warehouse'])
                ->whereIn('product_id', $productIds)
                ->latest()
                ->take(8)
                ->get(),
            'traceability' => [
                'batches' => InventoryBatch::with(['product', 'warehouse'])->whereIn('product_id', $productIds)->latest()->take(8)->get(),
                'serials' => InventorySerialNumber::with(['product', 'warehouse'])->whereIn('product_id', $productIds)->latest()->take(8)->get(),
            ],
            'warehouse_ids' => $warehouseIds,
        ];
    }
}
