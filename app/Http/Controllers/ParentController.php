<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\SchoolTrip;
use App\Models\SchoolPayment;
use App\Models\SchoolDriverAlert;
use App\Models\DriverLocation; // Assuming driver locations might be needed for notifications or similar
use App\Models\User;

class ParentController extends Controller
{
    public function registerChild(Request $request)
    {
        $request->validate([
            'school_id' => 'required|exists:users,id',
            'name' => 'required|string',
            'grade' => 'required|string'
        ]);

        $student = Student::create([
            'parent_id' => auth()->id(),
            'school_id' => $request->school_id,
            'name' => $request->name,
            'grade' => $request->grade
        ]);

        return response()->json(['message' => 'Child registered successfully', 'data' => $student]);
    }

    public function getMyChildren()
    {
        $children = Student::with('school')->where('parent_id', auth()->id())->get();
        return response()->json($children);
    }

    public function viewTripsAndRoutes()
    {
        // View school trips that the parent's children are assigned to
        $childIds = Student::where('parent_id', auth()->id())->pluck('id');
        $trips = SchoolTrip::with(['route', 'driver', 'school', 'students' => function($q) use ($childIds) {
            $q->whereIn('students.id', $childIds);
        }])->whereHas('students', function($q) use ($childIds) {
            $q->whereIn('students.id', $childIds);
        })->get();

        return response()->json($trips);
    }

    public function makePayment(Request $request)
    {
        $request->validate([
            'school_trip_id' => 'required|exists:school_trips,id',
            'amount' => 'required|numeric'
        ]);

        $payment = SchoolPayment::create([
            'parent_id' => auth()->id(),
            'school_trip_id' => $request->school_trip_id,
            'amount' => $request->amount,
            'status' => 'pending' // pending admin approval
        ]);

        return response()->json(['message' => 'Payment submitted for approval', 'data' => $payment]);
    }

    public function getDriverNotifications()
    {
        // Normally, drivers alert schools. But if they alert parents, we can fetch driver locations or message broadcast here.
        // For now, getting relevant trips and driver locations.
        $childIds = Student::where('parent_id', auth()->id())->pluck('id');
        $driverIds = SchoolTrip::whereHas('students', function($q) use ($childIds) {
            $q->whereIn('students.id', $childIds);
        })->pluck('driver_id');

        $locations = DriverLocation::with('driver')->whereIn('driver_id', $driverIds)->latest()->get();
        
        return response()->json($locations);
    }

    public function viewSchoolOrganizedTrips($school_id)
    {
        $trips = SchoolTrip::with(['route', 'driver'])->where('school_id', $school_id)->get();
        return response()->json($trips);
    }
}
