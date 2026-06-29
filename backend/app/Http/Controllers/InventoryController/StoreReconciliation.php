<?php

namespace App\Http\Controllers\InventoryController;

use App\Http\Controllers\Controller;
use App\Models\InventoryAdjustment;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoreReconciliation extends Controller
{
    public function __invoke(Request $request)
    {
        abort_unless($request->user()?->role === 'seller' && seller_setup_complete($request->user()), 403);

        $fields = $request->validate([
            'purpose' => ['required', 'string', 'max:120'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'posting_date' => ['required', 'date'],
            'posting_time' => ['nullable', 'date_format:H:i'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.counted_quantity' => ['required', 'integer', 'min:0'],
        ]);

        $warehouse = Warehouse::where('user_id', $request->user()->id)->findOrFail($fields['warehouse_id']);
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
                $systemQuantity = (int) ($existing?->pivot?->quantity ?? 0);
                $countedQuantity = (int) $item['counted_quantity'];
                $varianceQuantity = $countedQuantity - $systemQuantity;

                $adjustment = InventoryAdjustment::create([
                    'adjustment_no' => sprintf('REC-%s-%03d', now()->format('YmdHis'), $index + 1),
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'system_quantity' => $systemQuantity,
                    'counted_quantity' => $countedQuantity,
                    'variance_quantity' => $varianceQuantity,
                    'reason' => $fields['remarks'] ?: $fields['purpose'],
                    'status' => 'posted',
                    'created_by' => $request->user()->id,
                ]);

                $adjustment->forceFill([
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ])->save();
            }
        });

        if ($request->header('X-Inertia')) {
            return redirect('/seller/inventory/reconciliation')->with('success', 'Reconciliation created successfully.');
        }

        return response(['message' => 'Reconciliation created successfully.'], 201);
    }
}
