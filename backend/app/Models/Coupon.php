<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = ['code', 'type', 'value', 'expiry_date', 'min_spend', 'active'];

    protected $casts = [
        'value' => 'decimal:2',
        'min_spend' => 'decimal:2',
        'active' => 'boolean',
        'expiry_date' => 'date',
    ];

    /**
     * Determine if coupon is valid based on spend and expiration.
     */
    public function isValidFor(float $subtotal): bool
    {
        if (!$this->active) {
            return false;
        }

        if ($this->expiry_date && $this->expiry_date->isPast()) {
            return false;
        }

        if ($subtotal < floatval($this->min_spend)) {
            return false;
        }

        return true;
    }

    /**
     * Calculate discount amount.
     */
    public function calculateDiscount(float $subtotal): float
    {
        if ($this->type === 'percent') {
            return ($subtotal * (floatval($this->value) / 100));
        }

        // 'fixed' amount discount
        return min($subtotal, floatval($this->value));
    }
}
