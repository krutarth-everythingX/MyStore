<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'price_currency')) {
                $table->string('price_currency', 3)->default('INR')->after('sale_price');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'currency')) {
                $table->string('currency', 3)->default('INR')->after('total_amount');
            }
            if (! Schema::hasColumn('orders', 'timezone')) {
                $table->string('timezone')->default('UTC')->after('currency');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (! Schema::hasColumn('order_items', 'currency')) {
                $table->string('currency', 3)->default('INR')->after('price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasColumn('order_items', 'currency')) {
                $table->dropColumn('currency');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'timezone')) {
                $table->dropColumn('timezone');
            }
            if (Schema::hasColumn('orders', 'currency')) {
                $table->dropColumn('currency');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'price_currency')) {
                $table->dropColumn('price_currency');
            }
        });
    }
};
