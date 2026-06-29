<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Traits\StoresUtcTimestamps;
use Database\Factories\UserFactory;
use RuntimeException;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, StoresUtcTimestamps;

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
        'account_deletion_requested_at',
        'account_deletion_scheduled_for',
        'password',
        'google_id',
        'avatar',
        'auth_provider',
        'verification_code',
        'verification_code_sent_at',
        'role',
        'customer_id',
        'seller_id',
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
        'seller_settings',
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
            'account_deletion_requested_at' => 'datetime',
            'account_deletion_scheduled_for' => 'datetime',
            'password' => 'hashed',
            'fulfillment_channels' => 'array',
            'handling_time_business_days' => 'integer',
            'seller_settings' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $user): void {
            $user->role = $user->role ?: 'buyer';
            $user->ensureRoleIdentifier();
        });

        static::updating(function (self $user): void {
            if ($user->isDirty('role')) {
                $user->ensureRoleIdentifier();
            }
        });
    }

    private function ensureRoleIdentifier(): void
    {
        if ($this->role === 'seller' && ! $this->seller_id) {
            $this->seller_id = self::generateUniqueIdentifier('seller_id', 'S-');
        }

        if ($this->role !== 'seller' && ! $this->customer_id) {
            $this->customer_id = self::generateUniqueIdentifier('customer_id', 'B-');
        }
    }

    private static function generateUniqueIdentifier(string $column, string $prefix): string
    {
        for ($attempt = 0; $attempt < 50; $attempt++) {
            $identifier = self::buildIdentifier($prefix);

            if (! self::query()->where($column, $identifier)->exists()) {
                return $identifier;
            }
        }

        throw new RuntimeException("Unable to generate a unique {$column}.");
    }

    private static function buildIdentifier(string $prefix): string
    {
        $digits = '';
        $letters = '';

        for ($index = 0; $index < 6; $index++) {
            $digits .= (string) random_int(1, 9);
            $letters .= chr(random_int(65, 90));
        }

        $identifier = $prefix;

        for ($index = 0; $index < 6; $index++) {
            $identifier .= $digits[$index] . $letters[$index];
        }

        return $identifier;
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

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }

    public function vendors(): HasMany
    {
        return $this->hasMany(Vendor::class);
    }

    public function attributes(): HasMany
    {
        return $this->hasMany(Attribute::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'buyer_id');
    }

    public function sellerOrderItems()
    {
        return $this->hasMany(OrderItem::class, 'seller_id');
    }

    public function sellerVerification()
    {
        return $this->hasOne(SellerVerification::class);
    }
}
