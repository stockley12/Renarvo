<?php

return [
    'jwt' => [
        'secret' => env('JWT_SECRET'),
        'access_ttl' => (int) env('JWT_ACCESS_TTL', 900),
        'refresh_ttl' => (int) env('JWT_REFRESH_TTL', 2592000),
        'issuer' => env('APP_URL', 'renarvo'),
    ],
    'fx' => [
        'api_url' => env('FX_API_URL', 'https://open.er-api.com/v6/latest/TRY'),
        'url' => env('FX_API_URL', 'https://open.er-api.com/v6/latest/TRY'),
        'base' => env('FX_BASE_CURRENCY', 'TRY'),
    ],
    'platform' => [
        'kdv_bps' => (int) env('PLATFORM_KDV_BPS', 1800),
        'commission_bps' => (int) env('PLATFORM_COMMISSION_BPS', 1200),
        'service_fee_kurus' => (int) env('PLATFORM_SERVICE_FEE_KURUS', 12000),
    ],
    'payments' => [
        'stripe' => [
            'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
            'publishable_key' => env('STRIPE_PUBLISHABLE_KEY'),
            'secret_key' => env('STRIPE_SECRET_KEY'),
        ],
        'iyzico' => [
            'webhook_secret' => env('IYZICO_WEBHOOK_SECRET'),
            'api_key' => env('IYZICO_API_KEY'),
            'api_secret' => env('IYZICO_API_SECRET'),
        ],
    ],
];
