<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('stripe_payment_intent_id')->nullable()->after('payment_method');
            $table->decimal('shipping_cost', 10, 2)->default(0.00)->after('stripe_payment_intent_id');
            $table->decimal('discount_amount', 10, 2)->default(0.00)->after('shipping_cost');
            $table->string('refund_status')->nullable()->after('status'); // null, requested, refunded
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['stripe_payment_intent_id', 'shipping_cost', 'discount_amount', 'refund_status']);
        });
    }
};
