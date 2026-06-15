<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouse_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('name');
            $table->string('type')->default('storage');
            $table->unsignedInteger('capacity_units')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->unique(['warehouse_id', 'code']);
        });

        Schema::create('warehouse_aisles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_zone_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('name')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['warehouse_zone_id', 'code']);
        });

        Schema::create('warehouse_racks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_aisle_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('name')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['warehouse_aisle_id', 'code']);
        });

        Schema::create('warehouse_shelves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_rack_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('name')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['warehouse_rack_id', 'code']);
        });

        Schema::create('warehouse_bins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_shelf_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('name')->nullable();
            $table->string('type')->default('pick');
            $table->unsignedInteger('capacity_units')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->unique(['warehouse_shelf_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouse_bins');
        Schema::dropIfExists('warehouse_shelves');
        Schema::dropIfExists('warehouse_racks');
        Schema::dropIfExists('warehouse_aisles');
        Schema::dropIfExists('warehouse_zones');
    }
};
