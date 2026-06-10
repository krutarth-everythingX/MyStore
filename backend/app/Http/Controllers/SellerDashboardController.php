<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Jobs\SendOrderShippedNotificationJob;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SellerDashboardController extends Controller
{
    /**
     * Get analytics and statistics for the seller dashboard.
     */
    public function stats(Request $request)
    {
        $sellerId = $request->user()->id;

        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        // 1. Total revenue (sum of item prices * quantities)
        $revenue = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', function($q) {
                $q->where('status', '!=', OrderStatus::Cancelled->value);
            })
            ->sum(DB::raw('price * quantity'));

        // 2. Total products count
        $productsCount = Product::where('user_id', $sellerId)->count();

        // 3. Low stock warning count
        $lowStockCount = Product::where('user_id', $sellerId)
            ->where('manage_stock', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_amount')
            ->count();

        // 4. Total orders count (unique orders with seller's products)
        $ordersCount = Order::whereHas('items', function($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        })->count();

        // 5. Recent sales items list
        $recentSales = OrderItem::with(['product', 'order.buyer'])
            ->where('seller_id', $sellerId)
            ->latest()
            ->take(5)
            ->get();

        // 6. Sales velocity (past 30 days daily sales)
        $thirtyDaysAgo = now()->subDays(30);
        $orderItems = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', function($q) use ($thirtyDaysAgo) {
                $q->where('status', '!=', OrderStatus::Cancelled->value)
                  ->where('created_at', '>=', $thirtyDaysAgo);
            })
            ->get();

        $velocityData = [];
        for ($i = 29; $i >= 0; $i--) {
            $dateStr = now()->subDays($i)->format('Y-m-d');
            $velocityData[$dateStr] = 0.0;
        }

        foreach ($orderItems as $item) {
            $dateStr = $item->created_at->format('Y-m-d');
            if (isset($velocityData[$dateStr])) {
                $velocityData[$dateStr] += floatval($item->price * $item->quantity);
            }
        }

        $salesVelocity = [];
        foreach ($velocityData as $date => $total) {
            $salesVelocity[] = [
                'date' => $date,
                'total_sales' => round($total, 2)
            ];
        }

        // 7. Category split (sales revenue or products per category)
        $categorySplitRaw = OrderItem::with(['product.categories'])
            ->where('seller_id', $sellerId)
            ->whereHas('order', function($q) {
                $q->where('status', '!=', OrderStatus::Cancelled->value);
            })
            ->get();

        $categoryData = [];
        foreach ($categorySplitRaw as $item) {
            if ($item->product && $item->product->categories) {
                foreach ($item->product->categories as $category) {
                    $catName = $category->name;
                    $categoryData[$catName] = ($categoryData[$catName] ?? 0.0) + floatval($item->price * $item->quantity);
                }
            }
        }

        $categorySplit = [];
        foreach ($categoryData as $name => $total) {
            $categorySplit[] = [
                'category' => $name,
                'value' => round($total, 2)
            ];
        }

        if (empty($categorySplit)) {
            $productsWithCategories = Product::with('categories')
                ->where('user_id', $sellerId)
                ->get();
            $catCount = [];
            foreach ($productsWithCategories as $prod) {
                foreach ($prod->categories as $category) {
                    $catCount[$category->name] = ($catCount[$category->name] ?? 0) + 1;
                }
            }
            foreach ($catCount as $name => $count) {
                $categorySplit[] = [
                    'category' => $name,
                    'value' => $count
                ];
            }
        }

        // 8. Low stock products list
        $lowStockProducts = Product::where('user_id', $sellerId)
            ->where('manage_stock', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_amount')
            ->select('id', 'sku', 'name', 'stock_quantity', 'low_stock_amount')
            ->get();

        return response([
            'revenue' => round($revenue, 2),
            'products_count' => $productsCount,
            'low_stock_count' => $lowStockCount,
            'orders_count' => $ordersCount,
            'recent_sales' => $recentSales,
            'sales_velocity' => $salesVelocity,
            'category_split' => $categorySplit,
            'low_stock_products' => $lowStockProducts
        ], 200);
    }

    /**
     * Export seller orders to CSV.
     */
    public function exportOrders(Request $request)
    {
        $sellerId = $request->user()->id;

        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $orders = Order::with(['buyer', 'items' => function($query) use ($sellerId) {
                $query->where('seller_id', $sellerId)->with('product');
            }])
            ->whereHas('items', function($q) use ($sellerId) {
                $q->where('seller_id', $sellerId);
            })
            ->latest()
            ->get();

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=orders_export_' . date('Ymd_His') . '.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($orders, $sellerId) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Order ID', 'Buyer Name', 'Buyer Email', 'Order Date', 'Status', 
                'Refund Status', 'Payment Method', 'Shipping Carrier', 'Tracking Number', 
                'Shipping Address', 'Product SKU', 'Product Name', 'Quantity', 'Item Price', 'Subtotal'
            ]);

            foreach ($orders as $order) {
                foreach ($order->items as $item) {
                    fputcsv($file, [
                        $order->id,
                        $order->buyer->name ?? 'N/A',
                        $order->buyer->email ?? 'N/A',
                        $order->created_at->toDateTimeString(),
                        $order->status?->value,
                        $order->refund_status ?? 'None',
                        $order->payment_method,
                        $order->shipping_carrier ?? 'N/A',
                        $order->tracking_number ?? 'N/A',
                        $order->shipping_address,
                        $item->product->sku ?? 'N/A',
                        $item->product->name ?? 'Removed Product',
                        $item->quantity,
                        $item->price,
                        round($item->price * $item->quantity, 2)
                    ]);
                }
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export seller inventory to CSV.
     */
    public function exportInventory(Request $request)
    {
        $sellerId = $request->user()->id;

        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $products = Product::with(['brand', 'categories', 'warehouses'])
            ->where('user_id', $sellerId)
            ->latest()
            ->get();

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=inventory_export_' . date('Ymd_His') . '.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($products) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Product ID', 'SKU', 'Product Name', 'Brand', 'Categories', 
                'Regular Price', 'Sale Price', 'Manage Stock', 'Stock Quantity', 
                'Stock Status', 'Low Stock Amount', 'Warehouse Allocations'
            ]);

            foreach ($products as $prod) {
                $cats = $prod->categories->pluck('name')->implode(', ');
                
                $whAllocations = [];
                foreach ($prod->warehouses as $wh) {
                    $whAllocations[] = "{$wh->name} ({$wh->code}): Qty {$wh->pivot->quantity} at {$wh->pivot->bin_location}";
                }
                $whString = implode(' | ', $whAllocations);

                fputcsv($file, [
                    $prod->id,
                    $prod->sku ?? 'N/A',
                    $prod->name,
                    $prod->brand->name ?? 'N/A',
                    $cats ?: 'None',
                    $prod->regular_price,
                    $prod->sale_price ?? 'N/A',
                    $prod->manage_stock ? 'Yes' : 'No',
                    $prod->manage_stock ? $prod->stock_quantity : 'Unlimited',
                    $prod->stock_status,
                    $prod->low_stock_amount ?? '0',
                    $whString ?: 'None'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get all orders containing this seller's products.
     */
    public function orders(Request $request)
    {
        $sellerId = $request->user()->id;

        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        // Fetch orders that have items belonging to this seller
        $orders = Order::with(['buyer', 'items' => function($query) use ($sellerId) {
                $query->where('seller_id', $sellerId)->with('product');
            }])
            ->whereHas('items', function($q) use ($sellerId) {
                $q->where('seller_id', $sellerId);
            })
            ->latest()
            ->get();

        return response($orders, 200);
    }
    /**
     * Update order fulfillment status, carrier, and tracking number.
     */
    public function updateOrderStatus(Request $request, $id)
    {
        $sellerId = $request->user()->id;

        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $order = Order::with('buyer')->whereHas('items', function($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        })->find($id);

        if (!$order) {
            return response(['message' => 'Order not found for your products'], 404);
        }

        $fields = $request->validate([
            'status' => 'required|string|in:' . implode(',', OrderStatus::values()),
            'shipping_carrier' => 'nullable|string',
            'tracking_number' => 'nullable|string'
        ]);

        $oldStatus = $order->status;

        $order->update([
            'status' => OrderStatus::from($fields['status']),
            'shipping_carrier' => $fields['shipping_carrier'] ?? $order->shipping_carrier,
            'tracking_number' => $fields['tracking_number'] ?? $order->tracking_number,
        ]);

        // Dispatch Shipped Notification if status transitions to shipped
        if ($order->status === OrderStatus::Shipped && $oldStatus !== OrderStatus::Shipped) {
            SendOrderShippedNotificationJob::dispatch($order->id);
        }

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Order updated successfully');
        }

        return response([
            'message' => 'Order updated successfully',
            'order' => $order->load(['buyer', 'items' => function($q) use ($sellerId) {
                $q->where('seller_id', $sellerId)->with('product');
            }])
        ], 200);
    }
}
