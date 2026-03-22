<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PassengerController extends Controller
{
  public function submitComplaint(Request $request)
{

    $request->validate([
        'sacco_name' => 'required|string',
        'route_id' => 'required|exists:routes,id',
        'complaint' => 'required|string|max:1000'
    ]);

    // Verify the route belongs to the sacco
    $route = Route::where('id', $request->route_id)
                  ->where('sacco_name', $request->sacco_name)
                  ->first();

    if (!$route) {
        return response()->json([
            'message' => 'The selected route does not belong to the specified SACCO'
        ], 422);
    }

    // Create complaint
    $complaint = Complaint::create([
        'passenger_id' => auth()->id(),
        'sacco_name' => $request->sacco_name,
        'route_id' => $route->id,
        'complaint' => $request->complaint,
        'status' => 'pending'
    ]);

    return response()->json([
        'message' => 'Complaint submitted successfully',
        'data' => $complaint
    ], 201);

}
}
