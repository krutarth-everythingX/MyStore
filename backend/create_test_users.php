<?php

use App\Models\User;
use App\Models\Store;
use Illuminate\Support\Facades\Hash;

$seller = User::firstOrCreate(
    ['email' => 'hybrid_seller@example.com'],
    [
        'name' => 'Hybrid IT Solutions',
        'password' => Hash::make('password'),
        'role' => 'seller',
        'email_verified_at' => now(),
    ]
);

if (class_exists(Store::class)) {
    Store::firstOrCreate(
        ['user_id' => $seller->id],
        [
            'name' => 'Hybrid IT Solutions Store',
            'slug' => 'hybrid-it-solutions',
            'description' => 'Providing top notch IT products and services.',
            'status' => 'active',
        ]
    );
}

$buyer = User::firstOrCreate(
    ['email' => 'it_buyer@example.com'],
    [
        'name' => 'Enterprise Buyer',
        'password' => Hash::make('password'),
        'role' => 'buyer',
        'email_verified_at' => now(),
    ]
);

echo "Users created successfully: Seller (hybrid_seller@example.com) and Buyer (it_buyer@example.com) with password 'password'.\n";
