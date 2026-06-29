<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('account_deletion_requested_at')->nullable()->after('phone_verification_code_sent_at');
            $table->timestamp('account_deletion_scheduled_for')->nullable()->after('account_deletion_requested_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'account_deletion_requested_at',
                'account_deletion_scheduled_for',
            ]);
        });
    }
};
