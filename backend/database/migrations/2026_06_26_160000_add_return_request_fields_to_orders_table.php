<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'return_request_status')) {
                $table->string('return_request_status')->nullable()->after('refund_status');
            }
            if (! Schema::hasColumn('orders', 'return_request_reason')) {
                $table->string('return_request_reason')->nullable()->after('return_request_status');
            }
            if (! Schema::hasColumn('orders', 'return_request_note')) {
                $table->text('return_request_note')->nullable()->after('return_request_reason');
            }
            if (! Schema::hasColumn('orders', 'return_request_image_url')) {
                $table->text('return_request_image_url')->nullable()->after('return_request_note');
            }
            if (! Schema::hasColumn('orders', 'return_requested_at')) {
                $table->timestamp('return_requested_at')->nullable()->after('return_request_image_url');
            }
            if (! Schema::hasColumn('orders', 'return_reviewed_at')) {
                $table->timestamp('return_reviewed_at')->nullable()->after('return_requested_at');
            }
            if (! Schema::hasColumn('orders', 'return_review_note')) {
                $table->text('return_review_note')->nullable()->after('return_reviewed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $columns = [
                'return_request_status',
                'return_request_reason',
                'return_request_note',
                'return_request_image_url',
                'return_requested_at',
                'return_reviewed_at',
                'return_review_note',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
