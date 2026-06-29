<?php

namespace App\Http\Controllers\InventoryController;

use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StoreStockMovement extends Controller
{
    public function __invoke(Request $request)
    {
        abort_unless($request->user()?->role === 'seller' && seller_setup_complete($request->user()), 403);

        $fields = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'type' => ['required', Rule::in(['inward', 'outward', 'transfer', 'adjustment_in', 'adjustment_out'])],
            'quantity' => ['required', 'integer', 'min:1'],
            'from_warehouse_id' => [
                Rule::requiredIf(fn () => in_array($request->input('type'), ['outward', 'transfer', 'adjustment_out'], true)),
                'nullable',
                'integer',
                'exists:warehouses,id',
            ],
            'to_warehouse_id' => [
                Rule::requiredIf(fn () => in_array($request->input('type'), ['inward', 'transfer', 'adjustment_in'], true)),
                'nullable',
                'integer',
                'exists:warehouses,id',
            ],
            'reason' => ['nullable', 'string', 'max:255'],
            'reference_type' => ['nullable', 'string', 'max:80'],
            'reference_no' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'attachment' => ['nullable', 'file', 'max:5120'],
        ]);

        if (($fields['type'] ?? null) === 'transfer'
            && (int) ($fields['from_warehouse_id'] ?? 0) === (int) ($fields['to_warehouse_id'] ?? 0)) {
            throw ValidationException::withMessages([
                'to_warehouse_id' => 'Choose a different destination warehouse.',
            ]);
        }

        $product = Product::where('user_id', $request->user()->id)->findOrFail($fields['product_id']);
        $fromWarehouse = isset($fields['from_warehouse_id'])
            ? Warehouse::where('user_id', $request->user()->id)->findOrFail($fields['from_warehouse_id'])
            : null;
        $toWarehouse = isset($fields['to_warehouse_id'])
            ? Warehouse::where('user_id', $request->user()->id)->findOrFail($fields['to_warehouse_id'])
            : null;

        DB::transaction(function () use ($fields, $product, $fromWarehouse, $toWarehouse, $request) {
            $quantity = (int) $fields['quantity'];
            $quantityAfter = 0;
            $ledgerWarehouse = $toWarehouse ?: $fromWarehouse;

            if (in_array($fields['type'], ['inward', 'adjustment_in'], true)) {
                $quantityAfter = $this->applyWarehouseDelta($product, $toWarehouse, $quantity);
            } elseif (in_array($fields['type'], ['outward', 'adjustment_out'], true)) {
                $quantityAfter = $this->applyWarehouseDelta($product, $fromWarehouse, -$quantity);
                $quantity *= -1;
            } else {
                $this->applyWarehouseDelta($product, $fromWarehouse, -$quantity);
                $quantityAfter = $this->applyWarehouseDelta($product, $toWarehouse, $quantity);
            }

            $this->syncProductStock($product);

            InventoryTransaction::create([
                'product_id' => $product->id,
                'warehouse_id' => $ledgerWarehouse?->id,
                'from_warehouse_id' => $fromWarehouse?->id,
                'to_warehouse_id' => $toWarehouse?->id,
                'type' => $fields['type'],
                'quantity' => $quantity,
                'quantity_after' => $quantityAfter,
                'reference_type' => $fields['reference_type'] ?? 'manual',
                'reference_no' => $fields['reference_no'] ?: sprintf('MR-%04d', InventoryTransaction::max('id') + 1),
                'reason' => $fields['reason'] ?: 'Manual stock movement',
                'unit_cost' => $product->sale_price ?? $product->regular_price ?? null,
                'created_by' => $request->user()->id,
            ]);
        });

        if ($request->header('X-Inertia')) {
            return redirect('/seller/inventory/stock-movements')->with('success', 'Stock movement recorded successfully.');
        }

        return response(['message' => 'Stock movement recorded successfully.'], 201);
    }

    private function applyWarehouseDelta(Product $product, Warehouse $warehouse, int $delta): int
    {
        $existing = $product->warehouses()->where('warehouse_id', $warehouse->id)->first();
        $currentQuantity = (int) ($existing?->pivot?->quantity ?? 0);
        $reservedQuantity = (int) ($existing?->pivot?->reserved_quantity ?? 0);
        $newQuantity = $currentQuantity + $delta;

        if ($newQuantity < 0) {
            throw ValidationException::withMessages([
                'quantity' => 'Quantity exceeds available stock in the selected source warehouse.',
            ]);
        }

        $availableQuantity = max(0, $newQuantity - $reservedQuantity);
        $pivot = [
            'quantity' => $newQuantity,
            'reserved_quantity' => $reservedQuantity,
            'available_quantity' => $availableQuantity,
            'safety_stock' => (int) ($existing?->pivot?->safety_stock ?? 0),
            'bin_location' => $existing?->pivot?->bin_location,
            'warehouse_bin_id' => $existing?->pivot?->warehouse_bin_id,
            'unit_cost' => $existing?->pivot?->unit_cost ?? $product->sale_price ?? $product->regular_price ?? null,
            'stock_status' => $availableQuantity > 0 ? 'available' : 'out_of_stock',
        ];

        if ($existing) {
            $product->warehouses()->updateExistingPivot($warehouse->id, $pivot);
        } else {
            $product->warehouses()->attach($warehouse->id, $pivot);
        }

        return $newQuantity;
    }

    private function syncProductStock(Product $product): void
    {
        $product->forceFill([
            'stock_quantity' => (int) $product->warehouses()->sum('warehouse_product.quantity'),
            'stock_status' => $product->warehouses()->sum('warehouse_product.available_quantity') > 0 ? 'instock' : 'outofstock',
        ])->save();
    }
}
