<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SchoolDriverApproval;
use App\Models\SchoolDriverAlert;
use App\Models\Student;
use App\Models\SchoolTrip;
use App\Models\TripStudent;
use App\Models\SchoolPayment;
use App\Models\Message;
use App\Models\User;

class SchoolAdminController extends Controller
{
    public function approveSchoolDriver(Request $request, $id)
    {
        $approval = SchoolDriverApproval::findOrFail($id);
        $approval->update(['status' => $request->status]); // 'approved' or 'rejected'
        return response()->json(['message' => 'Driver status updated']);
    }

    public function getDriverAlerts()
    {
        $alerts = SchoolDriverAlert::with('driver')->where('school_id', auth()->id())->get();
        return response()->json($alerts);
    }

    public function assignStudentsToTrip(Request $request)
    {
        $request->validate([
            'trip_id' => 'required|exists:school_trips,id',
            'student_ids' => 'required|array'
        ]);

        foreach($request->student_ids as $student_id) {
            TripStudent::create([
                'school_trip_id' => $request->trip_id,
                'student_id' => $student_id
            ]);
        }

        return response()->json(['message' => 'Students assigned successfully']);
    }

    public function getPayments()
    {
        $payments = SchoolPayment::with(['parent', 'trip'])->whereHas('trip', function($query) {
            $query->where('school_id', auth()->id());
        })->get();
        
        return response()->json($payments);
    }

    public function approvePayment(Request $request, $id)
    {
        $payment = SchoolPayment::findOrFail($id);
        $payment->update(['status' => $request->status]); // 'approved'
        return response()->json(['message' => 'Payment status updated']);
    }

    public function messageSaccoAdmin(Request $request)
    {
        $request->validate(['message' => 'required', 'sacco_admin_id' => 'required']);
        $message = Message::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $request->sacco_admin_id,
            'message' => $request->message
        ]);
        return response()->json(['message' => 'Message sent to Sacco Admin', 'data' => $message]);
    }

    public function getAssignedDrivers()
    {
        $approvals = SchoolDriverApproval::with('driver')->where('school_id', auth()->id())->where('status', 'approved')->get();
        return response()->json($approvals);
    }

    public function getOrganizedTrips()
    {
        $trips = SchoolTrip::with(['driver', 'route', 'students'])->where('school_id', auth()->id())->get();
        return response()->json($trips);
    }

    public function getSchoolStudents()
    {
        $students = Student::with('parent')->where('school_id', auth()->id())->get();
        return response()->json($students);
    }

    public function createOrganizedTrip(Request $request) 
    {
        $request->validate([
            'trip_date' => 'required|date',
        ]);
        
        $trip = SchoolTrip::create([
            'school_id' => auth()->id(),
            'route_id' => $request->route_id, // nullable
            'driver_id' => $request->driver_id, // nullable
            'vehicle_registration' => $request->vehicle_registration,
            'status' => 'scheduled',
            'trip_date' => $request->trip_date,
        ]);
        return response()->json(['message' => 'Trip organized successfully', 'data' => $trip]);
    }
}
