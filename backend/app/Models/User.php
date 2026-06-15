<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'phone_verified_at',
        'phone_verification_code',
        'phone_verification_code_sent_at',
        'password',
        'google_id',
        'avatar',
        'auth_provider',
        'verification_code',
        'verification_code_sent_at',
        'role',
        'brand_name',
        'address',
        'city',
        'state',
        'country',
        'pincode',
        'country_code',
        'gst_number',
        'fulfillment_channels',
        'default_fulfillment_channel',
        'shipping_acceptance_time',
        'handling_time_business_days',
        'card_number',
        'card_expiry',
        'card_cvv',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'verification_code',
        'phone_verification_code',
        'card_number',
        'card_expiry',
        'card_cvv',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'verification_code_sent_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'phone_verification_code_sent_at' => 'datetime',
            'password' => 'hashed',
            'fulfillment_channels' => 'array',
            'handling_time_business_days' => 'integer',
        ];
    }

    public function brands()
    {
        return $this->hasMany(Brand::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function warehouses()
    {
        return $this->hasMany(Warehouse::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'buyer_id');
    }

    public function sellerOrderItems()
    {
        return $this->hasMany(OrderItem::class, 'seller_id');
    }
}
