<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('gst_number')->nullable()->after('address');
            $table->string('shiprocket_email')->nullable()->after('gst_number');
            $table->string('shiprocket_password')->nullable()->after('shiprocket_email');
            $table->text('shiprocket_token')->nullable()->after('shiprocket_password');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('weight_kg', 8, 2)->default(0.5)->after('sku');
            $table->decimal('length_cm', 8, 2)->nullable()->after('weight_kg');
            $table->decimal('width_cm', 8, 2)->nullable()->after('length_cm');
            $table->decimal('height_cm', 8, 2)->nullable()->after('width_cm');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('buyer_phone')->nullable()->after('buyer_id');
            $table->string('country')->default('India')->after('shipping_address');
            $table->string('city')->nullable()->after('country');
            $table->string('state')->nullable()->after('city');
            $table->string('postal_code')->nullable()->after('state');
            $table->string('company_name')->nullable()->after('postal_code');
            $table->string('buyer_gstin')->nullable()->after('company_name');
            $table->decimal('cgst', 10, 2)->default(0.00)->after('shipping_cost');
            $table->decimal('sgst', 10, 2)->default(0.00)->after('cgst');
            $table->decimal('igst', 10, 2)->default(0.00)->after('sgst');
            $table->string('invoice_number')->nullable()->after('igst');
            $table->text('shipping_label_url')->nullable()->after('invoice_number');
            $table->text('tracking_url')->nullable()->after('shipping_label_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['gst_number', 'shiprocket_email', 'shiprocket_password', 'shiprocket_token']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['weight_kg', 'length_cm', 'width_cm', 'height_cm']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'buyer_phone', 'country', 'city', 'state', 'postal_code', 
                'company_name', 'buyer_gstin', 'cgst', 'sgst', 'igst', 
                'invoice_number', 'shipping_label_url', 'tracking_url'
            ]);
        });
    }
};
