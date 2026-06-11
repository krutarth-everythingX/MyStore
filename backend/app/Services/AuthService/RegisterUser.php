<?php

namespace App\Services\AuthService;

use App\Models\Brand;
use App\Models\User;
use App\Services\AuthService\Concerns\HasVerificationCodes;
use Illuminate\Support\Facades\Hash;

class RegisterUser
{
    use HasVerificationCodes;

    public function handle(array $fields): User
    {
        $code = $this->generateVerificationCode();
        $sellerBrandName = $fields['role'] === 'seller'
            ? seller_brand_name($fields['brand_name'] ?? null, $fields['name'])
            : null;

        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'phone' => $fields['phone'] ?? null,
            'password' => Hash::make($fields['password']),
            'role' => $fields['role'],
            'verification_code' => $code,
            'brand_name' => $sellerBrandName,
        ]);

        if ($user->role === 'seller') {
            Brand::create([
                'user_id' => $user->id,
                'name' => $user->brand_name,
            ]);
        }

        $this->sendVerificationCode($user, 'Failed to send verification code');

        return $user;
    }
}
