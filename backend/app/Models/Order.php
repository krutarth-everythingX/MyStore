<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'buyer_id', 'buyer_phone', 'total_amount', 'status', 'shipping_address',
        'billing_address', 'payment_method', 'shipping_carrier', 'tracking_number',
        'stripe_payment_intent_id', 'shipping_cost', 'discount_amount', 'refund_status',
        'country', 'city', 'state', 'postal_code', 'company_name', 'buyer_gstin',
        'cgst', 'sgst', 'igst', 'invoice_number', 'shipping_label_url', 'tracking_url'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'status' => OrderStatus::class,
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
