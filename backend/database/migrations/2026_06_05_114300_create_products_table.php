<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Seller ID
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('short_description')->nullable();
            $table->string('status')->default('published'); // draft, published, pending
            $table->string('featured_image')->nullable();
            $table->json('gallery_images')->nullable();
            $table->decimal('regular_price', 10, 2);
            $table->decimal('sale_price', 10, 2)->nullable();
            $table->string('tax_status')->default('taxable'); // taxable, shipping, none
            $table->string('tax_class')->default('standard');
            $table->string('sku')->nullable();
            $table->boolean('manage_stock')->default(false);
            $table->integer('stock_quantity')->default(0);
            $table->string('stock_status')->default('instock'); // instock, outofstock, onbackorder
            $table->integer('low_stock_amount')->default(2);
            $table->boolean('sold_individually')->default(false);
            $table->decimal('weight', 8, 2)->nullable();
            $table->decimal('length', 8, 2)->nullable();
            $table->decimal('width', 8, 2)->nullable();
            $table->decimal('height', 8, 2)->nullable();
            $table->string('shipping_class')->nullable();
            $table->json('attributes')->nullable(); // json attribute options
            $table->text('purchase_note')->nullable();
            $table->integer('menu_order')->default(0);
            $table->boolean('enable_reviews')->default(true);
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->json('tags')->nullable();
            $table->string('type')->default('simple'); // simple, variable, variation
            $table->foreignId('parent_id')->nullable()->constrained('products')->cascadeOnDelete(); // for variation types
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
