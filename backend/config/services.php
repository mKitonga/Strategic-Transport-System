<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'africas_talking' => [
        'username' => env('AT_USERNAME', 'sandbox'),
        'api_key' => env('AT_API_KEY'),
        'sender_id' => env('AT_SENDER_ID'),
        'environment' => env('AT_ENV', 'sandbox'),
    ],

    'daraja' => [
        'environment' => env('DARAJA_ENV', 'sandbox'),
        'consumer_key' => env('DARAJA_CONSUMER_KEY'),
        'consumer_secret' => env('DARAJA_CONSUMER_SECRET'),
        'shortcode' => env('DARAJA_SHORTCODE', '174379'),
        'passkey' => env('DARAJA_PASSKEY'),
        'callback_url' => env('DARAJA_CALLBACK_URL', env('APP_URL', 'http://localhost').'/api/mpesa/callback'),
    ],

];
