<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Notifications\OrderCancelledNotification;
use App\Services\InventoryService\ManageStockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;

class CancelOrderAction
{
    public function __construct(private readonly ManageStockMovement $manageStockMovement)
    {
    }

    public function handle(Order $order, ?string $reason = null, ?string $note = null): Order
    {
        return DB::transaction(function () use ($order, $reason, $note) {
            $order->loadMissing('buyer', 'items.product', 'items.seller');
            $this->manageStockMovement->releaseOrderReservations($order);

            $order->status = OrderStatus::Cancelled;
            $order->refund_status = $order->payment_method === 'Credit Card' ? 'refunded' : null;
            $order->cancellation_reason = $reason;
            $order->cancellation_reason_note = $note;
            $order->cancelled_at = now();
            $order->save();

            if ($order->stripe_payment_intent_id) {
                $stripeSecret = config('services.stripe.secret') ?: env('STRIPE_SECRET_KEY');
                if ($stripeSecret && !str_starts_with($order->stripe_payment_intent_id, 'pi_mock_')) {
                    try {
                        Stripe::setApiKey($stripeSecret);
                        \Stripe\Refund::create([
                            'payment_intent' => $order->stripe_payment_intent_id,
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Stripe Refund failed: " . $e->getMessage());
                    }
                }
            }

            $sellers = $order->items
                ->map(fn ($item) => $item->seller)
                ->filter()
                ->unique('id');

            foreach ($sellers as $seller) {
                try {
                    $seller->notify(new OrderCancelledNotification(
                        $order,
                        $reason ?: 'No reason shared',
                        $note,
                    ));
                } catch (\Throwable $exception) {
                    Log::error('Order cancellation notification failed: ' . $exception->getMessage());
                }
            }

            return $order->load('buyer', 'items.product', 'items.seller');
        });
    }
}
