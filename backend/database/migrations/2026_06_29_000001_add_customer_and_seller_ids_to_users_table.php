<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('customer_id')->nullable()->after('role');
            $table->string('seller_id')->nullable()->after('customer_id');
        });

        $this->backfillIdentifiers();

        Schema::table('users', function (Blueprint $table) {
            $table->unique('customer_id');
            $table->unique('seller_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['customer_id']);
            $table->dropUnique(['seller_id']);
            $table->dropColumn(['customer_id', 'seller_id']);
        });
    }

    private function backfillIdentifiers(): void
    {
        DB::table('users')
            ->select('id', 'role', 'customer_id', 'seller_id')
            ->chunkById(100, function ($users): void {
                foreach ($users as $user) {
                    $updates = [];

                    if ($user->role === 'seller' && ! $user->seller_id) {
                        $updates['seller_id'] = $this->generateUniqueIdentifier('seller_id', 'S-');
                    }

                    if ($user->role !== 'seller' && ! $user->customer_id) {
                        $updates['customer_id'] = $this->generateUniqueIdentifier('customer_id', 'B-');
                    }

                    if ($updates !== []) {
                        DB::table('users')
                            ->where('id', $user->id)
                            ->update($updates);
                    }
                }
            });
    }

    private function generateUniqueIdentifier(string $column, string $prefix): string
    {
        do {
            $identifier = $this->buildIdentifier($prefix);
        } while (DB::table('users')->where($column, $identifier)->exists());

        return $identifier;
    }

    private function buildIdentifier(string $prefix): string
    {
        $digits = '';
        $letters = '';

        for ($index = 0; $index < 6; $index++) {
            $digits .= (string) random_int(1, 9);
            $letters .= chr(random_int(65, 90));
        }

        $identifier = $prefix;

        for ($index = 0; $index < 6; $index++) {
            $identifier .= $digits[$index] . $letters[$index];
        }

        return $identifier;
    }
};
