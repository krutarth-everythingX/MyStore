<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('handle')->unique();
            $table->longText('description')->nullable();
            $table->boolean('active')->default(true);
            $table->string('type')->default('manual');
            $table->json('channels')->nullable();
            $table->string('template')->default('Product grid');
            $table->string('image')->nullable();
            $table->string('condition_mode')->default('any');
            $table->json('conditions')->nullable();
            $table->json('product_ids')->nullable();
            $table->string('seo_title')->nullable();
            $table->longText('seo_description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collections');
    }
};
