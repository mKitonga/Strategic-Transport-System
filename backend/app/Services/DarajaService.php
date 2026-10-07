<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DarajaService
{
    private string $env;
    private string $baseUrl;

    public function __construct()
    {
        $env = strtolower(env('DARAJA_ENV', 'sandbox'));
        $this->env = str_contains($env, 'live') ? 'live' : 'sandbox';
        
        $this->baseUrl = $this->env === 'live' 
            ? 'https://api.safaricom.co.ke' 
            : 'https://sandbox.safaricom.co.ke';
    }

    public function generateAccessToken(): ?string
    {
        $consumerKey = env('DARAJA_CONSUMER_KEY');
        $consumerSecret = env('DARAJA_CONSUMER_SECRET');

        if (!$consumerKey || !$consumerSecret) {
            Log::error('Daraja API credentials not configured.');
            return null;
        }

        $credentials = base64_encode($consumerKey . ':' . $consumerSecret);

        $response = Http::withoutVerifying()->withHeaders([
            'Authorization' => 'Basic ' . $credentials
        ])->get($this->baseUrl . '/oauth/v1/generate?grant_type=client_credentials');

        if ($response->successful()) {
            $token = $response->json('access_token');
            if (!$token) {
                Log::error('Daraja token missing in successful response', ['response' => $response->json()]);
            }
            return $token;
        }

        Log::error('Daraja access token error', [
            'status' => $response->status(),
            'response' => $response->json()
        ]);
        return null;
    }

    public function initiateStkPush(string $phoneNumber, int $amount, string $reference, string $description): ?array
    {
        $token = $this->generateAccessToken();

        if (!$token) {
            return null;
        }

        $shortCode = env('DARAJA_SHORTCODE', '174379');
        $passkey = env('DARAJA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
        $callbackUrl = env('DARAJA_CALLBACK_URL', env('APP_URL') . '/api/mpesa/callback');
        
        $timestamp = date('YmdHis');
        $password = base64_encode($shortCode . $passkey . $timestamp);

        // Safaricom requires phone numbers in 2547XXXXXXXX format
        // The user provided phone_number regex already handles starting with 0 or +254
        $formattedPhone = $this->formatPhoneNumber($phoneNumber);

        $payload = [
            'BusinessShortCode' => $shortCode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => $amount,
            'PartyA' => $formattedPhone,
            'PartyB' => $shortCode,
            'PhoneNumber' => $formattedPhone,
            'CallBackURL' => $callbackUrl,
            'AccountReference' => substr($reference, 0, 12),
            'TransactionDesc' => substr($description, 0, 13)
        ];

        $response = Http::withoutVerifying()->withToken($token)->post(
            $this->baseUrl . '/mpesa/stkpush/v1/processrequest',
            $payload
        );

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Daraja STK push error', [
            'payload' => $payload,
            'response' => $response->json()
        ]);

        return null;
    }

    private function formatPhoneNumber(string $phoneNumber): string
    {
        // Strip everything except numbers
        $phoneNumber = preg_replace('/\D/', '', $phoneNumber);

        // Convert 07... or 01... to 2547... or 2541...
        if (str_starts_with($phoneNumber, '0')) {
            $phoneNumber = '254' . substr($phoneNumber, 1);
        }

        return $phoneNumber;
    }
}
