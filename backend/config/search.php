<?php

return [
    'driver' => env('SEARCH_DRIVER', 'database'),

    'defaults' => [
        'limit' => (int) env('SEARCH_RESULT_LIMIT', 240),
        'timeout' => (float) env('SEARCH_TIMEOUT', 2.0),
    ],

    'meilisearch' => [
        'host' => env('MEILISEARCH_HOST', 'http://127.0.0.1:7700'),
        'key' => env('MEILISEARCH_KEY'),
        'products_index' => env('MEILISEARCH_PRODUCTS_INDEX', 'products'),
    ],
];
