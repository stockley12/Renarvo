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
        // Flat platform service fee in whole TRY (matches stored/displayed prices).
        'service_fee' => (int) env('PLATFORM_SERVICE_FEE', 120),
    ],
    'payments' => [
        'iyzico' => [
            'webhook_secret' => env('IYZICO_WEBHOOK_SECRET'),
            'api_key' => env('IYZICO_API_KEY'),
            'api_secret' => env('IYZICO_API_SECRET'),
        ],
    ],
    /*
    |--------------------------------------------------------------------------
    | TIKO Sanal POS (Figensoft)
    |--------------------------------------------------------------------------
    |
    | TIKO_MODE drives both the API base URL and the IsTest flag in hashes.
    |   - 'sandbox' = test gateway, IsTest=1
    |   - 'live'    = production gateway, IsTest=0
    |   - 'disabled'= integration off (frontend hides the pay button)
    |
    | URLs are pulled from the official v1.1.3 spec; override only if TIKO
    | issues new endpoints.
    |
    */
    'tiko' => [
        'mode' => env('TIKO_MODE', 'disabled'),
        'merchant_id' => env('TIKO_MERCHANT_ID'),
        'username' => env('TIKO_USERNAME'),
        'secret' => env('TIKO_SECRET'),
        'password' => env('TIKO_PASSWORD'),
        'currency' => env('TIKO_CURRENCY', 'TRY'),
        'sandbox_base' => env('TIKO_SANDBOX_BASE', 'https://test.tikokart.com/api-sanalpos'),
        'live_base' => env('TIKO_LIVE_BASE', 'https://www.tikokart.com/api-sanalpos'),
        'paths' => [
            'pay3d' => '/gateway/pay3d',
            'pay' => '/gateway/pay',
            'onus3d' => '/gateway/onus3D',
            'status' => '/payment/status',
            'cancel' => '/payment/cancel',
            'binquery' => '/card/binquery',
            'link' => '/link/send',
        ],
        'urls' => [
            'return_ok' => env('TIKO_RETURN_OK', env('APP_URL').'/payment/result'),
            'return_fail' => env('TIKO_RETURN_FAIL', env('APP_URL').'/payment/result'),
            'callback' => env('TIKO_CALLBACK', env('APP_URL').'/api/v1/payments/tiko/callback'),
        ],
        'http_timeout' => (int) env('TIKO_HTTP_TIMEOUT', 20),
        'allow_callback_ips' => array_filter(array_map('trim', explode(',', (string) env('TIKO_CALLBACK_IPS', '')))),
    ],
    /*
    |--------------------------------------------------------------------------
    | Posta Güvercini — JSON OTP SMS
    |--------------------------------------------------------------------------
    |
    | Used to send one-time passcodes for login and account creation.
    |   - SMS_OTP_MODE = 'live'     sends real SMS via the provider
    |   - SMS_OTP_MODE = 'disabled' skips the provider (codes are logged, and
    |                                returned in the API response so the flow
    |                                stays testable before credentials land)
    |
    | Docs: https://otpsms.postaguvercini.com/api_json (Send_1_N / Status)
    |
    */
    'postaguvercini' => [
        'mode' => env('SMS_OTP_MODE', 'disabled'),
        'base_url' => env('POSTAGUVERCINI_BASE_URL', 'https://otpsms.postaguvercini.com/api_json'),
        'username' => env('POSTAGUVERCINI_USERNAME'),
        'password' => env('POSTAGUVERCINI_PASSWORD'),
        'http_timeout' => (int) env('POSTAGUVERCINI_HTTP_TIMEOUT', 15),
        // OTP behaviour
        'code_length' => (int) env('SMS_OTP_LENGTH', 6),
        'code_ttl' => (int) env('SMS_OTP_TTL', 300),          // seconds a code stays valid
        'resend_cooldown' => (int) env('SMS_OTP_RESEND_COOLDOWN', 60), // seconds between sends
        'max_attempts' => (int) env('SMS_OTP_MAX_ATTEMPTS', 5),        // verify tries per code
        'brand' => env('SMS_OTP_BRAND', 'Renarvo'),
    ],
];
