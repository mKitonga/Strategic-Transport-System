<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DarajaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SaccoDriverController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $driver = $this->requireSaccoDriver($request);

        return response()->json([
            'stats' => [
                'fare_prompts' => DB::table('sacco_passenger_payments')->where('driver_id', $driver->id)->count(),
                'pending_dropoffs' => DB::table('sacco_passenger_payments')->where('driver_id', $driver->id)->whereNull('cleared_at')->count(),
                'queue_alerts' => DB::table('driver_queue_entries')->where('driver_id', $driver->id)->count(),
                'school_assignments' => DB::table('school_transport_assignments')->where('driver_id', $driver->id)->count(),
            ],
        ]);
    }

    public function arrivalStatus(Request $request): JsonResponse
    {
        $driver = $this->requireSaccoDriver($request);

        $entry = DB::table('driver_queue_entries')
            ->where('driver_id', $driver->id)
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'queue_entry' => $entry,
        ]);
    }

    public function notifyArrival(Request $request): JsonResponse
    {
        $driver = $this->requireSaccoDriver($request);

        $validated = $request->validate([
            'station_location' => ['required', 'string', 'max:255'],
        ]);

        $admin = DB::table('users')
            ->where('role', 'sacco_admin')
            ->where('sacco_name', $driver->sacco_name)
            ->first();

        abort_unless($admin, 404, 'No SACCO admin found for this driver.');

        $latestPosition = DB::table('driver_queue_entries')
            ->where('sacco_admin_id', $admin->id)
            ->max('queue_position');

        $entryId = DB::table('driver_queue_entries')->insertGetId([
            'sacco_admin_id' => $admin->id,
            'driver_id' => $driver->id,
            'station_location' => $validated['station_location'],
            'notified_at' => now(),
            'queue_position' => ((int) $latestPosition) + 1,
            'status' => 'waiting',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $entry = DB::table('driver_queue_entries')->where('id', $entryId)->first();

        return response()->json([
            'message' => 'Arrival notification sent successfully.',
            'queue_entry' => $entry,
        ], 201);
    }

    public function fares(Request $request): JsonResponse
    {
        $driver = $this->requireSaccoDriver($request);

        $routes = DB::table('sacco_routes')
            ->where('sacco_name', $driver->sacco_name)
            ->orderBy('route_name')
            ->get()
            ->map(function ($route) {
                $terminals = DB::table('route_terminals')
                    ->where('sacco_route_id', $route->id)
                    ->orderBy('terminal_order')
                    ->get(['id', 'terminal_name', 'terminal_order']);

                $fares = DB::table('sacco_fares')
                    ->where('sacco_route_id', $route->id)
                    ->get()
                    ->map(function ($fare) use ($terminals) {
                        $from = $terminals->firstWhere('id', $fare->from_terminal_id);
                        $to = $terminals->firstWhere('id', $fare->to_terminal_id);

                        return [
                            'id' => $fare->id,
                            'from_terminal_id' => $fare->from_terminal_id,
                            'to_terminal_id' => $fare->to_terminal_id,
                            'from_terminal_name' => $from->terminal_name ?? 'Unknown',
                            'to_terminal_name' => $to->terminal_name ?? 'Unknown',
                            'amount' => (float) $fare->amount,
                            'peak_amount' => $fare->peak_amount !== null ? (float) $fare->peak_amount : null,
                            'off_peak_amount' => $fare->off_peak_amount !== null ? (float) $fare->off_peak_amount : null,
                        ];
                    })
                    ->values();

                return [
                    'id' => $route->id,
                    'route_name' => $route->route_name,
                    'location' => $route->location,
                    'terminals' => $terminals->values(),
                    'fares' => $fares,
                ];
            })
            ->values();

        return response()->json([
            'routes' => $routes,
        ]);
    }

    public function createFarePrompt(Request $request): JsonResponse
    {
        $driver = $this->requireSaccoDriver($request);

        $validated = $request->validate([
            'sacco_route_id' => ['required', 'integer'],
            'boarding_terminal_id' => ['required', 'integer'],
            'dropoff_terminal_id' => ['required', 'integer', 'different:boarding_terminal_id'],
            'passenger_phone' => ['required', 'string', 'regex:/^(\+254[17]\d{8}|0[17]\d{8})$/'],
        ], [
            'passenger_phone.regex' => 'Passenger phone number must be in Kenyan format.',
        ]);

        $route = DB::table('sacco_routes')
            ->where('id', $validated['sacco_route_id'])
            ->where('sacco_name', $driver->sacco_name)
            ->first();
        abort_unless($route, 404, 'Route not found for this SACCO driver.');

        $fare = DB::table('sacco_fares')
            ->where('sacco_route_id', $validated['sacco_route_id'])
            ->where('from_terminal_id', $validated['boarding_terminal_id'])
            ->where('to_terminal_id', $validated['dropoff_terminal_id'])
            ->first();
        abort_unless($fare, 404, 'Fare not found for the selected terminals.');

        // Determine fare amount based on current time (peak vs off-peak)
        $hour = (int) now()->format('G');
        $isWeekday = !in_array(now()->dayOfWeek, [0, 6]);
        $isPeak = $isWeekday && (($hour >= 6 && $hour < 9) || ($hour >= 17 && $hour < 20));

        if ($isPeak && $fare->peak_amount !== null) {
            $fareAmount = (float) $fare->peak_amount;
        } elseif (!$isPeak && $fare->off_peak_amount !== null) {
            $fareAmount = (float) $fare->off_peak_amount;
        } else {
            $fareAmount = (float) $fare->amount;
        }

        $mpesaReference = 'FARE' . Str::upper(Str::random(8));

        // Trigger M-Pesa STK push
        $promptStatus = 'prompt_requested';
        try {
            $daraja = new DarajaService();
            $stkResponse = $daraja->initiateStkPush(
                $validated['passenger_phone'],
                (int) ceil($fareAmount),
                $mpesaReference,
                'SACCO Fare Payment'
            );

            if ($stkResponse && isset($stkResponse['CheckoutRequestID'])) {
                $promptStatus = 'stk_sent';
            }
        } catch (\Exception $e) {
            Log::error('Daraja STK push exception: ' . $e->getMessage());
        }

        $paymentId = DB::table('sacco_passenger_payments')->insertGetId([
            'driver_id' => $driver->id,
            'sacco_route_id' => $validated['sacco_route_id'],
            'boarding_terminal_id' => $validated['boarding_terminal_id'],
            'dropoff_terminal_id' => $validated['dropoff_terminal_id'],
            'passenger_phone' => $validated['passenger_phone'],
            'fare_amount' => $fareAmount,
            'prompt_status' => $promptStatus,
            'prompt_requested_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $message = $promptStatus === 'stk_sent'
            ? 'M-Pesa prompt sent! Ask the passenger to enter their PIN.'
            : 'Fare prompt recorded. M-Pesa prompt could not be sent — check Daraja credentials.';

        return response()->json([
            'message' => $message,
            'fare_applied' => $fareAmount,
            'period' => $isPeak ? 'peak' : 'off-peak',
            'payment' => DB::table('sacco_passenger_payments')->where('id', $paymentId)->first(),
        ], 201);
    }

    public function dropoffs(Request $request): JsonResponse
    {
        $driver = $this->requireSaccoDriver($request);

        $payments = DB::table('sacco_passenger_payments as p')
            ->join('route_terminals as b', 'b.id', '=', 'p.boarding_terminal_id')
            ->join('route_terminals as d', 'd.id', '=', 'p.dropoff_terminal_id')
            ->join('sacco_routes as r', 'r.id', '=', 'p.sacco_route_id')
            ->where('p.driver_id', $driver->id)
            ->select(
                'p.id',
                'p.passenger_phone',
                'p.fare_amount',
                'p.prompt_status',
                'p.cleared_at',
                'r.route_name',
                'b.terminal_name as boarding_terminal',
                'd.terminal_name as dropoff_terminal'
            )
            ->orderByDesc('p.created_at')
            ->get();

        return response()->json([
            'dropoffs' => $payments,
        ]);
    }

    public function clearDropoff(Request $request, int $paymentId): JsonResponse
    {
        $driver = $this->requireSaccoDriver($request);

        DB::table('sacco_passenger_payments')
            ->where('id', $paymentId)
            ->where('driver_id', $driver->id)
            ->update([
                'cleared_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Passenger cleared successfully.',
        ]);
    }

    public function schoolTransport(Request $request): JsonResponse
    {
        $driver = $this->requireSaccoDriver($request);

        $assignments = DB::table('school_transport_assignments as a')
            ->join('school_transport_requests as r', 'r.id', '=', 'a.request_id')
            ->where('a.driver_id', $driver->id)
            ->select('r.id as request_id', 'r.school_name', 'r.location', 'r.requested_vehicles', 'r.notes', 'a.sent_at')
            ->orderByDesc('a.sent_at')
            ->get()
            ->map(function ($assignment) {
                $students = DB::table('users')
                    ->where('role', 'parent')
                    ->where('school_name', $assignment->school_name)
                    ->where('location', $assignment->location)
                    ->orderBy('student_name')
                    ->get(['student_name', 'name as parent_name', 'phone as parent_phone']);

                return [
                    'request_id' => $assignment->request_id,
                    'school_name' => $assignment->school_name,
                    'location' => $assignment->location,
                    'requested_vehicles' => $assignment->requested_vehicles,
                    'notes' => $assignment->notes,
                    'sent_at' => $assignment->sent_at,
                    'students' => $students,
                ];
            })
            ->values();

        $closingAssignments = DB::table('school_closing_trip_assignments as a')
            ->join('school_closing_trips as t', 't.id', '=', 'a.school_closing_trip_id')
            ->join('users as p', 'p.id', '=', 'a.parent_id')
            ->where('a.sacco_driver_id', $driver->id)
            ->select(
                't.id as trip_id',
                't.school_name',
                't.location',
                't.closing_day',
                'a.student_name',
                'a.grade',
                'p.name as parent_name',
                'p.phone as parent_phone',
                'p.location as home_location'
            )
            ->orderBy('t.closing_day')
            ->get()
            ->groupBy('trip_id')
            ->map(function ($items, $tripId) {
                $first = $items->first();
                return [
                    'trip_id' => (int) $tripId,
                    'school_name' => $first->school_name,
                    'location' => $first->location,
                    'closing_day' => $first->closing_day,
                    'students' => $items->map(function ($student) {
                        return [
                            'student_name' => $student->student_name,
                            'grade' => $student->grade,
                            'parent_name' => $student->parent_name,
                            'parent_phone' => $student->parent_phone,
                            'home_location' => $student->home_location,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return response()->json([
            'assignments' => $assignments,
            'closing_assignments' => $closingAssignments,
        ]);
    }

    public function sendSchoolUpdate(Request $request): JsonResponse
    {
        $driver = $this->requireSaccoDriver($request);

        $validated = $request->validate([
            'request_id' => ['required', 'integer'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $assignment = DB::table('school_transport_assignments as a')
            ->join('school_transport_requests as r', 'r.id', '=', 'a.request_id')
            ->where('a.request_id', $validated['request_id'])
            ->where('a.driver_id', $driver->id)
            ->select('r.school_admin_id', 'r.school_name', 'r.location')
            ->first();

        abort_unless($assignment && $assignment->school_admin_id, 404, 'No linked school admin found for this assignment.');

        DB::table('school_transport_notifications')->insert([
            'school_admin_id' => $assignment->school_admin_id,
            'source_user_id' => $driver->id,
            'source_role' => 'sacco_driver',
            'school_name' => $assignment->school_name,
            'location' => $assignment->location,
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'status' => 'open',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'School update sent successfully.',
        ], 201);
    }

    private function requireSaccoDriver(Request $request): object
    {
        $user = $request->user();

        abort_unless($user && $user->role === 'sacco_driver', 403, 'Only SACCO drivers can access this resource.');

        return $user;
    }
}
