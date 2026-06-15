<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('warehouse_product', function (Blueprint $table) {
            $table->integer('reserved_quantity')->default(0)->after('quantity');
            $table->integer('available_quantity')->default(0)->after('reserved_quantity');
            $table->integer('safety_stock')->default(0)->after('available_quantity');
            $table->unsignedBigInteger('warehouse_bin_id')->nullable()->after('bin_location')->index();
            $table->decimal('unit_cost', 12, 2)->nullable()->after('warehouse_bin_id');
            $table->string('stock_status')->default('available')->after('unit_cost');
        });

        DB::table('warehouse_product')->update([
            'available_quantity' => DB::raw('quantity'),
            'stock_status' => DB::raw("CASE WHEN quantity > 0 THEN 'available' ELSE 'out_of_stock' END"),
        ]);

        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('warehouse_bin_id')->nullable()->constrained('warehouse_bins')->nullOnDelete();
            $table->foreignId('from_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('to_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->string('type');
            $table->integer('quantity');
            $table->integer('quantity_after')->default(0);
            $table->string('reference_type')->nullable();
            $table->string('reference_no')->nullable();
            $table->string('reason')->nullable();
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['product_id', 'warehouse_id']);
            $table->index(['type', 'created_at']);
        });

        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('adjustment_no')->unique();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('warehouse_bin_id')->nullable()->constrained('warehouse_bins')->nullOnDelete();
            $table->integer('system_quantity')->default(0);
            $table->integer('counted_quantity')->default(0);
            $table->integer('variance_quantity')->default(0);
            $table->string('reason')->nullable();
            $table->string('status')->default('posted');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('inventory_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('quantity');
            $table->string('status')->default('reserved');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->string('batch_no');
            $table->date('manufactured_at')->nullable();
            $table->date('expires_at')->nullable();
            $table->integer('quantity')->default(0);
            $table->string('status')->default('active');
            $table->timestamps();
            $table->unique(['product_id', 'batch_no']);
        });

        Schema::create('inventory_serial_numbers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('inventory_batch_id')->nullable()->constrained('inventory_batches')->nullOnDelete();
            $table->string('serial_no')->unique();
            $table->string('status')->default('available');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_serial_numbers');
        Schema::dropIfExists('inventory_batches');
        Schema::dropIfExists('inventory_reservations');
        Schema::dropIfExists('inventory_adjustments');
        Schema::dropIfExists('inventory_transactions');

        Schema::table('warehouse_product', function (Blueprint $table) {
            $table->dropIndex(['warehouse_bin_id']);
            $table->dropColumn('warehouse_bin_id');
            $table->dropColumn([
                'reserved_quantity',
                'available_quantity',
                'safety_stock',
                'unit_cost',
                'stock_status',
            ]);
        });
    }
};
