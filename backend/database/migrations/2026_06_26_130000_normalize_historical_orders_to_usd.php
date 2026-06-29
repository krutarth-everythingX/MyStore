<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $baseCurrency = base_money_currency();

        DB::table('orders')
            ->orderBy('id')
            ->chunkById(100, function ($orders) use ($baseCurrency) {
                foreach ($orders as $order) {
                    $orderCurrency = strtoupper((string) ($order->currency ?: $baseCurrency));

                    DB::table('order_items')
                        ->where('order_id', $order->id)
                        ->orderBy('id')
                        ->chunkById(100, function ($items) use ($orderCurrency, $baseCurrency) {
                            foreach ($items as $item) {
                                $itemCurrency = strtoupper((string) ($item->currency ?: $orderCurrency ?: $baseCurrency));

                                DB::table('order_items')
                                    ->where('id', $item->id)
                                    ->update([
                                        'price' => money_to_base($item->price, $itemCurrency),
                                        'currency' => $baseCurrency,
                                    ]);
                            }
                        });

                    DB::table('orders')
                        ->where('id', $order->id)
                        ->update([
                            'total_amount' => money_to_base($order->total_amount, $orderCurrency),
                            'shipping_cost' => money_to_base($order->shipping_cost, $orderCurrency),
                            'discount_amount' => money_to_base($order->discount_amount, $orderCurrency),
                            'cgst' => money_to_base($order->cgst, $orderCurrency),
                            'sgst' => money_to_base($order->sgst, $orderCurrency),
                            'igst' => money_to_base($order->igst, $orderCurrency),
                            'currency' => $baseCurrency,
                            'timezone' => 'UTC',
                        ]);
                }
            });
    }

    public function down(): void
    {
        // Historical currency normalization is intentionally not reversed.
    }
};
