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
            $table->json('fulfillment_channels')->nullable()->after('gst_number');
            $table->string('default_fulfillment_channel')->nullable()->after('fulfillment_channels');
            $table->string('shipping_acceptance_time')->nullable()->after('default_fulfillment_channel');
            $table->unsignedTinyInteger('handling_time_business_days')->default(1)->after('shipping_acceptance_time');
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
            $table->string('fulfillment_channel')->nullable()->after('tracking_url');
            $table->string('seller_shipping_acceptance_time')->nullable()->after('fulfillment_channel');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'gst_number',
                'fulfillment_channels',
                'default_fulfillment_channel',
                'shipping_acceptance_time',
                'handling_time_business_days',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'buyer_phone', 'country', 'city', 'state', 'postal_code', 
                'company_name', 'buyer_gstin', 'cgst', 'sgst', 'igst', 
                'invoice_number', 'shipping_label_url', 'tracking_url',
                'fulfillment_channel', 'seller_shipping_acceptance_time'
            ]);
        });
    }
};
