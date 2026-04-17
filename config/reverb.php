<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Reverb Configuration
    |--------------------------------------------------------------------------
    |
    | Reverb is a real-time WebSocket server for Laravel.
    | Configuration for the Reverb server instance.
    |
    */

    'host' => env('REVERB_HOST', '0.0.0.0'),
    'port' => env('REVERB_PORT', 8000),
    'scheme' => env('REVERB_SCHEME', 'http'),

    'options' => [
        'tls' => false,
    ],

    'ssl' => [
        'certPath' => env('REVERB_SSL_CERT_PATH'),
        'keyPath' => env('REVERB_SSL_KEY_PATH'),
        'passphrase' => env('REVERB_SSL_PASSPHRASE'),
    ],

    /*
    |--------------------------------------------------------------------------
    | CORS Configuration
    |--------------------------------------------------------------------------
    |
    | These are the CORS settings for the WebSocket server.
    | This allows connections from your application domain.
    |
    */

    'cors' => [
        'allowed_origins' => [
            env('APP_URL'),
            'http://localhost',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://whatsapp-clone.test',
            'http://' . env('APP_DOMAIN'),
        ],
        'allowed_headers' => ['*'],
        'allowed_methods' => ['*'],
        'exposed_headers' => [],
        'max_age' => 86400,
        'supports_credentials' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Debug Mode
    |--------------------------------------------------------------------------
    |
    | Enable debug mode for additional logging and diagnostics.
    |
    */

    'debug' => env('APP_DEBUG', false),

];
