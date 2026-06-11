<?php

namespace App\Services\SellerDashboardService;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\SellerDashboardService\Concerns\InteractsWithDashboardData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class StatsForSeller
{
    use InteractsWithDashboardData;

    public function handle(int $sellerId): array
    {
        $revenue = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', function (Builder $query) {
                $query->where('status', '!=', OrderStatus::Cancelled->value);
            })
            ->sum(DB::raw('price * quantity'));

        $productsCount = Product::where('user_id', $sellerId)->count();

        $lowStockCount = Product::where('user_id', $sellerId)
            ->where('manage_stock', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_amount')
            ->count();

        $ordersCount = Order::whereHas('items', function (Builder $query) use ($sellerId) {
            $query->where('seller_id', $sellerId);
        })->count();

        $recentSales = OrderItem::with(['product', 'order.buyer'])
            ->where('seller_id', $sellerId)
            ->latest()
            ->take(5)
            ->get();

        $salesVelocity = $this->buildSalesVelocity($sellerId);
        $categorySplit = $this->buildCategorySplit($sellerId);

        $lowStockProducts = Product::where('user_id', $sellerId)
            ->where('manage_stock', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_amount')
            ->select('id', 'sku', 'name', 'stock_quantity', 'low_stock_amount')
            ->get();

        return [
            'revenue' => round($revenue, 2),
            'products_count' => $productsCount,
            'low_stock_count' => $lowStockCount,
            'orders_count' => $ordersCount,
            'recent_sales' => $recentSales,
            'sales_velocity' => $salesVelocity,
            'category_split' => $categorySplit,
            'low_stock_products' => $lowStockProducts,
        ];
    }
}
