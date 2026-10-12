<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class DarajaService
{
    private string $environment;
    private string $baseUrl;
    private ?string $lastError = null;

    public function __construct()
    {
        $environment = strtolower((string) config('services.daraja.environment', 'sandbox'));
        $this->environment = str_contains($environment, 'live') ? 'live' : 'sandbox';
        $this->baseUrl = $this->environment === 'live'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    public function lastError(): ?string
    {
        return $this->lastError;
    }

    public function generateAccessToken(): ?string
    {
        $consumerKey = config('services.daraja.consumer_key');
        $consumerSecret = config('services.daraja.consumer_secret');

        if (! $consumerKey || ! $consumerSecret) {
            $this->lastError = 'Daraja consumer key or secret is missing from backend/.env.';
            Log::error('Daraja credentials are not configured.');

            return null;
        }

        try {
            $response = Http::timeout(15)
                ->withBasicAuth($consumerKey, $consumerSecret)
                ->acceptJson()
                ->get($this->baseUrl.'/oauth/v1/generate', [
                    'grant_type' => 'client_credentials',
                ]);
        } catch (Throwable $exception) {
            $this->lastError = 'Could not connect to Daraja to authenticate. Check the server internet connection and try again.';
            Log::error('Daraja OAuth request failed.', ['exception' => $exception->getMessage()]);

            return null;
        }

        if ($response->successful() && $response->json('access_token')) {
            return $response->json('access_token');
        }

        $this->lastError = in_array($response->status(), [400, 401], true)
            ? "Daraja rejected the consumer credentials. Confirm the key and secret are from the same {$this->environment} Daraja app, and that its M-PESA Express (Prompt) product is enabled."
            : "Daraja authentication failed with HTTP {$response->status()}. Check Daraja availability and app credentials.";

        Log::error('Daraja access token request failed.', [
            'environment' => $this->environment,
            'status' => $response->status(),
            'response' => $response->json(),
        ]);

        return null;
    }

    public function initiateStkPush(string $phoneNumber, int $amount, string $reference, string $description): ?array
    {
        $this->lastError = null;
        $token = $this->generateAccessToken();

        if (! $token) {
            return null;
        }

        $shortCode = (string) config('services.daraja.shortcode');
        $passkey = config('services.daraja.passkey');
        $callbackUrl = config('services.daraja.callback_url');
        $formattedPhone = $this->formatPhoneNumber($phoneNumber);

        if (! $shortCode || ! $passkey) {
            $this->lastError = 'Daraja shortcode or Lipa na M-PESA passkey is missing from backend/.env.';

            return null;
        }

        if (! $formattedPhone) {
            $this->lastError = 'Enter a valid Kenyan M-Pesa number, such as 07XXXXXXXX or +2547XXXXXXXX.';

            return null;
        }

        if (! $callbackUrl || ! filter_var($callbackUrl, FILTER_VALIDATE_URL) || parse_url($callbackUrl, PHP_URL_SCHEME) !== 'https') {
            $this->lastError = 'Set DARAJA_CALLBACK_URL to a public HTTPS URL that Daraja can reach.';

            return null;
        }

        if ($amount < 1) {
            $this->lastError = 'The M-Pesa amount must be at least KES 1.';

            return null;
        }

        $timestamp = now()->setTimezone('Africa/Nairobi')->format('YmdHis');
        $password = base64_encode($shortCode.$passkey.$timestamp);
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
            'TransactionDesc' => substr($description, 0, 13),
        ];

        try {
            $response = Http::timeout(25)
                ->withToken($token)
                ->acceptJson()
                ->post($this->baseUrl.'/mpesa/stkpush/v1/processrequest', $payload);
        } catch (Throwable $exception) {
            $this->lastError = 'Could not connect to Daraja to send the M-Pesa prompt. Check the server internet connection and try again.';
            Log::error('Daraja STK request failed.', ['exception' => $exception->getMessage()]);

            return null;
        }

        $result = $response->json();
        if ($response->successful() && isset($result['CheckoutRequestID'])) {
            return $result;
        }

        $descriptionFromProvider = $result['ResponseDescription']
            ?? $result['errorMessage']
            ?? $result['error']
            ?? null;
        $this->lastError = is_string($descriptionFromProvider) && $descriptionFromProvider !== ''
            ? "Daraja rejected the STK prompt: {$descriptionFromProvider}"
            : "Daraja rejected the STK prompt with HTTP {$response->status()}. Check the shortcode, passkey, callback URL, and M-PESA Express product setup.";

        Log::error('Daraja STK push request was rejected.', [
            'environment' => $this->environment,
            'status' => $response->status(),
            'response' => $result,
        ]);

        return null;
    }

    private function formatPhoneNumber(string $phoneNumber): ?string
    {
        $digits = preg_replace('/\D/', '', $phoneNumber);
        if (str_starts_with($digits, '0')) {
            $digits = '254'.substr($digits, 1);
        } elseif (str_starts_with($digits, '7') || str_starts_with($digits, '1')) {
            $digits = '254'.$digits;
        }

        return preg_match('/^254[17]\d{8}$/', $digits) ? $digits : null;
    }
}
