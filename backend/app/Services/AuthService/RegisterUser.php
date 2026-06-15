<?php

namespace App\Services\AuthService;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RegisterUser
{
    public function handle(array $fields): User
    {
        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'phone' => $fields['phone'] ?? null,
            'password' => Hash::make($fields['password']),
            'role' => $fields['role'],
            'verification_code' => null,
            'verification_code_sent_at' => null,
            'brand_name' => null,
        ]);

        return $user;
    }
}
