<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('grouped_product_ids')->nullable()->after('tags');
            $table->string('external_url')->nullable()->after('grouped_product_ids');
            $table->string('external_button_text')->nullable()->after('external_url');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['grouped_product_ids', 'external_url', 'external_button_text']);
        });
    }
};
