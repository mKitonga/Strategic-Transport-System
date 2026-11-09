<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DarajaController extends Controller
{
    public function callback(Request $request): JsonResponse
    {
        $stkCallback = $request->input('Body.stkCallback');
        if (! is_array($stkCallback)) {
            Log::warning('Daraja callback rejected: missing callback or checkout request id.');
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Invalid payload']);
        }
        $checkoutRequestID = $stkCallback['CheckoutRequestID'] ?? null;
        if (! $checkoutRequestID) {
            Log::warning('Daraja callback rejected: missing callback or checkout request id.');
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Invalid payload']);
        }

        $resultCode = (int) ($stkCallback['ResultCode'] ?? 1);
        $payment = DB::table('school_trip_payments')->where('checkout_request_id', $checkoutRequestID)->first();
        if (! $payment) {
            Log::warning('Daraja callback did not match a recorded payment.', ['event' => 'payment_callback_unmatched']);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        }

        if ($payment->status !== 'submitted') {
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Already processed']);
        }

        if ($resultCode === 0) {
            $metadata = collect($stkCallback['CallbackMetadata']['Item'] ?? [])
                ->keyBy('Name');
            $amount = $metadata->get('Amount')['Value'] ?? null;
            $receipt = $metadata->get('MpesaReceiptNumber')['Value'] ?? null;
            if (! is_numeric($amount) || (float) $amount !== (float) (int) $payment->amount || ! $receipt) {
                Log::warning('Daraja successful callback failed amount or receipt verification.', ['event' => 'payment_callback_validation_failed']);
                return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Payment details could not be verified']);
            }

            $updated = DB::table('school_trip_payments')
                ->where('id', $payment->id)->where('status', 'submitted')
                ->update([
                    'status' => 'approved',
                    'mpesa_reference' => $receipt,
                    'approved_at' => now(),
                    'updated_at' => now(),
                ]);
            Log::info('Daraja payment state changed.', ['event' => 'payment_succeeded', 'records_updated' => $updated]);
        } else {
            $updated = DB::table('school_trip_payments')
                ->where('id', $payment->id)->where('status', 'submitted')
                ->update(['status' => 'not_paid', 'updated_at' => now()]);
            Log::warning('Daraja payment state changed.', ['event' => 'payment_failed', 'result_code' => $resultCode, 'records_updated' => $updated]);
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
    }
}
