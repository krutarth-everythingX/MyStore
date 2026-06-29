<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MarketplaceDemoSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        try {
            $this->wipeMarketplaceData();
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $this->call([
            SellerDemoSeeder::class,
            SellerCatalogDetailsSeeder::class,
            DemoCollectionsSeeder::class,
            OrderDemoSeeder::class,
        ]);
    }

    private function wipeMarketplaceData(): void
    {
        foreach ($this->commerceTables() as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->delete();
            }
        }

        if (Schema::hasTable('users')) {
            DB::table('users')
                ->whereIn('role', ['seller', 'buyer'])
                ->delete();
        }
    }

    private function commerceTables(): array
    {
        return [
            'inventory_serial_numbers',
            'inventory_batches',
            'inventory_reservations',
            'inventory_adjustments',
            'inventory_transactions',
            'order_items',
            'orders',
            'wishlists',
            'recently_viewed',
            'reviews',
            'collections',
            'attributes',
            'warehouse_product',
            'category_product',
            'warehouse_bins',
            'warehouse_shelves',
            'warehouse_racks',
            'warehouse_aisles',
            'warehouse_zones',
            'products',
            'warehouses',
            'categories',
            'brands',
            'coupons',
        ];
    }
}
