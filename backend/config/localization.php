<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Store Localization
    |--------------------------------------------------------------------------
    |
    | Product prices keep their source currency, while order totals are stored
    | in the buyer checkout currency. Exchange rates below are configurable
    | display defaults relative to USD; replace them with scheduled rates when
    | you connect a live rates provider.
    |
    */

    'base_currency' => env('MYSTORE_BASE_CURRENCY', 'USD'),
    'default_country' => env('MYSTORE_DEFAULT_COUNTRY', 'India'),
    'fallback_timezone' => env('MYSTORE_FALLBACK_TIMEZONE', 'UTC'),

    'countries' => [
        'IN' => [
            'name' => 'India',
            'currency' => 'INR',
            'symbol' => 'Rs.',
            'locale' => 'en-IN',
            'timezone' => 'Asia/Kolkata',
            'rate_to_usd' => 0.012,
            'aliases' => ['india', 'bharat', 'in', 'ind'],
        ],
        'US' => [
            'name' => 'United States',
            'currency' => 'USD',
            'symbol' => '$',
            'locale' => 'en-US',
            'timezone' => 'America/New_York',
            'rate_to_usd' => 1.0,
            'aliases' => ['united states', 'united states of america', 'usa', 'us', 'america'],
        ],
        'GB' => [
            'name' => 'United Kingdom',
            'currency' => 'GBP',
            'symbol' => 'GBP ',
            'locale' => 'en-GB',
            'timezone' => 'Europe/London',
            'rate_to_usd' => 1.27,
            'aliases' => ['united kingdom', 'uk', 'gb', 'great britain', 'england'],
        ],
        'CA' => [
            'name' => 'Canada',
            'currency' => 'CAD',
            'symbol' => 'CA$',
            'locale' => 'en-CA',
            'timezone' => 'America/Toronto',
            'rate_to_usd' => 0.73,
            'aliases' => ['canada', 'ca'],
        ],
        'AU' => [
            'name' => 'Australia',
            'currency' => 'AUD',
            'symbol' => 'A$',
            'locale' => 'en-AU',
            'timezone' => 'Australia/Sydney',
            'rate_to_usd' => 0.66,
            'aliases' => ['australia', 'au'],
        ],
        'AE' => [
            'name' => 'United Arab Emirates',
            'currency' => 'AED',
            'symbol' => 'AED ',
            'locale' => 'en-AE',
            'timezone' => 'Asia/Dubai',
            'rate_to_usd' => 0.2723,
            'aliases' => ['united arab emirates', 'uae', 'ae', 'dubai'],
        ],
        'EU' => [
            'name' => 'Europe',
            'currency' => 'EUR',
            'symbol' => 'EUR ',
            'locale' => 'en-IE',
            'timezone' => 'Europe/Paris',
            'rate_to_usd' => 1.08,
            'aliases' => ['europe', 'eu', 'eurozone', 'france', 'germany', 'italy', 'spain', 'ireland'],
        ],
        'SG' => [
            'name' => 'Singapore',
            'currency' => 'SGD',
            'symbol' => 'S$',
            'locale' => 'en-SG',
            'timezone' => 'Asia/Singapore',
            'rate_to_usd' => 0.74,
            'aliases' => ['singapore', 'sg'],
        ],
        'JP' => [
            'name' => 'Japan',
            'currency' => 'JPY',
            'symbol' => 'JPY ',
            'locale' => 'ja-JP',
            'timezone' => 'Asia/Tokyo',
            'rate_to_usd' => 0.0064,
            'aliases' => ['japan', 'jp'],
        ],
    ],
];
