<?php

namespace App\Http\Controllers\InventoryController;

use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StoreStockEntry extends Controller
{
    public function __invoke(Request $request)
    {
        abort_unless($request->user()?->role === 'seller' && seller_setup_complete($request->user()), 403);

        $fields = $request->validate([
            'entry_type' => ['required', Rule::in(['adjustment_in', 'opening_stock', 'inward', 'manufacture'])],
            'posting_date' => ['required', 'date'],
            'posting_time' => ['nullable', 'date_format:H:i'],
            'to_warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax' => ['nullable', 'numeric', 'min:0'],
        ]);

        $warehouse = Warehouse::where('user_id', $request->user()->id)->findOrFail($fields['to_warehouse_id']);
        $productIds = collect($fields['items'])->pluck('product_id')->all();
        $products = Product::where('user_id', $request->user()->id)
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        abort_unless($products->count() === count(array_unique($productIds)), 404);

        DB::transaction(function () use ($fields, $products, $warehouse, $request) {
            $createdAt = $fields['posting_date'] . ' ' . ($fields['posting_time'] ?: now()->format('H:i'));

            foreach ($fields['items'] as $index => $item) {
                $product = $products->get($item['product_id']);
                $existing = $product->warehouses()->where('warehouse_id', $warehouse->id)->first();
                $currentQuantity = (int) ($existing?->pivot?->quantity ?? 0);
                $reservedQuantity = (int) ($existing?->pivot?->reserved_quantity ?? 0);
                $incomingQuantity = (int) $item['quantity'];
                $newQuantity = $currentQuantity + $incomingQuantity;
                $availableQuantity = max(0, $newQuantity - $reservedQuantity);
                $unitCost = $item['unit_cost'] ?? $existing?->pivot?->unit_cost ?? $product->sale_price ?? $product->regular_price ?? 0;

                $pivot = [
                    'quantity' => $newQuantity,
                    'reserved_quantity' => $reservedQuantity,
                    'available_quantity' => $availableQuantity,
                    'safety_stock' => (int) ($existing?->pivot?->safety_stock ?? 0),
                    'bin_location' => $existing?->pivot?->bin_location,
                    'warehouse_bin_id' => $existing?->pivot?->warehouse_bin_id,
                    'unit_cost' => $unitCost,
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

                $transaction = InventoryTransaction::create([
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'to_warehouse_id' => $warehouse->id,
                    'type' => $fields['entry_type'],
                    'quantity' => $incomingQuantity,
                    'quantity_after' => $newQuantity,
                    'reference_type' => 'stock_entry',
                    'reference_no' => sprintf('STE-%s-%03d', now()->format('YmdHis'), $index + 1),
                    'reason' => $fields['remarks'] ?: 'Manual stock entry',
                    'unit_cost' => $unitCost,
                    'created_by' => $request->user()->id,
                ]);

                $transaction->forceFill([
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ])->save();
            }
        });

        if ($request->header('X-Inertia')) {
            return redirect('/seller/inventory/stock-entries')->with('success', 'Stock entry created successfully.');
        }

        return response(['message' => 'Stock entry created successfully.'], 201);
    }
}
