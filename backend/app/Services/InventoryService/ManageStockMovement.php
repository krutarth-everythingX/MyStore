<?php

namespace App\Services\InventoryService;

use App\Models\InventoryReservation;
use App\Models\InventoryTransaction;
use App\Models\Order;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Exceptions\HttpResponseException;

class ManageStockMovement
{
    public function reserveForOrder(Product $product, int $quantity, Order $order, ?string $buyerPostalCode = null): void
    {
        $product->loadMissing('warehouses');

        if ($this->availableAcrossWarehouses($product) < $quantity) {
            throw new HttpResponseException(
                response([
                    'message' => "Insufficient stock for product: {$product->name}. Only {$this->availableAcrossWarehouses($product)} remaining.",
                ], 400)
            );
        }

        if ($product->warehouses->isEmpty()) {
            $this->reserveProductLevelStock($product, $quantity, $order);

            return;
        }

        $warehouses = $this->warehousesForFulfillment($product, $buyerPostalCode);
        $remaining = $quantity;

        foreach ($warehouses as $warehouse) {
            if ($remaining <= 0) {
                break;
            }

            $available = (int) ($warehouse->pivot->available_quantity ?? max(0, ((int) $warehouse->pivot->quantity) - ((int) $warehouse->pivot->reserved_quantity)));
            $reserveQuantity = min($available, $remaining);

            if ($reserveQuantity <= 0) {
                continue;
            }

            $reserved = (int) ($warehouse->pivot->reserved_quantity ?? 0) + $reserveQuantity;
            $newAvailable = max(0, $available - $reserveQuantity);

            $product->warehouses()->updateExistingPivot($warehouse->id, [
                'reserved_quantity' => $reserved,
                'available_quantity' => $newAvailable,
                'stock_status' => $newAvailable > 0 ? 'available' : 'reserved',
            ]);

            InventoryReservation::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'order_id' => $order->id,
                'quantity' => $reserveQuantity,
                'status' => 'reserved',
                'expires_at' => now()->addDays(7),
            ]);

