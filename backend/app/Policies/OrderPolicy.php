<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function cancel(User $user, Order $order): bool
    {
        return $order->buyer_id === $user->id;
    }

    public function return(User $user, Order $order): bool
    {
        return $order->buyer_id === $user->id;
    }

    public function ship(User $user, Order $order): bool
    {
        return $user->role === 'seller'
            && $order->items->isNotEmpty()
            && $order->items->first()?->product?->user_id === $user->id;
    }
}
