<?php

namespace App\Services\AuthService;

use App\Models\Brand;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UpdateProfile
{
    public function handle(User $user, array $fields): User
    {
        $resolvedCountry = array_key_exists('country', $fields)
            ? country_localization($fields['country'] ?? null)
            : country_localization($user->country);
        $nextPhone = $fields['phone'] ?? $user->phone;
        $nextCountryCode = $fields['country_code']
            ?? ($resolvedCountry['code'] ?? $user->country_code);
        $phoneChanged = array_key_exists('phone', $fields) && $nextPhone !== $user->phone;
        $countryCodeChanged = array_key_exists('country_code', $fields) && $nextCountryCode !== $user->country_code;

        $updateData = [
            'name' => $fields['name'] ?? $user->name,
            'email' => $fields['email'] ?? $user->email,
            'phone' => $nextPhone,
            'brand_name' => $user->role === 'seller'
                ? seller_brand_name($fields['brand_name'] ?? null, $fields['name'] ?? $user->name)
                : $user->brand_name,
            'address' => $fields['address'] ?? $user->address,
            'city' => $fields['city'] ?? $user->city,
            'state' => $fields['state'] ?? $user->state,
            'country' => $resolvedCountry['name'] ?? ($fields['country'] ?? $user->country),
            'pincode' => $fields['pincode'] ?? $user->pincode,
            'country_code' => $nextCountryCode,
            'gst_number' => $fields['gst_number'] ?? $user->gst_number,
            'fulfillment_channels' => array_key_exists('fulfillment_channels', $fields)
                ? $this->cleanFulfillmentChannels($fields['fulfillment_channels'])
                : $user->fulfillment_channels,
            'default_fulfillment_channel' => $fields['default_fulfillment_channel']
                ?? $user->default_fulfillment_channel,
            'shipping_acceptance_time' => $fields['shipping_acceptance_time']
                ?? $user->shipping_acceptance_time,
            'handling_time_business_days' => $fields['handling_time_business_days']
                ?? $user->handling_time_business_days
                ?? 1,
            'seller_settings' => array_key_exists('seller_settings', $fields)
                ? array_replace_recursive($user->seller_settings ?? [], $fields['seller_settings'] ?? [])
                : $user->seller_settings,
            'card_number' => $fields['card_number'] ?? $user->card_number,
            'card_expiry' => $fields['card_expiry'] ?? $user->card_expiry,
            'card_cvv' => $fields['card_cvv'] ?? $user->card_cvv,
        ];

        if (! empty($fields['password'])) {
            $updateData['password'] = Hash::make($fields['password']);
        }

        if ($phoneChanged || $countryCodeChanged) {
            $updateData['phone_verified_at'] = null;
            $updateData['phone_verification_code'] = null;
            $updateData['phone_verification_code_sent_at'] = null;
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

    private function cleanFulfillmentChannels(?array $channels): array
    {
        return array_values(array_filter(array_map(
            static fn ($channel) => is_string($channel) ? trim($channel) : '',
            $channels ?? [],
        )));
    }
}
