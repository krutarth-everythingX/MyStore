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
