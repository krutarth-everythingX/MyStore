<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('warehouses', function (Blueprint $table) {
            $table->string('type')->default('fulfillment')->after('code');
            $table->string('status')->default('active')->after('default_carrier');
            $table->string('country')->nullable()->after('postal_code');
            $table->string('timezone')->nullable()->after('country');
            $table->json('working_hours')->nullable()->after('timezone');
            $table->unsignedInteger('capacity_units')->nullable()->after('working_hours');
            $table->text('notes')->nullable()->after('capacity_units');
        });
    }

    public function down(): void
    {
        Schema::table('warehouses', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'status',
                'country',
                'timezone',
                'working_hours',
                'capacity_units',
                'notes',
            ]);
        });
    }
};
