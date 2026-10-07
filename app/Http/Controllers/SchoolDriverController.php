<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SchoolTrip;
use App\Models\SchoolDriverAlert;

class SchoolDriverController extends Controller
{
    public function viewAssignedTrips()
    {
        $trips = SchoolTrip::with(['school', 'route', 'students.parent'])
                ->where('driver_id', auth()->id())
                ->get();
                
        return response()->json($trips);
    }

    public function sendAlert(Request $request)
    {
        $request->validate([
            'school_id' => 'required|exists:users,id',
            'message' => 'required|string'
        ]);

        $alert = SchoolDriverAlert::create([
            'driver_id' => auth()->id(),
            'school_id' => $request->school_id,
            'message' => $request->message
        ]);

        return response()->json(['message' => 'Alert sent to School Admin', 'data' => $alert]);
    }
}
