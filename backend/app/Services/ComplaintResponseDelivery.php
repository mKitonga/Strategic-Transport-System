<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ComplaintResponseDelivery
{
    public function send(object $complaint, string $responseMessage): array
    {
        $results = [];
        $subject = 'Update on your transport complaint';
        $body = "Your complaint (#{$complaint->id}) has received a response.\n\n"
            . $responseMessage
            . "\n\nService: {$complaint->service_name}";

        if (! empty($complaint->passenger_email)) {
            try {
                Mail::raw($body, function ($mail) use ($complaint, $subject) {
                    $mail->to($complaint->passenger_email)->subject($subject);
                });
                $results['email'] = ['status' => 'sent', 'destination' => $complaint->passenger_email];
            } catch (Throwable $exception) {
                report($exception);
                $results['email'] = ['status' => 'failed', 'destination' => $complaint->passenger_email];
            }
        }

        if (! empty($complaint->passenger_phone)) {
            $results['sms'] = $this->sendSms($complaint->passenger_phone, $body);
        }

        if ($results === []) {
            $results['contact'] = ['status' => 'unavailable', 'message' => 'No complainant contact was saved.'];
        }

        return $results;
    }

    private function sendSms(string $phone, string $message): array
    {
        $config = config('services.africas_talking');
        if (empty($config['api_key']) || empty($config['username'])) {
            return ['status' => 'not_configured', 'message' => 'Configure AT_USERNAME and AT_API_KEY to send SMS.'];
        }

        $phone = $this->toInternationalPhone($phone);
        if (! $phone) {
            return ['status' => 'failed', 'message' => 'The saved phone number is invalid.'];
        }

        $sandbox = strtolower((string) ($config['environment'] ?? 'sandbox')) !== 'live';
        $endpoint = $sandbox
            ? 'https://api.sandbox.africastalking.com/version1/messaging'
            : 'https://api.africastalking.com/version1/messaging';

        try {
            $payload = [
                'username' => $config['username'],
                'to' => $phone,
                'message' => $message,
            ];
            if (! empty($config['sender_id'])) {
                $payload['from'] = $config['sender_id'];
            }

            $response = Http::timeout(15)
                ->asForm()
                ->withHeaders(['apiKey' => $config['api_key'], 'Accept' => 'application/json'])
                ->post($endpoint, $payload);

            $recipient = data_get($response->json(), 'SMSMessageData.Recipients.0', []);
            $providerStatus = strtolower((string) ($recipient['status'] ?? ''));
            $providerStatusCode = (int) ($recipient['statusCode'] ?? 0);
            $acceptedStatuses = ['success', 'accepted', 'processed', 'sent', 'queued'];

            if ($response->successful() && (
                in_array($providerStatus, $acceptedStatuses, true)
                || in_array($providerStatusCode, [100, 101, 102], true)
            )) {
                return ['status' => 'accepted', 'destination' => $phone];
            }

            return ['status' => 'failed', 'destination' => $phone, 'message' => 'The SMS provider did not accept the message.'];
        } catch (Throwable $exception) {
            report($exception);
            return ['status' => 'failed', 'destination' => $phone, 'message' => 'Could not connect to the SMS provider.'];
        }
    }

    private function toInternationalPhone(string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($digits, '0')) {
            $digits = '254'.substr($digits, 1);
        }

        if (str_starts_with($digits, '254') && strlen($digits) === 12) {
            return '+'.$digits;
        }

        return null;
    }
}
