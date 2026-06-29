<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Traits\StoresUtcTimestamps;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use StoresUtcTimestamps;

    protected $fillable = [
        'buyer_id', 'buyer_phone', 'total_amount', 'currency', 'timezone', 'status', 'shipping_address',
        'billing_address', 'payment_method', 'shipping_carrier', 'tracking_number',
        'stripe_payment_intent_id', 'shipping_cost', 'discount_amount', 'refund_status',
        'return_request_status', 'return_request_reason', 'return_request_note', 'return_request_image_url',
        'return_requested_at', 'return_reviewed_at', 'return_review_note',
        'cancellation_reason', 'cancellation_reason_note', 'cancelled_at',
        'country', 'city', 'state', 'postal_code', 'company_name', 'buyer_gstin',
        'cgst', 'sgst', 'igst', 'invoice_number', 'shipping_label_url', 'tracking_url',
        'fulfillment_channel', 'seller_shipping_acceptance_time',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'cancelled_at' => 'datetime',
        'return_requested_at' => 'datetime',
        'return_reviewed_at' => 'datetime',
        'cgst' => 'decimal:2',
        'sgst' => 'decimal:2',
        'igst' => 'decimal:2',
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
