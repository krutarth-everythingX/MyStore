<?php

namespace App\Http\Controllers\InventoryController;

use App\Http\Controllers\Controller;
use App\Models\InventoryBatch;
use App\Models\InventorySerialNumber;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StoreTraceabilityRecord extends Controller
{
    public function __invoke(Request $request)
    {
        abort_unless($request->user()?->role === 'seller' && seller_setup_complete($request->user()), 403);

        $fields = $request->validate([
            'record_type' => ['required', Rule::in(['batch', 'serial'])],
            'product_id' => 'required|integer|exists:products,id',
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
            'batch_no' => 'nullable|string|max:120',
            'manufactured_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:manufactured_at',
            'quantity' => 'nullable|integer|min:0',
            'serial_no' => 'nullable|string|max:160',
            'inventory_batch_id' => 'nullable|integer|exists:inventory_batches,id',
            'status' => 'nullable|string|max:60',
        ]);

        $product = Product::where('user_id', $request->user()->id)->findOrFail($fields['product_id']);
        $warehouse = null;

        if (! empty($fields['warehouse_id'])) {
            $warehouse = Warehouse::where('user_id', $request->user()->id)->findOrFail($fields['warehouse_id']);
        }

        if ($fields['record_type'] === 'batch') {
            return $this->storeBatch($request, $product, $warehouse, $fields);
        }

        return $this->storeSerial($request, $product, $warehouse, $fields);
    }

    private function storeBatch(Request $request, Product $product, ?Warehouse $warehouse, array $fields)
    {
        $request->validate([
            'batch_no' => 'required|string|max:120',
            'quantity' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($fields, $product, $warehouse, $request) {
            $batch = InventoryBatch::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'batch_no' => $fields['batch_no'],
                ],
                [
                    'warehouse_id' => $warehouse?->id,
                    'manufactured_at' => $fields['manufactured_at'] ?? null,
                    'expires_at' => $fields['expires_at'] ?? null,
                    'quantity' => (int) ($fields['quantity'] ?? 0),
                    'status' => $fields['status'] ?? 'active',
                ],
            );

            InventoryTransaction::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse?->id,
                'type' => 'batch_registered',
                'quantity' => (int) $batch->quantity,
                'quantity_after' => (int) $batch->quantity,
                'reference_type' => 'batch',
                'reference_no' => $batch->batch_no,
                'reason' => 'Batch traceability record registered',
                'created_by' => $request->user()->id,
            ]);
        });

        return $this->traceabilityResponse($request, 'Batch record saved.');
    }

    private function storeSerial(Request $request, Product $product, ?Warehouse $warehouse, array $fields)
    {
        $request->validate([
            'serial_no' => 'required|string|max:160|unique:inventory_serial_numbers,serial_no',
        ]);

        $batchId = $fields['inventory_batch_id'] ?? null;

        if ($batchId) {
            InventoryBatch::where('product_id', $product->id)->findOrFail($batchId);
        }

        DB::transaction(function () use ($fields, $product, $warehouse, $batchId, $request) {
            InventorySerialNumber::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse?->id,
                'inventory_batch_id' => $batchId,
                'serial_no' => $fields['serial_no'],
                'status' => $fields['status'] ?? 'available',
            ]);

            InventoryTransaction::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse?->id,
                'type' => 'serial_registered',
                'quantity' => 1,
                'quantity_after' => 1,
                'reference_type' => 'serial_number',
                'reference_no' => $fields['serial_no'],
                'reason' => 'Serial traceability record registered',
                'created_by' => $request->user()->id,
            ]);
        });

        return $this->traceabilityResponse($request, 'Serial number saved.');
    }

    private function traceabilityResponse(Request $request, string $message)
    {
        if ($request->header('X-Inertia')) {
            return back()->with('success', $message);
        }

        return response(['message' => $message], 201);
    }
}
