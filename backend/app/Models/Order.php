<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'buyer_id', 'total_amount', 'status', 'shipping_address',
        'billing_address', 'payment_method', 'shipping_carrier', 'tracking_number',
        'stripe_payment_intent_id', 'shipping_cost', 'discount_amount', 'refund_status'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
