<?php

namespace App\Http\Controllers\InventoryController;

use App\Http\Controllers\Controller;
use App\Models\InventoryAdjustment;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdjustStock extends Controller
{
    public function __invoke(Request $request)
    {
        abort_unless($request->user()?->role === 'seller' && seller_setup_complete($request->user()), 403);

        $fields = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'counted_quantity' => 'required|integer|min:0',
            'reason' => 'nullable|string|max:255',
            'bin_location' => 'nullable|string|max:120',
            'safety_stock' => 'nullable|integer|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
        ]);

        $product = Product::where('user_id', $request->user()->id)->findOrFail($fields['product_id']);
        $warehouse = Warehouse::where('user_id', $request->user()->id)->findOrFail($fields['warehouse_id']);

        DB::transaction(function () use ($fields, $product, $warehouse, $request) {
            $existing = $product->warehouses()->where('warehouse_id', $warehouse->id)->first();
            $systemQuantity = (int) ($existing?->pivot?->quantity ?? 0);
            $reservedQuantity = (int) ($existing?->pivot?->reserved_quantity ?? 0);
            $countedQuantity = (int) $fields['counted_quantity'];
            $availableQuantity = max(0, $countedQuantity - $reservedQuantity);
            $variance = $countedQuantity - $systemQuantity;

            $pivot = [
                'quantity' => $countedQuantity,
                'reserved_quantity' => $reservedQuantity,
                'available_quantity' => $availableQuantity,
                'safety_stock' => (int) ($fields['safety_stock'] ?? $existing?->pivot?->safety_stock ?? 0),
                'bin_location' => $fields['bin_location'] ?? $existing?->pivot?->bin_location,
                'unit_cost' => $fields['unit_cost'] ?? $existing?->pivot?->unit_cost,
                'stock_status' => $availableQuantity > 0 ? 'available' : 'out_of_stock',
            ];

            if ($existing) {
                $product->warehouses()->updateExistingPivot($warehouse->id, $pivot);
            } else {
                $product->warehouses()->attach($warehouse->id, $pivot);
            }

            $product->forceFill([
                'stock_quantity' => (int) $product->warehouses()->sum('warehouse_product.quantity'),
                'stock_status' => $product->warehouses()->sum('warehouse_product.available_quantity') > 0 ? 'instock' : 'outofstock',
            ])->save();

            InventoryAdjustment::create([
                'adjustment_no' => 'ADJ-' . now()->format('YmdHis') . '-' . $product->id,
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'system_quantity' => $systemQuantity,
                'counted_quantity' => $countedQuantity,
                'variance_quantity' => $variance,
                'reason' => $fields['reason'] ?? 'Manual stock count',
                'status' => 'posted',
                'created_by' => $request->user()->id,
            ]);

            InventoryTransaction::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => $variance >= 0 ? 'adjustment_in' : 'adjustment_out',
                'quantity' => $variance,
                'quantity_after' => $countedQuantity,
                'reference_type' => 'inventory_adjustment',
                'reference_no' => 'manual_count',
                'reason' => $fields['reason'] ?? 'Manual stock count',
                'unit_cost' => $fields['unit_cost'] ?? null,
                'created_by' => $request->user()->id,
            ]);
        });

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Inventory adjustment posted.');
        }

        return response(['message' => 'Inventory adjustment posted.'], 201);
    }
}
