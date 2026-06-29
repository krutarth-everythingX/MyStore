<?php

namespace Database\Seeders;

use App\Models\Coupon;
use App\Models\InventoryAdjustment;
use App\Models\InventoryBatch;
use App\Models\InventoryReservation;
use App\Models\InventorySerialNumber;
use App\Models\InventoryTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\RecentlyViewed;
use App\Models\Review;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Wishlist;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class OrderDemoSeeder extends Seeder
{
    public function run(): void
    {
        $buyers = $this->createBuyers()->keyBy('email');
        $sellers = User::query()
            ->whereIn('email', [
                'seller.auto@mystore.test',
                'seller.gaming@mystore.test',
                'seller.jewelry@mystore.test',
                'seller.health@mystore.test',
                'seller.office@mystore.test',
            ])
            ->where('role', 'seller')
            ->get()
            ->keyBy('email');

        $productsBySeller = Product::query()
            ->whereIn('user_id', $sellers->pluck('id'))
            ->where('type', '!=', 'variation')
            ->orderBy('user_id')
            ->orderBy('id')
            ->get()
            ->groupBy('user_id');

        $warehousesBySeller = Warehouse::query()
            ->whereIn('user_id', $sellers->pluck('id'))
            ->get()
            ->keyBy('user_id');

        if ($buyers->isEmpty() || $productsBySeller->isEmpty()) {
            return;
        }

        $this->createCoupons();
        $this->createOrders($buyers, $sellers, $productsBySeller, $warehousesBySeller);
        $this->createWishlists($buyers, $productsBySeller);
        $this->createRecentlyViewed($buyers, $productsBySeller);
        $this->createReviews($buyers, $productsBySeller);
        $this->createInventoryLifecycle($sellers, $productsBySeller, $warehousesBySeller);
    }

    private function createBuyers(): Collection
    {
        return collect([
            [
                'name' => 'Krutarth Buyer',
                'email' => 'krutarth.everythingx@gmail.com',
                'phone' => '9876543210',
                'address' => 'Flat 403, Riverstone Residency, Satellite Road',
                'city' => 'Ahmedabad',
                'state' => 'Gujarat',
                'pincode' => '380015',
                'card_number' => '4111111111111111',
                'card_expiry' => '12/28',
                'card_cvv' => '123',
            ],
            [
                'name' => 'Priya Desai',
                'email' => 'priya.desai@mystore.test',
                'phone' => '9898012456',
                'address' => 'B-704, Orchid Heights, Baner Road',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'pincode' => '411045',
                'card_number' => '4242424242424242',
                'card_expiry' => '09/29',
                'card_cvv' => '456',
            ],
            [
                'name' => 'Rahul Verma',
                'email' => 'rahul.verma@mystore.test',
                'phone' => '9810011122',
                'address' => 'Tower 6, Green Residency, Dwarka Sector 10',
                'city' => 'New Delhi',
                'state' => 'Delhi',
                'pincode' => '110075',
                'card_number' => '5555555555554444',
                'card_expiry' => '03/30',
                'card_cvv' => '789',
            ],
        ])->map(function (array $buyer) {
            return User::query()->create([
                'name' => $buyer['name'],
                'email' => $buyer['email'],
                'email_verified_at' => now(),
                'phone' => $buyer['phone'],
                'country_code' => '+91',
                'phone_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'buyer',
                'address' => $buyer['address'],
                'city' => $buyer['city'],
                'state' => $buyer['state'],
                'country' => 'India',
                'pincode' => $buyer['pincode'],
                'card_number' => $buyer['card_number'],
                'card_expiry' => $buyer['card_expiry'],
                'card_cvv' => $buyer['card_cvv'],
            ]);
        });
    }

    private function createCoupons(): void
    {
        foreach ([
            ['code' => 'GARAGE10', 'type' => 'percent', 'value' => 10, 'min_spend' => 999],
            ['code' => 'LEVELUP', 'type' => 'fixed', 'value' => 250, 'min_spend' => 2499],
            ['code' => 'WELLNESS15', 'type' => 'percent', 'value' => 15, 'min_spend' => 1499],
        ] as $coupon) {
            Coupon::query()->create([
                'code' => $coupon['code'],
                'type' => $coupon['type'],
                'value' => $coupon['value'],
                'min_spend' => $coupon['min_spend'],
                'expiry_date' => now()->addDays(45)->toDateString(),
                'active' => true,
            ]);
        }
    }

    private function createOrders(Collection $buyers, Collection $sellers, Collection $productsBySeller, Collection $warehousesBySeller): void
    {
        $plans = [
            [
                'buyer_email' => 'krutarth.everythingx@gmail.com',
                'status' => 'processing',
                'created_at' => Carbon::now()->subDays(2),
                'payment_method' => 'COD',
                'shipping_carrier' => 'Marketplace Managed',
                'fulfillment_channel' => 'Marketplace Managed',
                'tracking_number' => null,
                'shipping_cost' => 149,
                'discount_amount' => 99,
                'seller_shipping_acceptance_time' => '4 hours',
                'items' => [
                    ['seller' => 'seller.auto@mystore.test', 'index' => 0, 'quantity' => 2],
                    ['seller' => 'seller.gaming@mystore.test', 'index' => 1, 'quantity' => 1],
                ],
            ],
            [
                'buyer_email' => 'priya.desai@mystore.test',
                'status' => 'shipped',
                'created_at' => Carbon::now()->subDays(6),
                'payment_method' => 'Credit Card',
                'shipping_carrier' => 'Blue Dart',
                'fulfillment_channel' => 'Blue Dart',
                'tracking_number' => 'BDRT' . now()->format('His') . '61',
                'shipping_cost' => 179,
                'discount_amount' => 0,
                'seller_shipping_acceptance_time' => '3 hours',
                'items' => [
                    ['seller' => 'seller.jewelry@mystore.test', 'index' => 3, 'quantity' => 1],
                    ['seller' => 'seller.health@mystore.test', 'index' => 0, 'quantity' => 2],
                    ['seller' => 'seller.office@mystore.test', 'index' => 4, 'quantity' => 1],
                ],
            ],
            [
                'buyer_email' => 'rahul.verma@mystore.test',
                'status' => 'completed',
                'created_at' => Carbon::now()->subDays(12),
                'payment_method' => 'UPI',
                'shipping_carrier' => 'Delhivery',
                'fulfillment_channel' => 'Delhivery',
                'tracking_number' => 'DLVY' . now()->format('His') . '82',
                'shipping_cost' => 129,
                'discount_amount' => 150,
                'seller_shipping_acceptance_time' => '1 business day',
                'items' => [
                    ['seller' => 'seller.auto@mystore.test', 'index' => 8, 'quantity' => 1],
                    ['seller' => 'seller.health@mystore.test', 'index' => 7, 'quantity' => 2],
                    ['seller' => 'seller.office@mystore.test', 'index' => 9, 'quantity' => 3],
                ],
            ],
            [
                'buyer_email' => 'priya.desai@mystore.test',
                'status' => 'out_for_delivery',
                'created_at' => Carbon::now()->subDays(1),
                'payment_method' => 'Credit Card',
                'shipping_carrier' => 'Shadowfax',
                'fulfillment_channel' => 'Shadowfax',
                'tracking_number' => 'SFX' . now()->format('His') . '24',
                'shipping_cost' => 99,
                'discount_amount' => 0,
                'seller_shipping_acceptance_time' => '2 hours',
                'items' => [
                    ['seller' => 'seller.gaming@mystore.test', 'index' => 6, 'quantity' => 1],
                    ['seller' => 'seller.jewelry@mystore.test', 'index' => 10, 'quantity' => 1],
                ],
            ],
            [
                'buyer_email' => 'krutarth.everythingx@gmail.com',
                'status' => 'pending',
                'created_at' => Carbon::now()->subHours(10),
                'payment_method' => 'Credit Card',
                'shipping_carrier' => 'Ecom Express',
                'fulfillment_channel' => 'Ecom Express',
                'tracking_number' => null,
                'shipping_cost' => 89,
                'discount_amount' => 0,
                'seller_shipping_acceptance_time' => '3 hours',
                'items' => [
                    ['seller' => 'seller.health@mystore.test', 'index' => 4, 'quantity' => 1],
                    ['seller' => 'seller.office@mystore.test', 'index' => 1, 'quantity' => 1],
                ],
            ],
        ];

        foreach ($plans as $plan) {
            $buyer = $buyers->firstWhere('email', $plan['buyer_email']);
            if (! $buyer) {
                continue;
            }

            $orderProducts = collect($plan['items'])->map(function (array $item) use ($sellers, $productsBySeller) {
                $seller = $sellers->get($item['seller']);
                $products = $seller ? $productsBySeller->get($seller->id, collect()) : collect();
                $product = $products->get($item['index']) ?? $products->first();

                return $product ? [$product, $item['quantity']] : null;
            })->filter()->values();

            if ($orderProducts->isEmpty()) {
                continue;
            }

            DB::transaction(function () use ($buyer, $plan, $orderProducts, $warehousesBySeller) {
                $subtotal = $orderProducts->sum(function (array $entry) {
                    [$product, $quantity] = $entry;
                    return (float) ($product->sale_price ?? $product->regular_price ?? 0) * $quantity;
                });

                $taxableBase = max(0, $subtotal + $plan['shipping_cost'] - $plan['discount_amount']);
                $cgst = round($taxableBase * 0.09, 2);
                $sgst = round($taxableBase * 0.09, 2);
                $total = $taxableBase + $cgst + $sgst;

                $order = Order::query()->create([
                    'buyer_id' => $buyer->id,
                    'buyer_phone' => $buyer->phone,
                    'total_amount' => $total,
                    'currency' => 'INR',
                    'timezone' => 'Asia/Kolkata',
                    'status' => $plan['status'],
                    'shipping_address' => "{$buyer->address}, {$buyer->city}, {$buyer->state} {$buyer->pincode}",
                    'billing_address' => "{$buyer->address}, {$buyer->city}, {$buyer->state} {$buyer->pincode}",
                    'payment_method' => $plan['payment_method'],
                    'shipping_carrier' => $plan['shipping_carrier'],
                    'tracking_number' => $plan['tracking_number'],
                    'shipping_cost' => $plan['shipping_cost'],
                    'discount_amount' => $plan['discount_amount'],
                    'refund_status' => null,
                    'country' => 'India',
                    'city' => $buyer->city,
                    'state' => $buyer->state,
                    'postal_code' => $buyer->pincode,
                    'company_name' => $buyer->name . ' Household Purchase',
                    'buyer_gstin' => null,
                    'cgst' => $cgst,
                    'sgst' => $sgst,
                    'igst' => 0,
                    'invoice_number' => 'INV-DEMO-' . $plan['created_at']->format('Ymd') . '-' . strtoupper(substr(md5($buyer->email . $plan['status']), 0, 4)),
                    'shipping_label_url' => $plan['tracking_number'] ? 'https://example.com/shipping-label/' . strtolower($plan['tracking_number']) : null,
                    'tracking_url' => $plan['tracking_number'] ? 'https://example.com/tracking/' . strtolower($plan['tracking_number']) : null,
                    'fulfillment_channel' => $plan['fulfillment_channel'],
                    'seller_shipping_acceptance_time' => $plan['seller_shipping_acceptance_time'],
                    'created_at' => $plan['created_at'],
                    'updated_at' => $plan['created_at'],
                ]);

                foreach ($orderProducts as [$product, $quantity]) {
                    OrderItem::query()->create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'seller_id' => $product->user_id,
                        'quantity' => $quantity,
                        'price' => (float) ($product->sale_price ?? $product->regular_price ?? 0),
                        'currency' => 'INR',
                        'created_at' => $plan['created_at'],
                        'updated_at' => $plan['created_at'],
                    ]);

                    $warehouse = $warehousesBySeller->get($product->user_id);
                    if (! $warehouse) {
                        continue;
                    }

                    InventoryReservation::query()->create([
                        'product_id' => $product->id,
                        'warehouse_id' => $warehouse->id,
                        'order_id' => $order->id,
                        'quantity' => $quantity,
                        'status' => in_array($plan['status'], ['completed', 'cancelled'], true) ? 'released' : 'reserved',
                        'expires_at' => $plan['created_at']->copy()->addDays(2),
                        'created_at' => $plan['created_at'],
                        'updated_at' => $plan['created_at'],
                    ]);

                    $currentAvailable = max(0, (int) $product->stock_quantity - $quantity);

                    InventoryTransaction::query()->create([
                        'product_id' => $product->id,
                        'warehouse_id' => $warehouse->id,
                        'type' => 'reservation',
                        'quantity' => -1 * $quantity,
                        'quantity_after' => $currentAvailable,
                        'reference_type' => 'order',
                        'reference_no' => (string) $order->id,
                        'reason' => 'Inventory reserved for customer order',
                        'unit_cost' => round((float) ($product->regular_price ?? 0) * 0.56, 2),
                        'created_by' => $product->user_id,
                        'created_at' => $plan['created_at'],
                        'updated_at' => $plan['created_at'],
                    ]);
                }
            });
        }
    }

    private function createWishlists(Collection $buyers, Collection $productsBySeller): void
    {
        $products = $productsBySeller->flatten(1)->values();

        foreach ([
            ['buyer' => 'krutarth.everythingx@gmail.com', 'indexes' => [1, 7, 18, 24]],
            ['buyer' => 'priya.desai@mystore.test', 'indexes' => [3, 10, 16, 21]],
            ['buyer' => 'rahul.verma@mystore.test', 'indexes' => [2, 9, 15, 27]],
        ] as $wishlistPlan) {
            $buyer = $buyers->firstWhere('email', $wishlistPlan['buyer']);

            if (! $buyer) {
                continue;
            }

            foreach ($wishlistPlan['indexes'] as $index) {
                $product = $products->get($index);

                if ($product) {
                    Wishlist::query()->create([
                        'user_id' => $buyer->id,
                        'product_id' => $product->id,
                        'created_at' => now()->subDays(rand(1, 14)),
                        'updated_at' => now()->subDays(rand(0, 8)),
                    ]);
                }
            }
        }
    }

    private function createRecentlyViewed(Collection $buyers, Collection $productsBySeller): void
    {
        $products = $productsBySeller->flatten(1)->values();
        $buyerList = $buyers->values();

        foreach ($buyerList as $buyerIndex => $buyer) {
            foreach (range(0, 5) as $offset) {
                $product = $products->get(($buyerIndex * 5) + $offset);

                if ($product) {
                    RecentlyViewed::query()->create([
                        'user_id' => $buyer->id,
                        'product_id' => $product->id,
                        'viewed_at' => now()->subHours(($buyerIndex * 6) + $offset + 2),
                    ]);
                }
            }
        }
    }

    private function createReviews(Collection $buyers, Collection $productsBySeller): void
    {
        $reviewTargets = [
            ['buyer' => 'krutarth.everythingx@gmail.com', 'seller' => 'seller.gaming@mystore.test', 'index' => 0, 'rating' => 5, 'comment' => 'Fast dispatch, clean packaging, and the product quality feels premium.'],
            ['buyer' => 'priya.desai@mystore.test', 'seller' => 'seller.jewelry@mystore.test', 'index' => 4, 'rating' => 4, 'comment' => 'Gift-ready presentation and good finish, though the clasp was slightly tighter than expected.'],
            ['buyer' => 'rahul.verma@mystore.test', 'seller' => 'seller.health@mystore.test', 'index' => 1, 'rating' => 5, 'comment' => 'Clear labeling, recent batch date, and exactly what I needed for repeat purchase planning.'],
            ['buyer' => 'krutarth.everythingx@gmail.com', 'seller' => 'seller.office@mystore.test', 'index' => 9, 'rating' => 4, 'comment' => 'Useful for a hybrid desk setup and arrived on time with proper cushioning.'],
        ];

        foreach ($reviewTargets as $target) {
            $buyer = $buyers->firstWhere('email', $target['buyer']);
            $seller = User::query()->where('email', $target['seller'])->first();
            $product = $seller ? $productsBySeller->get($seller->id, collect())->get($target['index']) : null;

            if (! $buyer || ! $product) {
                continue;
            }

            Review::query()->create([
                'user_id' => $buyer->id,
                'product_id' => $product->id,
                'rating' => $target['rating'],
                'comment' => $target['comment'],
                'created_at' => now()->subDays(rand(3, 18)),
                'updated_at' => now()->subDays(rand(1, 6)),
            ]);
        }
    }

    private function createInventoryLifecycle(Collection $sellers, Collection $productsBySeller, Collection $warehousesBySeller): void
    {
        foreach ($sellers as $seller) {
            $warehouse = $warehousesBySeller->get($seller->id);
            $products = $productsBySeller->get($seller->id, collect())->values();

            if (! $warehouse || $products->isEmpty()) {
                continue;
            }

            foreach ($products->take(6) as $index => $product) {
                $baseDate = now()->subDays(28 - ($index * 2));
                $unitCost = round((float) ($product->regular_price ?? 0) * 0.56, 2);
                $available = (int) ($product->stock_quantity ?? 0);
                $restockQuantity = 18 + ($index * 3);
                $countedQuantity = max(0, $available - (($index % 2) + 1));

                InventoryTransaction::query()->create([
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'type' => 'stock_in',
                    'quantity' => $restockQuantity,
                    'quantity_after' => $available + $restockQuantity,
                    'reference_type' => 'purchase_receipt',
                    'reference_no' => 'PO-' . $seller->id . '-' . $product->id,
                    'reason' => 'Monthly replenishment received from supplier',
                    'unit_cost' => $unitCost,
                    'created_by' => $seller->id,
                    'created_at' => $baseDate,
                    'updated_at' => $baseDate,
                ]);

                InventoryTransaction::query()->create([
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'type' => 'stock_out',
                    'quantity' => -1 * (3 + $index),
                    'quantity_after' => max(0, $available + $restockQuantity - (3 + $index)),
                    'reference_type' => 'manual_issue',
                    'reference_no' => 'ISS-' . $seller->id . '-' . $product->id,
                    'reason' => 'Dispatch for offline wholesale and sampling activity',
                    'unit_cost' => $unitCost,
                    'created_by' => $seller->id,
                    'created_at' => $baseDate->copy()->addDays(6),
                    'updated_at' => $baseDate->copy()->addDays(6),
                ]);

                InventoryAdjustment::query()->create([
                    'adjustment_no' => 'ADJ-' . $seller->id . '-' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'warehouse_bin_id' => $product->warehouses->first()?->pivot?->warehouse_bin_id,
                    'system_quantity' => $available,
                    'counted_quantity' => $countedQuantity,
                    'variance_quantity' => $countedQuantity - $available,
                    'reason' => 'Cycle count variance during weekly reconciliation',
                    'status' => 'posted',
                    'created_by' => $seller->id,
                    'created_at' => $baseDate->copy()->addDays(10),
                    'updated_at' => $baseDate->copy()->addDays(10),
                ]);

                if ($product->inventoryBatches()->exists()) {
                    $product->inventoryBatches()->each(function (InventoryBatch $batch, int $batchIndex) use ($baseDate) {
                        $batch->update([
                            'manufactured_at' => $baseDate->copy()->subDays(12 + ($batchIndex * 4))->toDateString(),
                            'expires_at' => $batchIndex === 0
                                ? $baseDate->copy()->addDays(18)->toDateString()
                                : $baseDate->copy()->addMonths(8)->toDateString(),
                            'quantity' => max(6, $batch->quantity - ($batchIndex * 3)),
                            'status' => $batchIndex === 0 ? 'active' : $batch->status,
                        ]);
                    });
                }

                if ($product->inventorySerialNumbers()->exists()) {
                    $this->addSerials($product, $warehouse, $index);
                }
            }
        }
    }

    private function addSerials(Product $product, Warehouse $warehouse, int $index): void
    {
        $existingCount = $product->inventorySerialNumbers()->count();

        foreach (range(1, 3) as $serialIndex) {
            InventorySerialNumber::query()->create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'inventory_batch_id' => null,
                'serial_no' => strtoupper($product->sku) . '-S' . str_pad((string) ($existingCount + $serialIndex), 3, '0', STR_PAD_LEFT),
                'status' => $serialIndex === 3 && $index % 2 === 0 ? 'reserved' : 'available',
                'created_at' => now()->subDays(14 - $serialIndex),
                'updated_at' => now()->subDays(14 - $serialIndex),
            ]);
        }
    }
}
