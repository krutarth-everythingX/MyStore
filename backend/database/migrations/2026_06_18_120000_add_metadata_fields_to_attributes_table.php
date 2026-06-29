<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attributes', function (Blueprint $table) {
            $table->string('applies_to')->default('product')->after('name');
            $table->string('input_type')->default('dropdown')->after('applies_to');
            $table->boolean('is_required')->default(false)->after('options');
            $table->boolean('is_active')->default(true)->after('is_required');
        });
    }

    public function down(): void
    {
        Schema::table('attributes', function (Blueprint $table) {
            $table->dropColumn([
                'applies_to',
                'input_type',
                'is_required',
                'is_active',
            ]);
        });
    }
};
