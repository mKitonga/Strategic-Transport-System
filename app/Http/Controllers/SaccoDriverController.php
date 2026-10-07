<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Fare;
use App\Models\DriverArrival;
use App\Models\Payment;
use App\Models\Passenger;
use App\Models\DriverLocation;
use App\Models\SchoolAssignment;
use App\Models\TripPassenger;

class SaccoDriverController extends Controller
{

    /*
    ===============================
    1. VIEW FARES SET BY SACCO ADMIN
    ===============================
    */
    public function viewFares()
    {
        $fares = Fare::with(['route','fromTerminal','toTerminal'])->get();

        return response()->json($fares);
    }


    /*
    ===============================
    2. RECORD PASSENGER PAYMENT
    ===============================
    */
    public function recordPayment(Request $request)
    {

        $request->validate([
            'passenger_name' => 'required|string',
            'amount' => 'required|numeric'
        ]);

        $payment = Payment::create([
            'driver_id' => auth()->id(),
            'passenger_name' => $request->passenger_name,
            'amount' => $request->amount,
            'status' => 'paid'
        ]);

        return response()->json([
            'message' => 'Payment recorded successfully',
            'data' => $payment
        ]);

    }


    /*
    ======================================
    3. NOTIFY SACCO ADMIN OF TERMINAL ARRIVAL
    ======================================
    */
    public function notifyArrival(Request $request)
    {

        $request->validate([
            'terminal_id' => 'required|exists:terminals,id'
        ]);

        $arrival = DriverArrival::create([
            'driver_id' => auth()->id(),
            'terminal_id' => $request->terminal_id,
            'status' => 'waiting'
        ]);

        return response()->json([
            'message' => 'Arrival notification sent to Sacco Admin',
            'data' => $arrival
        ]);

    }


    /*
    ===============================
    4. VIEW QUEUE NUMBER ASSIGNED
    ===============================
    */
    public function viewQueueNumber()
    {

        $arrival = DriverArrival::where('driver_id', auth()->id())
                    ->latest()
                    ->first();

        return response()->json($arrival);

    }


    /*
    ==================================
    5. VIEW PASSENGER DROP OFF DETAILS
    ==================================
    */
    public function viewPassengerDropOff()
    {

        $passengers = Passenger::where('driver_id', auth()->id())->get();

        return response()->json($passengers);

    }


    /*
    ===================================
    6. CHECK SCHOOL TRANSPORT ASSIGNMENT
    ===================================
    */
    public function viewSchoolAssignment()
    {

        $assignment = SchoolAssignment::with('school')
                        ->where('driver_id', auth()->id())
                        ->first();

        return response()->json($assignment);

    }


    /*
    ===================================
    7. VIEW STUDENTS AND PARENT CONTACTS
    ===================================
    */
    public function viewAssignedStudents()
    {

        // TODO: Create Student and Parent models and implement students relationship
        $assignment = SchoolAssignment::where('driver_id', auth()->id())
                        ->first();

        return response()->json($assignment);

    }


    /*
    ===================================
    8. UPDATE CURRENT STAGE / LOCATION
    ===================================
    */
    public function updateCurrentStage(Request $request)
    {

        $request->validate([
            'stage' => 'required|string'
        ]);

        $location = DriverLocation::create([
            'driver_id' => auth()->id(),
            'stage' => $request->stage
        ]);

        return response()->json([
            'message' => 'Location updated successfully',
            'data' => $location
        ]);

    }


    /*
    ===================================
    9. GET FARE BASED ON TERMINALS
    ===================================
    */
    public function getFare(Request $request)
    {

        $request->validate([
            'boarding_terminal_id' => 'required|exists:terminals,id',
            'alighting_terminal_id' => 'required|exists:terminals,id'
        ]);

        $fare = Fare::where('from_terminal_id',$request->boarding_terminal_id)
            ->where('to_terminal_id',$request->alighting_terminal_id)
            ->first();

        if(!$fare){
            return response()->json([
                'message' => 'Fare not found'
            ],404);
        }

        return response()->json($fare);

    }


    /*
    ===================================
    10. SEND M-PESA STK PUSH PROMPT
    ===================================
    */
    public function sendMpesaPrompt(Request $request)
    {

        $request->validate([
            'phone_number' => 'required',
            'boarding_terminal_id' => 'required',
            'alighting_terminal_id' => 'required'
        ]);

        $fare = Fare::where('from_terminal_id',$request->boarding_terminal_id)
            ->where('to_terminal_id',$request->alighting_terminal_id)
            ->first();

        if(!$fare){
            return response()->json(['message'=>'Fare not set'],404);
        }

        $amount = $fare->peak_fare;

        $passenger = TripPassenger::create([
            'driver_id' => auth()->id(),
            'phone_number' => $request->phone_number,
            'boarding_terminal_id' => $request->boarding_terminal_id,
            'alighting_terminal_id' => $request->alighting_terminal_id,
            'fare' => $amount
        ]);

        /*
        ======================
        M-PESA STK PUSH HERE
        ======================
        */

        // Here you will integrate Safaricom Daraja API later

        return response()->json([
            'message' => 'M-Pesa prompt sent',
            'data' => $passenger
        ]);

    }


    /*
    ===================================
    11. VIEW DRIVER PASSENGER LIST
    ===================================
    */
    public function passengerList()
    {

        $passengers = TripPassenger::with([
            'boardingTerminal',
            'alightingTerminal'
        ])
        ->where('driver_id',auth()->id())
        ->get();

        return response()->json($passengers);

    }

}