            InventoryTransaction::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => 'reservation',
                'quantity' => $reserveQuantity,
                'quantity_after' => $newAvailable,
                'reference_type' => 'order',
                'reference_no' => (string) $order->id,
                'reason' => 'Sales order reserved stock',
                'unit_cost' => $warehouse->pivot->unit_cost,
                'created_by' => $order->buyer_id,
            ]);

            $remaining -= $reserveQuantity;
        }

        if ($remaining > 0) {
            throw new HttpResponseException(
                response(['message' => "Unable to reserve enough stock for product: {$product->name}."], 400)
            );
        }

        $this->refreshProductAvailability($product);
    }

    public function releaseOrderReservations(Order $order): void
    {
        $reservations = InventoryReservation::with(['product', 'warehouse'])
            ->where('order_id', $order->id)
            ->where('status', 'reserved')
            ->get();

        foreach ($reservations as $reservation) {
            $product = $reservation->product;
            $warehouse = $reservation->warehouse;

            if (! $product) {
                $reservation->update(['status' => 'released']);
                continue;
            }

            if (! $warehouse) {
                $product->forceFill([
                    'stock_quantity' => (int) $product->stock_quantity + (int) $reservation->quantity,
                    'stock_status' => 'instock',
                ])->save();

                InventoryTransaction::create([
                    'product_id' => $product->id,
                    'type' => 'reservation_release',
                    'quantity' => (int) $reservation->quantity,
                    'quantity_after' => (int) $product->stock_quantity,
                    'reference_type' => 'order',
                    'reference_no' => (string) $order->id,
                    'reason' => 'Order reservation released',
                    'created_by' => $order->buyer_id,
                ]);

                $reservation->update(['status' => 'released']);
                continue;
            }

            $currentWarehouse = $product->warehouses()->where('warehouse_id', $warehouse->id)->first();
            $currentReserved = (int) ($currentWarehouse?->pivot?->reserved_quantity ?? 0);
            $currentAvailable = (int) ($currentWarehouse?->pivot?->available_quantity ?? 0);
            $newReserved = max(0, $currentReserved - (int) $reservation->quantity);
            $newAvailable = $currentAvailable + (int) $reservation->quantity;

            $product->warehouses()->updateExistingPivot($warehouse->id, [
                'reserved_quantity' => $newReserved,
                'available_quantity' => $newAvailable,
                'stock_status' => $newAvailable > 0 ? 'available' : 'out_of_stock',
            ]);

            InventoryTransaction::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => 'reservation_release',
                'quantity' => (int) $reservation->quantity,
                'quantity_after' => $newAvailable,
                'reference_type' => 'order',
                'reference_no' => (string) $order->id,
                'reason' => 'Order reservation released',
                'unit_cost' => $currentWarehouse?->pivot?->unit_cost,
                'created_by' => $order->buyer_id,
            ]);

            $reservation->update(['status' => 'released']);
            $this->refreshProductAvailability($product);
        }
    }

    public function shipOrderReservations(Order $order): void
    {
        $reservations = InventoryReservation::with(['product', 'warehouse'])
            ->where('order_id', $order->id)
            ->where('status', 'reserved')
            ->get();

        foreach ($reservations as $reservation) {
            $product = $reservation->product;
            $warehouse = $reservation->warehouse;

            if (! $product) {
                $reservation->update(['status' => 'shipped']);
                continue;
            }

            if (! $warehouse) {
                InventoryTransaction::create([
                    'product_id' => $product->id,
                    'type' => 'stock_out',
                    'quantity' => -1 * (int) $reservation->quantity,
                    'quantity_after' => (int) $product->stock_quantity,
                    'reference_type' => 'shipment',
                    'reference_no' => (string) $order->id,
                    'reason' => 'Order shipped from product-level stock',
                    'created_by' => $order->buyer_id,
                ]);

                $reservation->update(['status' => 'shipped']);
                continue;
            }

            $currentWarehouse = $product->warehouses()->where('warehouse_id', $warehouse->id)->first();
            $currentOnHand = (int) ($currentWarehouse?->pivot?->quantity ?? 0);
            $currentReserved = (int) ($currentWarehouse?->pivot?->reserved_quantity ?? 0);
            $newOnHand = max(0, $currentOnHand - (int) $reservation->quantity);
            $newReserved = max(0, $currentReserved - (int) $reservation->quantity);
            $available = (int) ($currentWarehouse?->pivot?->available_quantity ?? 0);

            $product->warehouses()->updateExistingPivot($warehouse->id, [
                'quantity' => $newOnHand,
                'reserved_quantity' => $newReserved,
                'available_quantity' => $available,
                'stock_status' => $available > 0 ? 'available' : 'out_of_stock',
            ]);

            InventoryTransaction::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => 'stock_out',
                'quantity' => -1 * (int) $reservation->quantity,
                'quantity_after' => $newOnHand,
                'reference_type' => 'shipment',
                'reference_no' => (string) $order->id,
                'reason' => 'Order shipped',
                'unit_cost' => $currentWarehouse?->pivot?->unit_cost,
                'created_by' => $order->buyer_id,
            ]);

            $reservation->update(['status' => 'shipped']);
            $this->refreshProductAvailability($product);
        }
    }

    public function restockReturnedOrder(Order $order): void
    {
        $reservations = InventoryReservation::with(['product', 'warehouse'])
            ->where('order_id', $order->id)
            ->where('status', 'shipped')
            ->get();

        if ($reservations->isEmpty()) {
            $this->restockOrderItemsWithoutReservations($order);

            return;
        }

        foreach ($reservations as $reservation) {
            $product = $reservation->product;
            $warehouse = $reservation->warehouse;

            if (! $product) {
                $reservation->update(['status' => 'returned']);
                continue;
            }

            if (! $warehouse) {
                $newAvailable = (int) $product->stock_quantity + (int) $reservation->quantity;
                $product->forceFill([
                    'stock_quantity' => $newAvailable,
                    'stock_status' => 'instock',
                ])->save();

                InventoryTransaction::create([
                    'product_id' => $product->id,
                    'type' => 'return_in',
                    'quantity' => (int) $reservation->quantity,
                    'quantity_after' => $newAvailable,
                    'reference_type' => 'return',
                    'reference_no' => (string) $order->id,
                    'reason' => 'Returned product-level stock',
                    'created_by' => $order->buyer_id,
                ]);

                $reservation->update(['status' => 'returned']);
                continue;
            }

            $currentWarehouse = $product->warehouses()->where('warehouse_id', $warehouse->id)->first();
            $currentOnHand = (int) ($currentWarehouse?->pivot?->quantity ?? 0);
            $currentAvailable = (int) ($currentWarehouse?->pivot?->available_quantity ?? 0);
            $newOnHand = $currentOnHand + (int) $reservation->quantity;
            $newAvailable = $currentAvailable + (int) $reservation->quantity;

            $product->warehouses()->updateExistingPivot($warehouse->id, [
                'quantity' => $newOnHand,
                'available_quantity' => $newAvailable,
                'stock_status' => 'available',
            ]);

            InventoryTransaction::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => 'return_in',
                'quantity' => (int) $reservation->quantity,
                'quantity_after' => $newOnHand,
                'reference_type' => 'return',
                'reference_no' => (string) $order->id,
                'reason' => 'Returned order restocked',
                'unit_cost' => $currentWarehouse?->pivot?->unit_cost,
                'created_by' => $order->buyer_id,
            ]);

            $reservation->update(['status' => 'returned']);
            $this->refreshProductAvailability($product);
        }
    }

    public function refreshProductAvailability(Product $product): void
    {
        $available = (int) $product->warehouses()->sum('warehouse_product.available_quantity');

        $product->forceFill([
            'stock_quantity' => $available,
            'stock_status' => $available > 0 ? 'instock' : 'outofstock',
        ])->save();
    }

    private function availableAcrossWarehouses(Product $product): int
    {
        if ($product->warehouses->isEmpty()) {
            return (int) $product->stock_quantity;
        }

        return $product->warehouses->sum(function (Warehouse $warehouse) {
            return (int) ($warehouse->pivot->available_quantity ?? max(0, ((int) $warehouse->pivot->quantity) - ((int) $warehouse->pivot->reserved_quantity)));
        });
    }

    private function reserveProductLevelStock(Product $product, int $quantity, Order $order): void
    {
        $newAvailable = max(0, (int) $product->stock_quantity - $quantity);

        $product->forceFill([
            'stock_quantity' => $newAvailable,
            'stock_status' => $newAvailable > 0 ? 'instock' : 'outofstock',
        ])->save();

        InventoryReservation::create([
            'product_id' => $product->id,
            'warehouse_id' => null,
            'order_id' => $order->id,
            'quantity' => $quantity,
            'status' => 'reserved',
            'expires_at' => now()->addDays(7),
        ]);

        InventoryTransaction::create([
            'product_id' => $product->id,
            'type' => 'reservation',
            'quantity' => $quantity,
            'quantity_after' => $newAvailable,
            'reference_type' => 'order',
            'reference_no' => (string) $order->id,
            'reason' => 'Sales order reserved product-level stock',
            'created_by' => $order->buyer_id,
        ]);
    }

    private function restockOrderItemsWithoutReservations(Order $order): void
    {
        $order->loadMissing('items.product.warehouses');

        foreach ($order->items as $item) {
            $product = $item->product;

            if (! $product || ! $product->manage_stock) {
                continue;
            }

            $warehouse = $product->warehouses->first();

            if (! $warehouse) {
                continue;
            }

            $currentOnHand = (int) ($warehouse->pivot->quantity ?? 0);
            $currentAvailable = (int) ($warehouse->pivot->available_quantity ?? 0);
            $newOnHand = $currentOnHand + (int) $item->quantity;
            $newAvailable = $currentAvailable + (int) $item->quantity;

            $product->warehouses()->updateExistingPivot($warehouse->id, [
                'quantity' => $newOnHand,
                'available_quantity' => $newAvailable,
                'stock_status' => 'available',
            ]);

            InventoryTransaction::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => 'return_in',
                'quantity' => (int) $item->quantity,
                'quantity_after' => $newOnHand,
                'reference_type' => 'return',
                'reference_no' => (string) $order->id,
                'reason' => 'Returned order restocked',
                'unit_cost' => $warehouse->pivot->unit_cost,
                'created_by' => $order->buyer_id,
            ]);

            $this->refreshProductAvailability($product);
        }
    }

    private function warehousesForFulfillment(Product $product, ?string $buyerPostalCode)
    {
        return $product->warehouses->sortBy(function (Warehouse $warehouse) use ($buyerPostalCode) {
            if (! $buyerPostalCode) {
                return $warehouse->id;
            }

            $warehouseZip = preg_replace('/[^0-9]/', '', $warehouse->postal_code ?: '') ?: '10001';

            return $this->calculateZipDistance($buyerPostalCode, $warehouseZip);
        });
    }

    private function calculateZipDistance(string $zip1, string $zip2): float
    {
        $zipCoordinates = [
            '100' => [40.7128, -74.0060],
            '900' => [34.0522, -118.2437],
            '606' => [41.8781, -87.6298],
            '770' => [29.7604, -95.3698],
            '331' => [25.7617, -80.1918],
            '981' => [47.6062, -122.3321],
            '021' => [42.3601, -71.0589],
            '200' => [38.9072, -77.0369],
            '303' => [33.7490, -84.3880],
            '941' => [37.7749, -122.4194],
        ];

        $getCoords = function (string $zip) use ($zipCoordinates): array {
            $digits = preg_replace('/[^0-9]/', '', $zip);
            if (strlen($digits) < 3) {
                return [40.0, -95.0];
            }

            $prefix = substr($digits, 0, 3);
            if (isset($zipCoordinates[$prefix])) {
                return $zipCoordinates[$prefix];
            }

            $val = (int) $prefix;
            $lat = 25.0 + ($val % 25);
            $lng = -125.0 + (($val * 7) % 55);

            return [$lat, $lng];
        };

        [$lat1, $lng1] = $getCoords($zip1);
        [$lat2, $lng2] = $getCoords($zip2);

        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
