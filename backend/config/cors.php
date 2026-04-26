<?php

$origins = array_filter(array_map('trim', explode(',', (string) env('ALLOWED_ORIGINS', ''))));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'up'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $origins ?: ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Idempotency-Key'],
    'max_age' => 0,
    'supports_credentials' => true,
];
