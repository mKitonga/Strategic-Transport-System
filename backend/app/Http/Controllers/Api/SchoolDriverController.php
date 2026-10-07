<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolDriverController extends Controller
{
    public function trips(Request $request): JsonResponse
    {
        $driver = $this->requireSchoolDriver($request);

        $trips = DB::table('school_daily_trip_assignments as a')
            ->join('school_daily_trips as t', 't.id', '=', 'a.school_daily_trip_id')
            ->leftJoin('school_routes as r', 'r.id', '=', 't.school_route_id')
            ->join('users as p', 'p.id', '=', 'a.parent_id')
            ->where('a.school_driver_id', $driver->id)
            ->select(
                't.id as trip_id',
                't.grade',
                't.pickup_time',
                't.dropoff_time',
                't.amount',
                'r.route_name',
                'a.assigned_pickup_time',
                'a.student_name',
                'p.name as parent_name',
                'p.phone as parent_phone',
                'p.location as home_location'
            )
            ->orderBy('t.pickup_time')
            ->get()
            ->groupBy('trip_id')
            ->map(function ($items, $tripId) {
                $first = $items->first();

                return [
                    'trip_id' => (int) $tripId,
                    'route_name' => $first->route_name,
                    'grade' => $first->grade,
                    'pickup_time' => $first->pickup_time,
                    'dropoff_time' => $first->dropoff_time,
                    'amount' => (float) $first->amount,
                    'assigned_pickup_time' => $first->assigned_pickup_time,
                    'students' => $items->map(function ($student) {
                        return [
                            'student_name' => $student->student_name,
                            'parent_name' => $student->parent_name,
                            'parent_phone' => $student->parent_phone,
                            'home_location' => $student->home_location,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return response()->json([
            'trips' => $trips,
        ]);
    }

    public function alerts(Request $request): JsonResponse
    {
        $driver = $this->requireSchoolDriver($request);

        $alerts = DB::table('school_transport_notifications')
            ->where('source_user_id', $driver->id)
            ->where('source_role', 'school_driver')
            ->orderByDesc('created_at')
            ->get(['id', 'subject', 'message', 'status', 'created_at']);

        return response()->json([
            'alerts' => $alerts,
        ]);
    }

    public function sendAlert(Request $request): JsonResponse
    {
        $driver = $this->requireSchoolDriver($request);

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $admins = DB::table('users')
            ->where('role', 'school_admin')
            ->where('school_name', $driver->school_name)
            ->where('location', $driver->location)
            ->get(['id']);

        abort_if($admins->isEmpty(), 404, 'No school admin found for this school driver.');

        foreach ($admins as $admin) {
            DB::table('school_transport_notifications')->insert([
                'school_admin_id' => $admin->id,
                'source_user_id' => $driver->id,
                'source_role' => 'school_driver',
                'school_name' => $driver->school_name,
                'location' => $driver->location,
                'subject' => $validated['subject'],
                'message' => $validated['message'],
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Alert sent to school admin successfully.',
        ], 201);
    }

    private function requireSchoolDriver(Request $request): object
    {
        $user = $request->user();

        abort_unless($user && $user->role === 'school_driver', 403, 'Only school drivers can access this resource.');

        return $user;
    }
}
