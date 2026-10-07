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
        Log::info('Daraja Callback Received', $request->all());

        $stkCallback = $request->input('Body.stkCallback');

        if (!$stkCallback) {
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Invalid payload']);
        }

        $merchantRequestID = $stkCallback['MerchantRequestID'] ?? null;
        $checkoutRequestID = $stkCallback['CheckoutRequestID'] ?? null;
        $resultCode = $stkCallback['ResultCode'] ?? 1;

        if ($resultCode == 0) {
            // Success
            $callbackMetadata = $stkCallback['CallbackMetadata']['Item'] ?? [];
            $mpesaReceiptNumber = null;
            $amount = null;

            foreach ($callbackMetadata as $item) {
                if ($item['Name'] === 'MpesaReceiptNumber') {
                    $mpesaReceiptNumber = $item['Value'];
                }
                if ($item['Name'] === 'Amount') {
                    $amount = $item['Value'];
                }
            }

            Log::info("Mpesa Payment Success: {$mpesaReceiptNumber} Amount: {$amount}");

            // Update the payment in DB if we saved CheckoutRequestID somewhere, or we can use MpesaReceiptNumber
            // In our ParentController we generate mpesa_reference. We'll update it there.
            // Since STK Push is async, we ideally need to map CheckoutRequestID to our DB record.
            // For now, let's look up any 'submitted' payment that matches the phone number.
            // Note: In production, we'd add checkout_request_id to the school_trip_payments table.
            
            // To be safe, we just mark matching submitted transactions. Let's do it by Phone.
            // In a robust system, we would add 'checkout_request_id' to school_trip_payments table.
            // I'll update the school_trip_payments table to include checkout_request_id where we initiated.
            
            DB::table('school_trip_payments')
                ->where('checkout_request_id', $checkoutRequestID)
                ->update([
                    'status' => 'approved',
                    'mpesa_reference' => $mpesaReceiptNumber,
                    'approved_at' => now(),
                    'updated_at' => now(),
                ]);

        } else {
            // Failed or Cancelled
            Log::warning("Mpesa Payment Failed: ResultCode {$resultCode}");
            
            DB::table('school_trip_payments')
                ->where('checkout_request_id', $checkoutRequestID)
                ->update([
                    'status' => 'not_paid', // Revert to not_paid so user can try again
                    'updated_at' => now(),
                ]);
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
    }
}
