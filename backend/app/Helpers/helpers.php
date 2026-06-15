<?php

if (!function_exists('seller_brand_name')) {
    function seller_brand_name(?string $brandName, string $userName): string
    {
        $brandName = trim((string) $brandName);

        return $brandName !== ''
            ? $brandName
            : $userName . "'s Store";
    }
}

if (!function_exists('seller_setup_complete')) {
    function seller_setup_complete(?\App\Models\User $user): bool
    {
        if (! $user || $user->role !== 'seller') {
            return true;
        }

        return filled($user->brand_name)
            && filled($user->gst_number)
            && filled($user->address)
            && filled($user->country)
            && filled($user->default_fulfillment_channel);
    }
}
