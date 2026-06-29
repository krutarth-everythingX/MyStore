<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\InventoryBatch;
use App\Models\InventorySerialNumber;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\SellerVerification;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseAisle;
use App\Models\WarehouseBin;
use App\Models\WarehouseRack;
use App\Models\WarehouseShelf;
use App\Models\WarehouseZone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SellerDemoSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        try {
            $this->deleteSellerData();
            $this->createSellers();
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    private function deleteSellerData(): void
    {
        $demoSellerEmails = collect($this->sellerCatalog())->pluck('email')->all();
        $sellerIds = User::where('role', 'seller')
            ->orWhereIn('email', $demoSellerEmails)
            ->pluck('id');

        if ($sellerIds->isEmpty()) {
            return;
        }

        $productIds = Product::whereIn('user_id', $sellerIds)->pluck('id');
        $warehouseIds = Warehouse::whereIn('user_id', $sellerIds)->pluck('id');
        $categoryIds = Category::whereIn('user_id', $sellerIds)->pluck('id');

        $this->deleteFromTable('order_items', 'seller_id', $sellerIds);

        if ($productIds->isNotEmpty()) {
            $this->deleteFromTable('reviews', 'product_id', $productIds);
            $this->deleteFromTable('wishlists', 'product_id', $productIds);
            $this->deleteFromTable('recently_viewed', 'product_id', $productIds);
            $this->deleteFromTable('inventory_serial_numbers', 'product_id', $productIds);
            $this->deleteFromTable('inventory_batches', 'product_id', $productIds);
            $this->deleteFromTable('inventory_reservations', 'product_id', $productIds);
            $this->deleteFromTable('inventory_adjustments', 'product_id', $productIds);
            $this->deleteFromTable('inventory_transactions', 'product_id', $productIds);
            $this->deleteFromTable('category_product', 'product_id', $productIds);
            $this->deleteFromTable('warehouse_product', 'product_id', $productIds);
        }

        if ($categoryIds->isNotEmpty()) {
            $this->deleteFromTable('category_product', 'category_id', $categoryIds);
        }

        if ($warehouseIds->isNotEmpty()) {
            $this->deleteFromTable('warehouse_product', 'warehouse_id', $warehouseIds);
            $this->deleteFromTable('inventory_transactions', 'warehouse_id', $warehouseIds);
            $this->deleteFromTable('inventory_transactions', 'from_warehouse_id', $warehouseIds);
            $this->deleteFromTable('inventory_transactions', 'to_warehouse_id', $warehouseIds);
            $this->deleteFromTable('inventory_adjustments', 'warehouse_id', $warehouseIds);
            $this->deleteFromTable('inventory_reservations', 'warehouse_id', $warehouseIds);
            $this->deleteFromTable('inventory_batches', 'warehouse_id', $warehouseIds);
            $this->deleteFromTable('inventory_serial_numbers', 'warehouse_id', $warehouseIds);
            $this->deleteWarehouseHierarchy($warehouseIds);
        }

        Product::whereIn('user_id', $sellerIds)->delete();
        Category::whereIn('user_id', $sellerIds)->delete();
        Warehouse::whereIn('user_id', $sellerIds)->delete();
        Brand::whereIn('user_id', $sellerIds)->delete();
        $this->deleteFromTable('seller_verifications', 'user_id', $sellerIds);
        $this->deleteFromTable('attributes', 'user_id', $sellerIds);
        $this->deleteFromTable('collections', 'user_id', $sellerIds);
        DB::table('users')->whereIn('id', $sellerIds)->delete();
    }

    private function deleteWarehouseHierarchy($warehouseIds): void
    {
        if (!Schema::hasTable('warehouse_zones')) {
            return;
        }

        $zoneIds = WarehouseZone::whereIn('warehouse_id', $warehouseIds)->pluck('id');
        $aisleIds = WarehouseAisle::whereIn('warehouse_zone_id', $zoneIds)->pluck('id');
        $rackIds = WarehouseRack::whereIn('warehouse_aisle_id', $aisleIds)->pluck('id');
        $shelfIds = WarehouseShelf::whereIn('warehouse_rack_id', $rackIds)->pluck('id');

        if ($shelfIds->isNotEmpty()) {
            WarehouseBin::whereIn('warehouse_shelf_id', $shelfIds)->delete();
        }

        if ($rackIds->isNotEmpty()) {
            WarehouseShelf::whereIn('warehouse_rack_id', $rackIds)->delete();
        }

        if ($aisleIds->isNotEmpty()) {
            WarehouseRack::whereIn('warehouse_aisle_id', $aisleIds)->delete();
        }

        if ($zoneIds->isNotEmpty()) {
            WarehouseAisle::whereIn('warehouse_zone_id', $zoneIds)->delete();
            WarehouseZone::whereIn('id', $zoneIds)->delete();
        }
    }

    private function deleteFromTable(string $table, string $column, $ids): void
    {
        if (!Schema::hasTable($table) || $ids->isEmpty()) {
            return;
        }

        DB::table($table)->whereIn($column, $ids)->delete();
    }

    private function createSellers(): void
    {
        foreach ($this->sellerCatalog() as $sellerIndex => $sellerData) {
            $seller = User::create([
                'name' => $sellerData['owner'],
                'email' => $sellerData['email'],
                'email_verified_at' => now(),
                'phone' => $sellerData['phone'],
                'country_code' => '+91',
                'phone_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'seller',
                'brand_name' => $sellerData['store'],
                'gst_number' => $sellerData['gst_number'],
                'address' => $sellerData['address'],
                'city' => $sellerData['city'],
                'state' => $sellerData['state'],
                'country' => 'India',
                'pincode' => $sellerData['pincode'],
                'fulfillment_channels' => $sellerData['fulfillment_channels'],
                'default_fulfillment_channel' => $sellerData['default_fulfillment_channel'],
                'shipping_acceptance_time' => $sellerData['shipping_acceptance_time'],
                'handling_time_business_days' => $sellerData['handling_days'],
                'seller_settings' => SeederSupport::defaultSellerSettings([
                    'secondaryPhone' => $sellerData['phone'],
                    'storeDescription' => $sellerData['business_type'] . ' storefront for ' . $sellerData['primary_category'] . ' buyers across India.',
                    'businessType' => 'Sole Proprietorship',
                    'panNumber' => $sellerData['pan_number'] ?? ('PAN' . str_pad((string) ($sellerIndex + 1), 6, '0', STR_PAD_LEFT)),
                    'registrationNumber' => $sellerData['registration_number'] ?? ('REG-' . str_pad((string) ($sellerIndex + 1), 5, '0', STR_PAD_LEFT)),
                    'addressLine1' => $sellerData['address'],
                    'addressLine2' => $sellerData['warehouse_address'],
                    'city' => $sellerData['city'],
                    'state' => $sellerData['state'],
                    'pickupCountry' => 'India',
                    'pincode' => $sellerData['pincode'],
                    'accountHolderName' => $sellerData['owner'],
                    'bankName' => $sellerData['bank_name'] ?? 'State Bank of India',
                    'accountNumber' => $sellerData['account_number'] ?? ('1002003004' . str_pad((string) ($sellerIndex + 1), 3, '0', STR_PAD_LEFT)),
                    'ifscCode' => $sellerData['ifsc_code'] ?? ('SBIN000' . str_pad((string) ($sellerIndex + 1), 4, '0', STR_PAD_LEFT)),
                    'upiId' => $sellerData['upi_id'] ?? ('seller' . ($sellerIndex + 1) . '@okaxis'),
                    'gstRegistered' => true,
                    'freeShippingAbove' => (string) ($sellerData['free_shipping_above'] ?? 1499),
                    'packageWeight' => (string) ($sellerData['default_package_weight'] ?? 0.5),
                    'packageLength' => (string) ($sellerData['default_package_length'] ?? 20),
                    'packageWidth' => (string) ($sellerData['default_package_width'] ?? 15),
                    'packageHeight' => (string) ($sellerData['default_package_height'] ?? 10),
                    'weightUnit' => 'Kg',
                    'returnWindow' => $sellerData['return_window'] ?? '15 Days',
                    'acceptReturns' => $sellerData['accept_returns'] ?? true,
                    'orderEmail' => true,
                    'orderSms' => true,
                    'orderWhatsapp' => true,
                    'promotionalEmails' => false,
                    'storeStatus' => 'Active',
                ]),
            ]);

            $this->createSellerVerification($seller, $sellerData, $sellerIndex);

            $brand = Brand::create([
                'user_id' => $seller->id,
                'name' => $sellerData['brand'],
                'slug' => $this->uniqueSlug($sellerData['brand'], $sellerIndex),
                'logo' => null,
            ]);

            $warehouse = Warehouse::create([
                'user_id' => $seller->id,
                'name' => $sellerData['warehouse_name'],
                'code' => $sellerData['warehouse_code'],
                'type' => $sellerData['warehouse_type'],
                'address' => $sellerData['warehouse_address'],
                'city' => $sellerData['city'],
                'state' => $sellerData['state'],
                'postal_code' => $sellerData['pincode'],
                'country' => 'India',
                'timezone' => 'Asia/Kolkata',
                'working_hours' => [
                    'monday_friday' => '09:00-18:00',
                    'saturday' => '10:00-15:00',
                ],
                'capacity_units' => $sellerData['warehouse_capacity'],
                'notes' => $sellerData['business_type'] . ' seller warehouse for ' . $sellerData['primary_category'],
                'default_carrier' => $sellerData['default_fulfillment_channel'],
                'status' => 'active',
            ]);

            $bin = $this->createWarehousePath($warehouse, $sellerIndex);
            $parentCategory = $this->createCategory($seller, $sellerData['primary_category']);

            $childCategories = [];
            foreach ($sellerData['categories'] as $categoryName => $products) {
                $childCategories[$categoryName] = $this->createCategory($seller, $categoryName, $parentCategory);

                foreach ($products as $productIndex => $productData) {
                    $this->createProduct(
                        seller: $seller,
                        brand: $brand,
                        warehouse: $warehouse,
                        bin: $bin,
                        categories: [$parentCategory, $childCategories[$categoryName]],
                        businessType: $sellerData['business_type'],
                        productData: $productData,
                        productIndex: $productIndex,
                    );
                }
            }
        }
    }

    private function createSellerVerification(User $seller, array $sellerData, int $sellerIndex): void
    {
        $status = $sellerData['verification_status'] ?? 'approved';
        $taxId = $sellerData['gst_number'] ?? null;
        $panNumber = $sellerData['pan_number'] ?? ('PAN' . str_pad((string) ($sellerIndex + 1), 6, '0', STR_PAD_LEFT));
        $registrationNumber = $sellerData['registration_number'] ?? ('REG-' . str_pad((string) ($sellerIndex + 1), 5, '0', STR_PAD_LEFT));
        $defaultDocsBase = '/demo-documents/' . Str::slug($sellerData['store'] ?? $sellerData['owner']) . '-' . ($sellerIndex + 1);

        SellerVerification::create([
            'user_id' => $seller->id,
            'status' => $status,
            'business_type' => 'Sole Proprietorship',
            'legal_name' => $sellerData['store'],
            'tax_id' => $taxId,
            'pan_number' => $panNumber,
            'registration_number' => $registrationNumber,
            'contact_person_name' => $sellerData['owner'],
            'contact_person_id_type' => 'Passport',
            'contact_person_id_number' => 'ID' . str_pad((string) ($sellerIndex + 1), 8, '0', STR_PAD_LEFT),
            'bank_account_holder_name' => $sellerData['owner'],
            'bank_name' => $sellerData['bank_name'] ?? 'State Bank of India',
            'bank_account_number' => $sellerData['account_number'] ?? ('1002003004' . str_pad((string) ($sellerIndex + 1), 3, '0', STR_PAD_LEFT)),
            'bank_ifsc_code' => $sellerData['ifsc_code'] ?? ('SBIN000' . str_pad((string) ($sellerIndex + 1), 4, '0', STR_PAD_LEFT)),
            'business_address' => $sellerData['address'],
            'business_city' => $sellerData['city'],
            'business_state' => $sellerData['state'],
            'business_country' => 'India',
            'business_postal_code' => $sellerData['pincode'],
            'gst_certificate_url' => $defaultDocsBase . '-gst.pdf',
            'pan_card_url' => $defaultDocsBase . '-pan.pdf',
            'business_registration_url' => $defaultDocsBase . '-registration.pdf',
            'address_proof_url' => $defaultDocsBase . '-address.pdf',
            'bank_proof_url' => $defaultDocsBase . '-bank.pdf',
            'identity_document_url' => $defaultDocsBase . '-identity.pdf',
            'risk_flags' => [],
            'submission_note' => $status === 'approved'
                ? 'Approved demo seller for workspace access.'
                : 'Pending demo seller for onboarding-only access.',
            'review_note' => $status === 'approved'
                ? 'Approved for demo workspace access.'
                : null,
            'submitted_at' => now()->subDay(),
            'reviewed_at' => $status === 'approved' ? now()->subHours(12) : null,
        ]);
    }

    private function createWarehousePath(Warehouse $warehouse, int $index): WarehouseBin
    {
        $zone = WarehouseZone::create([
            'warehouse_id' => $warehouse->id,
            'code' => 'Z-' . str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
            'name' => 'Primary Pick Zone',
            'type' => 'pick_face',
            'capacity_units' => 5000,
            'status' => 'active',
        ]);

        $aisle = WarehouseAisle::create([
            'warehouse_zone_id' => $zone->id,
            'code' => 'A-01',
            'name' => 'Main Aisle',
            'sort_order' => 1,
        ]);

        $rack = WarehouseRack::create([
            'warehouse_aisle_id' => $aisle->id,
            'code' => 'R-01',
            'name' => 'Fast Moving Rack',
            'sort_order' => 1,
        ]);

        $shelf = WarehouseShelf::create([
            'warehouse_rack_id' => $rack->id,
            'code' => 'S-01',
            'name' => 'Front Shelf',
            'sort_order' => 1,
        ]);

        return WarehouseBin::create([
            'warehouse_shelf_id' => $shelf->id,
            'code' => 'BIN-' . str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
            'name' => 'Default Pick Bin',
            'type' => 'pick',
            'capacity_units' => 750,
            'status' => 'active',
        ]);
    }

    private function createCategory(User $seller, string $name, ?Category $parent = null): Category
    {
        return Category::create([
            'user_id' => $seller->id,
            'name' => $name,
            'slug' => $this->uniqueSlug($name, $seller->id . '-' . ($parent?->id ?: 'root')),
            'parent_id' => $parent?->id,
            'type' => 'product',
            'description' => $name . ' catalog grouping for ' . ($seller->brand_name ?: $seller->name) . '.',
            'image' => '/demo-products/' . Str::slug($name) . '.svg',
            'is_active' => true,
        ]);
    }

    private function createProduct(
        User $seller,
        Brand $brand,
        Warehouse $warehouse,
        WarehouseBin $bin,
        array $categories,
        string $businessType,
        array $productData,
        int $productIndex,
    ): Product {
        $quantity = $productData['stock'];
        $safetyStock = max(3, (int) floor($quantity * 0.12));
        $unitCost = round($productData['regular_price'] * 0.56, 2);

        $product = Product::create([
            'user_id' => $seller->id,
            'brand_id' => $brand->id,
            'name' => $productData['name'],
            'slug' => $this->uniqueSlug($productData['name'], $seller->id . '-' . $productIndex),
            'description' => $productData['description'],
            'short_description' => $productData['short_description'],
            'status' => 'published',
            'featured_image' => $productData['image'],
            'gallery_images' => $productData['gallery'],
            'manufacturer' => $productData['manufacturer'] ?? $brand->name,
            'model_number' => $productData['model_number'] ?? null,
            'country_of_origin' => $seller->country,
            'product_type' => $productData['product_type'],
            'product_type_keyword' => implode(', ', $productData['seo_terms']),
            'target_gender' => $productData['target_gender'] ?? 'Unisex',
            'recommended_age' => $productData['recommended_age'] ?? '12 years and up',
            'condition' => 'new',
            'fulfillment_channel' => $seller->default_fulfillment_channel,
            'regular_price' => $productData['regular_price'],
            'sale_price' => $productData['sale_price'],
            'price_currency' => 'INR',
            'sku' => $productData['sku'],
            'manage_stock' => true,
            'stock_quantity' => $quantity,
            'stock_status' => 'instock',
            'low_stock_amount' => $safetyStock,
            'weight_kg' => $productData['weight_kg'],
            'length_cm' => $productData['length_cm'],
            'width_cm' => $productData['width_cm'],
            'height_cm' => $productData['height_cm'],
            'package_weight_kg' => $productData['package_weight_kg'],
            'package_length_cm' => $productData['package_length_cm'],
            'package_width_cm' => $productData['package_width_cm'],
            'package_height_cm' => $productData['package_height_cm'],
            'shipping_class' => $productData['shipping_class'] ?? 'standard',
            'attributes' => $productData['attributes'] ?? null,
            'bullet_points' => [
                ['title' => 'Description', 'value' => $productData['short_description']],
                ['title' => 'Business Type', 'value' => $businessType],
                ['title' => 'Warranty', 'value' => $productData['warranty'] ?? 'Seller warranty and support available.'],
            ],
            'safety_compliance' => $productData['safety_compliance'] ?? [
                'certifications' => 'Seller verified',
                'warnings' => '',
                'batteries' => '',
                'compliance_marks' => '',
            ],
            'seo_search_terms' => $productData['seo_terms'],
            'whats_inside_box' => $productData['box'],
            'menu_order' => $productIndex,
            'enable_reviews' => true,
            'tags' => $productData['seo_terms'],
            'type' => $productData['type'] ?? 'simple',
        ]);

        $product->categories()->attach(collect($categories)->pluck('id')->all());
        $product->warehouses()->attach($warehouse->id, [
            'quantity' => $quantity,
            'reserved_quantity' => 0,
            'available_quantity' => $quantity,
            'safety_stock' => $safetyStock,
            'bin_location' => 'Z-01/A-01/R-01/S-01/' . $bin->code,
            'warehouse_bin_id' => $bin->id,
            'unit_cost' => $unitCost,
            'stock_status' => 'available',
        ]);

        InventoryTransaction::create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'warehouse_bin_id' => $bin->id,
            'type' => 'opening_stock',
            'quantity' => $quantity,
            'quantity_after' => $quantity,
            'reference_type' => 'seller_demo_seed',
            'reference_no' => 'OPEN-' . $product->sku,
            'reason' => 'Opening seller demo inventory',
            'unit_cost' => $unitCost,
            'created_by' => $seller->id,
        ]);

        if (($productData['traceability'] ?? null) === 'batch') {
            InventoryBatch::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'batch_no' => 'LOT-' . strtoupper(Str::slug($product->sku, '')),
                'manufactured_at' => now()->subMonths(2)->toDateString(),
                'expires_at' => now()->addMonths(14)->toDateString(),
                'quantity' => $quantity,
                'status' => 'active',
            ]);
        }

        if (($productData['traceability'] ?? null) === 'serial') {
            InventorySerialNumber::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'serial_no' => 'SN-' . strtoupper(Str::slug($product->sku, '')) . '-001',
                'status' => 'available',
            ]);
        }

        return $product;
    }

    private function uniqueSlug(string $value, string|int $suffix): string
    {
        return Str::slug($value) . '-' . Str::lower((string) $suffix);
    }

    private function sellerCatalog(): array
    {
        return [
            [
                'business_type' => 'Automotive accessories supplier',
                'primary_category' => 'Automotive',
                'owner' => 'Arjun Nair',
                'email' => 'seller.auto@mystore.test',
                'verification_status' => 'approved',
                'phone' => '9876500111',
                'store' => 'AutoPulse Garage',
                'brand' => 'AutoPulse',
                'gst_number' => '27AAPCA7788R1Z8',
                'address' => '29 Pimpri Auto Parts Lane',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'pincode' => '411018',
                'warehouse_name' => 'AutoPulse Pune Warehouse',
                'warehouse_code' => 'WH-APG-PUN-01',
                'warehouse_type' => 'fulfillment',
                'warehouse_address' => 'Shed 8, Chakan Industrial Logistics',
                'warehouse_capacity' => 15000,
                'fulfillment_channels' => ['Seller Fulfilled', 'Blue Dart Surface', 'Marketplace Managed'],
                'default_fulfillment_channel' => 'Blue Dart Surface',
                'shipping_acceptance_time' => '5 hours',
                'handling_days' => 2,
                'categories' => [
                    'Car Accessories' => [
                        $this->product('AutoPulse All Weather Car Floor Mats', 'AP-MAT-AW4', 'Car Floor Mats', 1899, 1499, 86, 3.4, [72, 48, 8], [76, 52, 12], ['car mats', 'floor mats', 'automotive']),
                        $this->product('AutoPulse Magnetic Phone Mount', 'AP-MOUNT-MAG', 'Car Phone Mount', 599, 449, 180, 0.2, [10, 8, 6], [14, 12, 8], ['phone mount', 'car accessory', 'magnetic mount']),
                        $this->product('AutoPulse Memory Foam Neck Pillow', 'AP-PILLOW-NECK', 'Car Neck Pillow', 799, 649, 110, 0.45, [28, 18, 10], [32, 22, 13], ['car pillow', 'neck pillow', 'automotive comfort']),
                    ],
                    'Bike Accessories' => [
                        $this->product('AutoPulse Waterproof Bike Cover', 'AP-BIKE-COVER', 'Bike Cover', 999, 799, 120, 0.9, [32, 24, 6], [36, 28, 9], ['bike cover', 'waterproof cover', 'two wheeler']),
                        $this->product('AutoPulse LED Bike Indicator Set', 'AP-BIKE-LEDIND', 'Bike Indicators', 699, 549, 95, 0.28, [16, 12, 6], [20, 16, 8], ['bike indicator', 'led light', 'bike accessory'], 'serial', 'APBI-LED'),
                        $this->product('AutoPulse Anti-Theft Disc Lock', 'AP-DISC-LOCK', 'Bike Lock', 1199, 999, 72, 0.62, [14, 10, 5], [18, 14, 8], ['disc lock', 'bike lock', 'anti theft']),
                    ],
                    'Car Care' => [
                        $this->product('AutoPulse Ceramic Car Shampoo', 'AP-SHAM-CER', 'Car Shampoo', 549, 449, 140, 0.65, [22, 8, 8], [26, 12, 11], ['car shampoo', 'ceramic wash', 'car care'], 'batch'),
                        $this->product('AutoPulse Microfiber Cloth 12 Pack', 'AP-MICRO-12', 'Microfiber Cloth', 499, 399, 190, 0.38, [24, 18, 7], [28, 22, 10], ['microfiber cloth', 'car cleaning', 'detailing']),
                        $this->product('AutoPulse Tyre Shine Spray', 'AP-TYRE-SHINE', 'Tyre Polish', 399, 329, 150, 0.45, [20, 6, 6], [24, 10, 9], ['tyre shine', 'car polish', 'car care'], 'batch'),
                    ],
                    'Automotive Electronics' => [
                        $this->product('AutoPulse Dual Lens Dash Camera', 'AP-DASH-DUAL', 'Dash Camera', 3999, 3499, 48, 0.42, [12, 8, 5], [18, 13, 8], ['dash camera', 'car camera', 'automotive electronics'], 'serial', 'APDC-DUAL'),
                        $this->product('AutoPulse 45W Fast Car Charger', 'AP-CHARGER-45W', 'Car Charger', 799, 649, 130, 0.12, [8, 4, 4], [12, 8, 6], ['car charger', 'fast charger', 'usb c'], 'serial', 'APCC-45'),
                        $this->product('AutoPulse Digital Tyre Inflator', 'AP-INFLATOR-DIGI', 'Tyre Inflator', 2499, 2199, 54, 1.1, [24, 18, 12], [29, 23, 16], ['tyre inflator', 'digital inflator', 'car accessory'], 'serial', 'APTI-D'),
                    ],
                ],
            ],
            [
                'business_type' => 'Gaming and hobby store',
                'primary_category' => 'Gaming & Entertainment',
                'owner' => 'Neil Dsouza',
                'email' => 'seller.gaming@mystore.test',
                'verification_status' => 'submitted',
                'phone' => '9876500112',
                'store' => 'GameForge Arena',
                'brand' => 'GameForge',
                'gst_number' => '30AAPCG2244N1Z3',
                'address' => '12 Panaji Tech Arcade',
                'city' => 'Panaji',
                'state' => 'Goa',
                'pincode' => '403001',
                'warehouse_name' => 'GameForge Goa Fulfillment',
                'warehouse_code' => 'WH-GFA-GOA-01',
                'warehouse_type' => 'fulfillment',
                'warehouse_address' => 'Unit 12, Verna Industrial Estate',
                'warehouse_capacity' => 7000,
                'fulfillment_channels' => ['Seller Fulfilled', 'Shadowfax', 'Marketplace Managed'],
                'default_fulfillment_channel' => 'Shadowfax',
                'shipping_acceptance_time' => '3 hours',
                'handling_days' => 1,
                'categories' => [
                    'Gaming Accessories' => [
                        $this->product('GameForge RGB Mechanical Keyboard', 'GF-KB-RGB87', 'Gaming Keyboard', 3499, 2999, 70, 0.95, [36, 14, 4], [40, 18, 7], ['gaming keyboard', 'rgb keyboard', 'mechanical'], 'serial', 'GFKB87'),
                        $this->product('GameForge UltraLight Gaming Mouse', 'GF-MOUSE-UL', 'Gaming Mouse', 1999, 1599, 100, 0.12, [13, 7, 4], [17, 11, 7], ['gaming mouse', 'ultralight mouse', 'rgb'], 'serial', 'GFM-UL'),
                        $this->product('GameForge XL Speed Mousepad', 'GF-PAD-XL', 'Mousepad', 999, 799, 140, 0.55, [42, 12, 8], [46, 16, 10], ['mousepad', 'gaming desk', 'speed pad']),
                    ],
                    'Streaming Gear' => [
                        $this->product('GameForge USB Condenser Mic', 'GF-MIC-USB', 'Streaming Microphone', 2999, 2499, 64, 0.72, [19, 12, 10], [23, 16, 13], ['usb microphone', 'streaming gear', 'podcast mic'], 'serial', 'GFMIC-USB'),
                        $this->product('GameForge 1080p Stream Webcam', 'GF-CAM-1080', 'Webcam', 2499, 1999, 82, 0.25, [10, 7, 5], [15, 12, 8], ['webcam', 'stream camera', '1080p'], 'serial', 'GFCAM1080'),
                        $this->product('GameForge Adjustable Ring Light', 'GF-RING-LITE', 'Ring Light', 1899, 1499, 58, 1.2, [36, 36, 6], [40, 40, 9], ['ring light', 'streaming light', 'creator gear']),
                    ],
                    'Board Games' => [
                        $this->product('GameForge Empire Strategy Board Game', 'GF-BOARD-EMP', 'Board Game', 2499, 1999, 44, 1.4, [34, 28, 8], [38, 32, 11], ['board game', 'strategy game', 'family game']),
                        $this->product('GameForge Mystery Case Card Game', 'GF-CARD-MYST', 'Card Game', 899, 699, 120, 0.35, [15, 10, 4], [19, 14, 6], ['card game', 'mystery game', 'party game']),
                        $this->product('GameForge Dice Tower Set', 'GF-DICE-TOWER', 'Dice Accessory', 1299, 999, 72, 0.5, [18, 12, 10], [22, 16, 13], ['dice tower', 'board game accessory', 'tabletop']),
                    ],
                    'Collectibles' => [
                        $this->product('GameForge Dragon Miniature Figure', 'GF-FIG-DRAGON', 'Collectible Figure', 1799, 1499, 48, 0.32, [16, 14, 18], [20, 18, 22], ['collectible figure', 'dragon figure', 'miniature']),
                        $this->product('GameForge Acrylic Display Stand', 'GF-DISP-STAND', 'Display Stand', 699, 549, 100, 0.28, [22, 18, 5], [26, 22, 8], ['display stand', 'collectibles', 'acrylic stand']),
                        $this->product('GameForge Collector Card Sleeves', 'GF-SLEEVE-100', 'Card Sleeves', 499, 399, 160, 0.25, [11, 8, 5], [15, 12, 7], ['card sleeves', 'collectibles', 'trading cards']),
                    ],
                ],
            ],
            [
                'business_type' => 'Jewelry and lifestyle accessories seller',
                'primary_category' => 'Jewelry & Accessories',
                'owner' => 'Mira Sethi',
                'email' => 'seller.jewelry@mystore.test',
                'verification_status' => 'submitted',
                'phone' => '9876500113',
                'store' => 'JewelMint Studio',
                'brand' => 'JewelMint',
                'gst_number' => '27AAPCJ9988T1Z1',
                'address' => '61 Zaveri Bazaar',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'pincode' => '400002',
                'warehouse_name' => 'JewelMint Secure Vault Dispatch',
                'warehouse_code' => 'WH-JMS-MUM-01',
                'warehouse_type' => 'fulfillment',
                'warehouse_address' => 'Secure Unit 2, Kalbadevi Logistics',
                'warehouse_capacity' => 3500,
                'fulfillment_channels' => ['Seller Fulfilled', 'Blue Dart Secure', 'Marketplace Managed'],
                'default_fulfillment_channel' => 'Blue Dart Secure',
                'shipping_acceptance_time' => '2 hours',
                'handling_days' => 1,
                'categories' => [
                    'Earrings' => [
                        $this->product('JewelMint Pearl Drop Earrings', 'JM-EAR-PEARL', 'Earrings', 1499, 1199, 75, 0.08, [9, 7, 3], [13, 11, 5], ['pearl earrings', 'jewelry', 'drop earrings']),
                        $this->product('JewelMint Minimal Gold Hoops', 'JM-EAR-HOOP', 'Hoop Earrings', 1299, 999, 90, 0.07, [8, 8, 3], [12, 12, 5], ['gold hoops', 'earrings', 'fashion jewelry']),
                        $this->product('JewelMint Oxidised Jhumka Pair', 'JM-EAR-JHUMKA', 'Jhumka Earrings', 999, 799, 110, 0.1, [10, 8, 4], [14, 12, 6], ['jhumka earrings', 'oxidised jewelry', 'ethnic']),
                    ],
                    'Necklaces' => [
                        $this->product('JewelMint Layered Chain Necklace', 'JM-NCK-LAYER', 'Necklace', 1799, 1499, 64, 0.12, [13, 10, 3], [17, 14, 5], ['layered necklace', 'chain necklace', 'jewelry']),
                        $this->product('JewelMint Silver Compass Pendant', 'JM-NCK-COMPASS', 'Pendant Necklace', 1399, 1099, 88, 0.1, [12, 9, 3], [16, 13, 5], ['compass pendant', 'silver necklace', 'travel jewelry']),
                        $this->product('JewelMint Rose Gold Choker', 'JM-NCK-CHOKER', 'Choker', 1199, 949, 92, 0.09, [13, 10, 3], [17, 14, 5], ['rose gold choker', 'necklace', 'fashion jewelry']),
                    ],
                    'Watches' => [
                        $this->product('JewelMint Classic Mesh Watch', 'JM-WATCH-MESH', 'Watch', 2999, 2499, 40, 0.22, [14, 8, 5], [18, 12, 8], ['mesh watch', 'women watch', 'accessory'], 'serial', 'JMW-MESH'),
                        $this->product('JewelMint Leather Strap Watch', 'JM-WATCH-LEATHER', 'Watch', 3499, 2999, 36, 0.24, [14, 8, 5], [18, 12, 8], ['leather watch', 'classic watch', 'accessory'], 'serial', 'JMW-LEA'),
                        $this->product('JewelMint Everyday Digital Watch', 'JM-WATCH-DIGI', 'Digital Watch', 1999, 1699, 58, 0.2, [13, 8, 5], [17, 12, 8], ['digital watch', 'casual watch', 'accessory'], 'serial', 'JMW-DIGI'),
                    ],
                    'Bags & Accessories' => [
                        $this->product('JewelMint Quilted Crossbody Bag', 'JM-BAG-CROSS', 'Crossbody Bag', 2499, 2199, 48, 0.65, [28, 20, 10], [32, 24, 13], ['crossbody bag', 'fashion bag', 'accessory']),
                        $this->product('JewelMint Satin Scrunchies 6 Pack', 'JM-SCRUNCH-6', 'Hair Accessory', 399, 299, 180, 0.1, [15, 10, 4], [18, 13, 6], ['scrunchies', 'hair accessory', 'satin']),
                        $this->product('JewelMint Travel Jewelry Organizer', 'JM-ORG-JEWEL', 'Jewelry Organizer', 899, 749, 90, 0.34, [20, 14, 6], [24, 18, 8], ['jewelry organizer', 'travel case', 'accessory']),
                    ],
                ],
            ],
            [
                'business_type' => 'Health and wellness catalog seller',
                'primary_category' => 'Health & Wellness',
                'owner' => 'Pranay Kulkarni',
                'email' => 'seller.health@mystore.test',
                'phone' => '9876500114',
                'store' => 'HealthHub Essentials',
                'brand' => 'HealthHub',
                'gst_number' => '36AAPCH4433K1Z2',
                'address' => '88 Hitech City Wellness Plaza',
                'city' => 'Hyderabad',
                'state' => 'Telangana',
                'pincode' => '500081',
                'warehouse_name' => 'HealthHub Hyderabad DC',
                'warehouse_code' => 'WH-HHE-HYD-01',
                'warehouse_type' => 'fulfillment',
                'warehouse_address' => 'Dock 12, Gachibowli Logistics Park',
                'warehouse_capacity' => 8500,
                'fulfillment_channels' => ['Seller Fulfilled', 'Ecom Express', 'Marketplace Managed'],
                'default_fulfillment_channel' => 'Ecom Express',
                'shipping_acceptance_time' => '3 hours',
                'handling_days' => 1,
                'categories' => [
                    'Supplements' => [
                        $this->product('HealthHub Whey Protein Chocolate 1kg', 'HH-WHEY-CHOCO1', 'Protein Supplement', 2499, 2199, 120, 1.1, [28, 14, 14], [32, 18, 18], ['whey protein', 'protein supplement', 'fitness'], 'batch'),
                        $this->product('HealthHub Multivitamin Tablets 60 Count', 'HH-MULTI-60', 'Multivitamin', 699, 599, 170, 0.12, [10, 5, 5], [14, 9, 8], ['multivitamin', 'supplement', 'health'], 'batch'),
                        $this->product('HealthHub Omega 3 Capsules', 'HH-OMEGA-90', 'Omega 3 Supplement', 899, 749, 150, 0.14, [11, 6, 6], [15, 10, 9], ['omega 3', 'capsules', 'supplement'], 'batch'),
                    ],
                    'Medical Devices' => [
                        $this->product('HealthHub Digital BP Monitor', 'HH-BP-DIGI', 'BP Monitor', 1999, 1699, 58, 0.55, [17, 12, 9], [21, 16, 12], ['bp monitor', 'medical device', 'blood pressure'], 'serial', 'HHBP-01'),
                        $this->product('HealthHub Fingertip Pulse Oximeter', 'HH-OXI-FINGER', 'Oximeter', 1299, 999, 72, 0.1, [7, 4, 4], [11, 8, 6], ['oximeter', 'pulse monitor', 'medical device'], 'serial', 'HHOXI-01'),
                        $this->product('HealthHub Infrared Thermometer', 'HH-THERMO-IR', 'Thermometer', 1499, 1199, 65, 0.2, [15, 9, 5], [19, 13, 8], ['infrared thermometer', 'medical device', 'temperature'], 'serial', 'HHTH-IR'),
                    ],
                    'Personal Hygiene' => [
                        $this->product('HealthHub Sanitizer Gel 500ml', 'HH-SANI-500', 'Sanitizer', 299, 249, 220, 0.55, [18, 7, 7], [22, 10, 10], ['sanitizer', 'hygiene', 'hand gel'], 'batch'),
                        $this->product('HealthHub Soft Face Masks 50 Pack', 'HH-MASK-50', 'Face Masks', 499, 399, 200, 0.28, [20, 12, 8], [24, 16, 10], ['face mask', 'hygiene', 'protective mask']),
                        $this->product('HealthHub Antibacterial Hand Wash', 'HH-HAND-WASH', 'Hand Wash', 249, 199, 180, 0.52, [18, 7, 7], [22, 10, 10], ['hand wash', 'hygiene', 'antibacterial'], 'batch'),
                    ],
                    'Ayurveda' => [
                        $this->product('HealthHub Herbal Triphala Tablets', 'HH-TRIPHALA-120', 'Ayurvedic Tablets', 449, 379, 150, 0.18, [12, 6, 6], [16, 10, 8], ['triphala', 'ayurveda', 'herbal supplement'], 'batch'),
                        $this->product('HealthHub Ashwagandha Capsules', 'HH-ASHWA-60', 'Ayurvedic Capsules', 599, 499, 140, 0.16, [12, 6, 6], [16, 10, 8], ['ashwagandha', 'ayurveda', 'stress support'], 'batch'),
                        $this->product('HealthHub Herbal Green Tea 100g', 'HH-TEA-GREEN', 'Herbal Tea', 349, 299, 160, 0.18, [18, 10, 6], [22, 14, 8], ['green tea', 'herbal tea', 'ayurveda'], 'batch'),
                    ],
                ],
            ],
            [
                'business_type' => 'Office supplies and business equipment seller',
                'primary_category' => 'Office & Business Supplies',
                'owner' => 'Rajeev Menon',
                'email' => 'seller.office@mystore.test',
                'phone' => '9876500115',
                'store' => 'OfficeCore Supply Co.',
                'brand' => 'OfficeCore',
                'gst_number' => '23AAPCO3355P1Z4',
                'address' => '44 MG Road Commercial Complex',
                'city' => 'Indore',
                'state' => 'Madhya Pradesh',
                'pincode' => '452001',
                'warehouse_name' => 'OfficeCore Central India DC',
                'warehouse_code' => 'WH-OCS-IND-01',
                'warehouse_type' => 'fulfillment',
                'warehouse_address' => 'Warehouse 6, Pithampur Industrial Area',
                'warehouse_capacity' => 10000,
                'fulfillment_channels' => ['Seller Fulfilled', 'DTDC Business', 'Marketplace Managed'],
                'default_fulfillment_channel' => 'DTDC Business',
                'shipping_acceptance_time' => '5 hours',
                'handling_days' => 1,
                'categories' => [
                    'Printers & Scanners' => [
                        $this->product('OfficeCore Compact Laser Printer', 'OC-PRN-LASER', 'Laser Printer', 9999, 8999, 28, 6.4, [38, 34, 22], [42, 38, 26], ['laser printer', 'office printer', 'business equipment'], 'serial', 'OCLP-100'),
                        $this->product('OfficeCore Portable Document Scanner', 'OC-SCAN-PORT', 'Document Scanner', 6999, 5999, 34, 1.2, [30, 8, 6], [34, 12, 9], ['document scanner', 'portable scanner', 'office'], 'serial', 'OCSC-01'),
                        $this->product('OfficeCore Printer Toner Cartridge', 'OC-TONER-BLK', 'Toner Cartridge', 1999, 1699, 90, 0.85, [28, 10, 10], [32, 14, 13], ['toner cartridge', 'printer supplies', 'office']),
                    ],
                    'Desk Accessories' => [
                        $this->product('OfficeCore Bamboo Desk Organizer', 'OC-DESK-BAMBOO', 'Desk Organizer', 1299, 999, 82, 1.1, [30, 18, 12], [34, 22, 15], ['desk organizer', 'office desk', 'bamboo']),
                        $this->product('OfficeCore Adjustable Laptop Stand', 'OC-STAND-LAP', 'Laptop Stand', 1499, 1199, 76, 0.9, [28, 24, 5], [32, 28, 8], ['laptop stand', 'desk accessory', 'ergonomic']),
                        $this->product('OfficeCore Cable Management Box', 'OC-CABLE-BOX', 'Cable Organizer', 899, 699, 120, 0.65, [32, 14, 13], [36, 18, 16], ['cable organizer', 'desk accessory', 'office']),
                    ],
                    'Paper Products' => [
                        $this->product('OfficeCore Copier Paper A4 500 Sheets', 'OC-PAPER-A4', 'A4 Paper', 399, 349, 260, 2.4, [30, 21, 6], [34, 25, 8], ['a4 paper', 'copier paper', 'office paper']),
                        $this->product('OfficeCore Sticky Notes 12 Pack', 'OC-STICKY-12', 'Sticky Notes', 299, 249, 220, 0.3, [12, 8, 5], [16, 12, 7], ['sticky notes', 'office stationery', 'paper']),
                        $this->product('OfficeCore Kraft Mailing Envelopes 100 Pack', 'OC-ENV-KRAFT100', 'Envelopes', 499, 399, 180, 0.85, [34, 24, 5], [38, 28, 7], ['mailing envelopes', 'office paper', 'kraft']),
                    ],
                    'Tech Accessories' => [
                        $this->product('OfficeCore 7-in-1 USB-C Hub', 'OC-HUB-USBC7', 'USB-C Hub', 2499, 1999, 72, 0.18, [12, 5, 2], [16, 9, 5], ['usb c hub', 'tech accessory', 'office'], 'serial', 'OCHUB7'),
                        $this->product('OfficeCore Wireless Keyboard Mouse Combo', 'OC-KM-WIRELESS', 'Keyboard Mouse Combo', 1999, 1599, 64, 0.9, [44, 16, 5], [48, 20, 8], ['keyboard mouse', 'wireless combo', 'office tech'], 'serial', 'OCKM-W'),
                        $this->product('OfficeCore 65W USB-C Laptop Charger', 'OC-CHARGE-65W', 'Laptop Charger', 1799, 1499, 84, 0.32, [11, 6, 3], [15, 10, 6], ['laptop charger', 'usb c charger', 'office tech'], 'serial', 'OCCH65'),
                    ],
                ],
            ],
        ];
    }

    private function product(
        string $name,
        string $sku,
        string $productType,
        float $regularPrice,
        ?float $salePrice,
        int $stock,
        float $weightKg,
        array $dimensions,
        array $packageDimensions,
        array $seoTerms,
        ?string $traceability = null,
        ?string $modelNumber = null,
        string $targetGender = 'Unisex',
        string $recommendedAge = '12 years and up',
    ): array {
        return [
            'name' => $name,
            'sku' => $sku,
            'product_type' => $productType,
            'regular_price' => $regularPrice,
            'sale_price' => $salePrice,
            'stock' => $stock,
            'weight_kg' => $weightKg,
            'length_cm' => $dimensions[0],
            'width_cm' => $dimensions[1],
            'height_cm' => $dimensions[2],
            'package_weight_kg' => round($weightKg + 0.18, 2),
            'package_length_cm' => $packageDimensions[0],
            'package_width_cm' => $packageDimensions[1],
            'package_height_cm' => $packageDimensions[2],
            'seo_terms' => $seoTerms,
            'traceability' => $traceability,
            'model_number' => $modelNumber,
            'target_gender' => $targetGender,
            'recommended_age' => $recommendedAge,
            'short_description' => $name . ' from a verified MyStore seller.',
            'description' => $name . ' is stocked by a verified seller with structured catalog details, warehouse inventory, package dimensions, fulfillment data, and buyer-ready product content.',
            'image' => $this->productImage($sku),
            'gallery' => [],
            'box' => ['1 x ' . $name, 'Warranty card', 'User information leaflet'],
        ];
    }

    private function productImage(string $sku): string
    {
        return '/demo-products/' . $sku . '.svg';
    }
}
