<?php

namespace App\Services\AuthService;

use App\Models\Brand;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UpdateProfile
{
    public function handle(User $user, array $fields): User
    {
        $updateData = [
            'name' => $fields['name'] ?? $user->name,
            'email' => $fields['email'] ?? $user->email,
            'phone' => $fields['phone'] ?? $user->phone,
            'brand_name' => $user->role === 'seller'
                ? seller_brand_name($fields['brand_name'] ?? null, $fields['name'])
                : $user->brand_name,
            'address' => $fields['address'] ?? $user->address,
            'city' => $fields['city'] ?? $user->city,
            'state' => $fields['state'] ?? $user->state,
            'country' => $fields['country'] ?? $user->country,
            'pincode' => $fields['pincode'] ?? $user->pincode,
            'country_code' => $fields['country_code'] ?? $user->country_code,
            'gst_number' => $fields['gst_number'] ?? $user->gst_number,
            'shiprocket_email' => $fields['shiprocket_email'] ?? $user->shiprocket_email,
            'shiprocket_password' => isset($fields['shiprocket_password']) && $fields['shiprocket_password'] !== ''
                ? $fields['shiprocket_password']
                : $user->shiprocket_password,
            'card_number' => $fields['card_number'] ?? $user->card_number,
            'card_expiry' => $fields['card_expiry'] ?? $user->card_expiry,
            'card_cvv' => $fields['card_cvv'] ?? $user->card_cvv,
        ];

        if (! empty($fields['password'])) {
            $updateData['password'] = Hash::make($fields['password']);
        }

        $user->update($updateData);

        if ($user->role === 'seller') {
            Brand::updateOrCreate(
                ['user_id' => $user->id],
                ['name' => $user->brand_name],
            );
        }

        return $user->refresh();
    }
}
