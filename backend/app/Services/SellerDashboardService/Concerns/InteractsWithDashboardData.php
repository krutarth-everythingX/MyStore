<?php

namespace App\Services\SellerDashboardService\Concerns;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;

trait InteractsWithDashboardData
{
    protected function sellerOrdersQuery(int $sellerId): Builder
    {
        return Order::with([
            'buyer',
            'items' => function ($query) use ($sellerId) {
                $query->where('seller_id', $sellerId)->with('product');
            },
        ])->whereHas('items', function (Builder $query) use ($sellerId) {
            $query->where('seller_id', $sellerId);
        });
    }

    protected function buildSalesVelocity(int $sellerId): array
    {
        $thirtyDaysAgo = now()->subDays(30);
        $orderItems = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', function (Builder $query) use ($thirtyDaysAgo) {
                $query->where('status', '!=', OrderStatus::Cancelled->value)
                    ->where('created_at', '>=', $thirtyDaysAgo);
            })
            ->get();

        $velocityData = [];
        for ($day = 29; $day >= 0; $day--) {
            $date = now()->subDays($day)->format('Y-m-d');
            $velocityData[$date] = 0.0;
        }

        foreach ($orderItems as $item) {
            $date = $item->created_at->format('Y-m-d');
            if (isset($velocityData[$date])) {
                $velocityData[$date] += money_to_base(
                    (float) ($item->price * $item->quantity),
                    $item->currency ?: $item->order?->currency ?: base_money_currency(),
                );
            }
        }

        $salesVelocity = [];
        foreach ($velocityData as $date => $total) {
            $salesVelocity[] = [
                'date' => $date,
                'total_sales' => round($total, 2),
            ];
        }

        return $salesVelocity;
    }

    protected function buildCategorySplit(int $sellerId): array
    {
        $categorySplitRaw = OrderItem::with(['product.categories'])
            ->where('seller_id', $sellerId)
            ->whereHas('order', function (Builder $query) {
                $query->where('status', '!=', OrderStatus::Cancelled->value);
            })
            ->get();

        $categoryTotals = [];
        foreach ($categorySplitRaw as $item) {
            if (! $item->product || ! $item->product->categories) {
                continue;
            }

            foreach ($item->product->categories as $category) {
                $categoryTotals[$category->name] = ($categoryTotals[$category->name] ?? 0.0)
                    + money_to_base(
                        (float) ($item->price * $item->quantity),
                        $item->currency ?: $item->order?->currency ?: base_money_currency(),
                    );
            }
        }

        $categorySplit = [];
        foreach ($categoryTotals as $name => $total) {
            $categorySplit[] = [
                'category' => $name,
                'value' => round($total, 2),
            ];
        }

        if ($categorySplit !== []) {
            return $categorySplit;
        }

        $productsWithCategories = Product::with('categories')
            ->where('user_id', $sellerId)
            ->get();

        $categoryCounts = [];
        foreach ($productsWithCategories as $product) {
            foreach ($product->categories as $category) {
                $categoryCounts[$category->name] = ($categoryCounts[$category->name] ?? 0) + 1;
            }
        }

        foreach ($categoryCounts as $name => $count) {
            $categorySplit[] = [
                'category' => $name,
                'value' => $count,
            ];
        }

        return $categorySplit;
    }
}
