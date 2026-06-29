<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->select('id', 'role', 'customer_id', 'seller_id')
            ->chunkById(100, function ($users): void {
                foreach ($users as $user) {
                    $updates = [];

                    if ($user->role === 'seller' && ! $this->matchesSellerFormat($user->seller_id)) {
                        $updates['seller_id'] = $this->generateUniqueIdentifier('seller_id', 'S-');
                    }

                    if ($user->role !== 'seller' && ! $this->matchesBuyerFormat($user->customer_id)) {
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

    public function down(): void
    {
        // Historical IDs cannot be restored deterministically.
    }

    private function matchesBuyerFormat(?string $identifier): bool
    {
        return is_string($identifier) && preg_match('/^B-(?:[1-9][A-Z]){6}$/', $identifier) === 1;
    }

    private function matchesSellerFormat(?string $identifier): bool
    {
        return is_string($identifier) && preg_match('/^S-(?:[1-9][A-Z]){6}$/', $identifier) === 1;
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
