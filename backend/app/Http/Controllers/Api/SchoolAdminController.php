<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SchoolAdminController extends Controller
{
    public function drivers(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $drivers = DB::table('users')
            ->where('role', 'school_driver')
            ->where('school_name', $admin->school_name)
            ->where('location', $admin->location)
            ->orderBy('created_at')
            ->get(['id', 'name', 'phone', 'email', 'school_name', 'location', 'status']);

        return response()->json([
            'drivers' => $drivers,
        ]);
    }

    public function approveDriver(Request $request, int $driverId): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $driver = DB::table('users')
            ->where('id', $driverId)
            ->where('role', 'school_driver')
            ->where('school_name', $admin->school_name)
            ->where('location', $admin->location)
            ->first();

        abort_unless($driver, 404, 'School driver not found for this school.');

        DB::table('users')
            ->where('id', $driverId)
            ->update([
                'status' => 'active',
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'School driver approved successfully.',
        ]);
    }

    public function notifications(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $notifications = DB::table('school_transport_notifications as n')
            ->leftJoin('users as u', 'u.id', '=', 'n.source_user_id')
            ->where('n.school_admin_id', $admin->id)
            ->select(
                'n.id',
                'n.source_role',
                'n.subject',
                'n.message',
                'n.status',
                'n.created_at',
                'u.name as source_name',
                'u.phone as source_phone'
            )
            ->orderByRaw("CASE WHEN n.status = 'open' THEN 0 ELSE 1 END")
            ->orderByDesc('n.created_at')
            ->get();

        return response()->json([
            'notifications' => $notifications,
        ]);
    }

    public function trips(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        return response()->json([
            'routes' => $this->schoolRoutes($admin),
            'school_drivers' => $this->schoolDrivers($admin),
            'students' => $this->schoolParents($admin),
            'daily_trips' => $this->dailyTrips($admin),
            'educational_trips' => $this->educationalTrips($admin),
            'closing_trips' => $this->closingTrips($admin),
            'sacco_admins' => $this->approvedSaccoAdmins(),
        ]);
    }

    public function storeRoute(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $validated = $request->validate([
            'route_name' => ['required', 'string', 'max:255'],
            'terminals' => ['required', 'array', 'min:1'],
            'terminals.*' => ['required', 'string', 'max:255'],
        ]);

        $routeId = DB::table('school_routes')->insertGetId([
            'school_admin_id' => $admin->id,
            'school_name' => $admin->school_name,
            'location' => $admin->location,
            'route_name' => $validated['route_name'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach (array_values($validated['terminals']) as $index => $terminal) {
            DB::table('school_route_terminals')->insert([
                'school_route_id' => $routeId,
                'terminal_name' => $terminal,
                'terminal_order' => $index + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'School route and terminals created successfully.',
        ], 201);
    }

    public function storeDailyTrip(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $validated = $request->validate([
            'school_route_id' => ['required', 'integer'],
            'grade' => ['required', 'string', 'max:255'],
            'pickup_time' => ['required', 'date_format:H:i'],
            'dropoff_time' => ['required', 'date_format:H:i'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $route = DB::table('school_routes')
            ->where('id', $validated['school_route_id'])
            ->where('school_admin_id', $admin->id)
            ->first();

        abort_unless($route, 404, 'School route not found.');

        DB::table('school_daily_trips')->insert([
            'school_admin_id' => $admin->id,
            'school_route_id' => $route->id,
            'school_name' => $admin->school_name,
            'location' => $admin->location,
            'grade' => $validated['grade'],
            'pickup_time' => $validated['pickup_time'],
            'dropoff_time' => $validated['dropoff_time'],
            'amount' => $validated['amount'],
            'status' => 'published',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Daily pickup and drop-off trip published successfully.',
        ], 201);
    }

    public function assignDailyTripStudents(Request $request, int $tripId): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $validated = $request->validate([
            'school_driver_id' => ['required', 'integer'],
            'assigned_pickup_time' => ['required', 'date_format:H:i'],
            'parent_ids' => ['required', 'array', 'min:1'],
            'parent_ids.*' => ['integer'],
        ]);

        $trip = DB::table('school_daily_trips')
            ->where('id', $tripId)
            ->where('school_admin_id', $admin->id)
            ->first();

        abort_unless($trip, 404, 'Daily trip not found.');

        $driver = DB::table('users')
            ->where('id', $validated['school_driver_id'])
            ->where('role', 'school_driver')
            ->where('school_name', $admin->school_name)
            ->where('location', $admin->location)
            ->first();

        abort_unless($driver, 404, 'School driver not found.');

        foreach ($validated['parent_ids'] as $parentId) {
            $parent = DB::table('users')
                ->where('id', $parentId)
                ->where('role', 'parent')
                ->where('school_name', $admin->school_name)
                ->where('location', $admin->location)
                ->where('grade', $trip->grade)
                ->first();

            if (! $parent) {
                continue;
            }

            $payment = DB::table('school_trip_payments')
                ->where('parent_id', $parent->id)
                ->where('trip_type', 'daily')
                ->where('trip_id', $trip->id)
                ->where('status', 'approved')
                ->first();

            if (! $payment) {
                continue;
            }

            DB::table('school_daily_trip_assignments')->updateOrInsert(
                [
                    'school_daily_trip_id' => $trip->id,
                    'parent_id' => $parent->id,
                ],
                [
                    'school_driver_id' => $driver->id,
                    'student_name' => $parent->student_name,
                    'grade' => $parent->grade,
                    'assigned_pickup_time' => $validated['assigned_pickup_time'],
                    'status' => 'assigned',
                    'sent_to_driver_at' => now(),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        return response()->json([
            'message' => 'Student list compiled and sent to the school driver.',
        ]);
    }

    public function storeEducationalTrip(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $validated = $request->validate([
            'trip_title' => ['required', 'string', 'max:255'],
            'grade' => ['required', 'string', 'max:255'],
            'destination' => ['required', 'string', 'max:255'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'amount' => ['required', 'numeric', 'min:0'],
            'trip_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::table('school_educational_trips')->insert([
            'school_admin_id' => $admin->id,
            'school_name' => $admin->school_name,
            'location' => $admin->location,
            'grade' => $validated['grade'],
            'trip_title' => $validated['trip_title'],
            'destination' => $validated['destination'],
            'duration_days' => $validated['duration_days'],
            'amount' => $validated['amount'],
            'trip_date' => $validated['trip_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => 'published',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Educational trip published successfully.',
        ], 201);
    }

    public function storeClosingTrip(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $validated = $request->validate([
            'preferred_sacco_admin_id' => ['nullable', 'integer'],
            'closing_day' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! empty($validated['preferred_sacco_admin_id'])) {
            $saccoAdmin = DB::table('users')
                ->where('id', $validated['preferred_sacco_admin_id'])
                ->where('role', 'sacco_admin')
                ->where('status', 'active')
                ->first();

            abort_unless($saccoAdmin, 404, 'Selected SACCO admin is not available.');
        }

        DB::table('school_closing_trips')->insert([
            'school_admin_id' => $admin->id,
            'preferred_sacco_admin_id' => $validated['preferred_sacco_admin_id'] ?? null,
            'school_name' => $admin->school_name,
            'location' => $admin->location,
            'closing_day' => $validated['closing_day'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'published',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'School closing trip published successfully.',
        ], 201);
    }

    public function storeClosingFare(Request $request, int $tripId): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $validated = $request->validate([
            'sacco_route_id' => ['required', 'integer'],
            'from_terminal_id' => ['required', 'integer'],
            'to_terminal_id' => ['required', 'integer', 'different:from_terminal_id'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $closingTrip = DB::table('school_closing_trips')
            ->where('id', $tripId)
            ->where('school_admin_id', $admin->id)
            ->first();

        abort_unless($closingTrip, 404, 'Closing trip not found.');

        $route = DB::table('sacco_routes')
            ->where('id', $validated['sacco_route_id'])
            ->when($closingTrip->preferred_sacco_admin_id, function ($query) use ($closingTrip) {
                $query->where('sacco_admin_id', $closingTrip->preferred_sacco_admin_id);
            })
            ->first();

        abort_unless($route, 404, 'Selected SACCO route is not available for this closing trip.');

        DB::table('school_closing_trip_fares')->updateOrInsert(
            [
                'school_closing_trip_id' => $closingTrip->id,
                'sacco_route_id' => $route->id,
                'from_terminal_id' => $validated['from_terminal_id'],
                'to_terminal_id' => $validated['to_terminal_id'],
            ],
            [
                'amount' => $validated['amount'],
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Closing trip fare saved successfully.',
        ]);
    }

    public function closingAssignments(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        return response()->json([
            'closing_trips' => $this->closingTrips($admin),
            'available_drivers' => $this->assignedSaccoDrivers($admin),
            'students' => $this->schoolParents($admin),
        ]);
    }

    public function assignClosingStudents(Request $request, int $tripId): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $validated = $request->validate([
            'assignments' => ['required', 'array', 'min:1'],
            'assignments.*.parent_id' => ['required', 'integer'],
            'assignments.*.sacco_driver_id' => ['required', 'integer'],
            'assignments.*.school_closing_trip_fare_id' => ['nullable', 'integer'],
        ]);

        $trip = DB::table('school_closing_trips')
            ->where('id', $tripId)
            ->where('school_admin_id', $admin->id)
            ->first();

        abort_unless($trip, 404, 'Closing trip not found.');

        foreach ($validated['assignments'] as $assignment) {
            $parent = DB::table('users')
                ->where('id', $assignment['parent_id'])
                ->where('role', 'parent')
                ->where('school_name', $admin->school_name)
                ->where('location', $admin->location)
                ->first();

            if (! $parent) {
                continue;
            }

            $paymentQuery = DB::table('school_trip_payments')
                ->where('parent_id', $parent->id)
                ->where('trip_type', 'closing')
                ->where('status', 'approved');

            if (! empty($assignment['school_closing_trip_fare_id'])) {
                $paymentQuery->where('trip_id', $assignment['school_closing_trip_fare_id']);
            }

            if (! $paymentQuery->exists()) {
                continue;
            }

            $driver = DB::table('school_transport_assignments as a')
                ->join('users as d', 'd.id', '=', 'a.driver_id')
                ->join('school_transport_requests as r', 'r.id', '=', 'a.request_id')
                ->where('a.driver_id', $assignment['sacco_driver_id'])
                ->where('r.school_name', $admin->school_name)
                ->where('r.location', $admin->location)
                ->select('d.id')
                ->first();

            if (! $driver) {
                continue;
            }

            DB::table('school_closing_trip_assignments')->updateOrInsert(
                [
                    'school_closing_trip_id' => $trip->id,
                    'parent_id' => $parent->id,
                ],
                [
                    'sacco_driver_id' => $assignment['sacco_driver_id'],
                    'student_name' => $parent->student_name,
                    'grade' => $parent->grade,
                    'school_closing_trip_fare_id' => $assignment['school_closing_trip_fare_id'] ?? null,
                    'status' => 'assigned',
                    'sent_to_parent_at' => now(),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        return response()->json([
            'message' => 'Closing trip assignments compiled and posted to parents successfully.',
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $payments = DB::table('school_trip_payments as p')
            ->join('users as u', 'u.id', '=', 'p.parent_id')
            ->where('p.school_admin_id', $admin->id)
            ->select(
                'p.id',
                'p.student_name',
                'p.grade',
                'p.trip_type',
                'p.trip_id',
                'p.amount',
                'p.phone_number',
                'p.mpesa_reference',
                'p.status',
                'p.approved_at',
                'u.name as parent_name'
            )
            ->orderByRaw("CASE WHEN p.status = 'submitted' THEN 0 ELSE 1 END")
            ->orderByDesc('p.created_at')
            ->get();

        return response()->json([
            'payments' => $payments,
        ]);
    }

    public function approvePayment(Request $request, int $paymentId): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        DB::table('school_trip_payments')
            ->where('id', $paymentId)
            ->where('school_admin_id', $admin->id)
            ->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $admin->id,
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Payment approved successfully.',
        ]);
    }

    public function saccoDirectory(Request $request): JsonResponse
    {
        $this->requireSchoolAdmin($request);

        $search = trim((string) $request->query('q', ''));

        $admins = DB::table('users')
            ->where('role', 'sacco_admin')
            ->where('status', 'active')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->where('sacco_name', 'like', '%'.$search.'%')
                        ->orWhere('name', 'like', '%'.$search.'%')
                        ->orWhere('route_name', 'like', '%'.$search.'%')
                        ->orWhere('location', 'like', '%'.$search.'%');
                });
            })
            ->orderBy('sacco_name')
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email', 'sacco_name', 'route_name', 'location']);

        $grouped = $admins
            ->groupBy('sacco_name')
            ->map(function (Collection $items, string $saccoName) {
                return [
                    'sacco_name' => $saccoName,
                    'admins' => $items->values(),
                ];
            })
            ->values();

        return response()->json([
            'saccos' => $grouped,
        ]);
    }

    public function createSaccoRequest(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $validated = $request->validate([
            'preferred_sacco_admin_id' => ['required', 'integer'],
            'requested_vehicles' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $saccoAdmin = DB::table('users')
            ->where('id', $validated['preferred_sacco_admin_id'])
            ->where('role', 'sacco_admin')
            ->where('status', 'active')
            ->first();

        abort_unless($saccoAdmin, 404, 'Selected SACCO admin is not available.');

        DB::table('school_transport_requests')->insert([
            'school_admin_id' => $admin->id,
            'preferred_sacco_admin_id' => $saccoAdmin->id,
            'school_name' => $admin->school_name,
            'location' => $admin->location,
            'requested_vehicles' => $validated['requested_vehicles'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
            'requested_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Vehicle request sent to the selected SACCO admin.',
        ], 201);
    }

    public function sendSaccoMessage(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $validated = $request->validate([
            'sacco_admin_id' => ['required', 'integer'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $saccoAdmin = DB::table('users')
            ->where('id', $validated['sacco_admin_id'])
            ->where('role', 'sacco_admin')
            ->where('status', 'active')
            ->first();

        abort_unless($saccoAdmin, 404, 'Selected SACCO admin is not available.');

        DB::table('school_sacco_messages')->insert([
            'school_admin_id' => $admin->id,
            'sacco_admin_id' => $saccoAdmin->id,
            'school_name' => $admin->school_name,
            'location' => $admin->location,
            'message' => $validated['message'],
            'status' => 'sent',
            'sent_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Message sent to SACCO admin successfully.',
        ], 201);
    }

    public function complaints(Request $request): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $complaints = DB::table('passenger_complaints')
            ->where('assigned_admin_id', $admin->id)
            ->orderByRaw("CASE WHEN status = 'open' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'complaints' => $complaints,
        ]);
    }

    public function respondComplaint(Request $request, int $id): JsonResponse
    {
        $admin = $this->requireSchoolAdmin($request);

        $validated = $request->validate([
            'response_message' => ['required', 'string', 'min:5'],
        ]);

        $complaint = DB::table('passenger_complaints')
            ->where('id', $id)
            ->where('assigned_admin_id', $admin->id)
            ->first();

        abort_unless($complaint, 404, 'Complaint not found.');

        DB::table('passenger_complaints')
            ->where('id', $id)
            ->update([
                'status' => 'acknowledged',
                'response_message' => $validated['response_message'],
                'responded_by' => $admin->id,
                'responded_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Response recorded and passenger notified.',
        ]);
    }

    private function schoolRoutes(object $admin): Collection
    {
        return DB::table('school_routes')
            ->where('school_admin_id', $admin->id)
            ->orderBy('route_name')
            ->get()
            ->map(function ($route) {
                $terminals = DB::table('school_route_terminals')
                    ->where('school_route_id', $route->id)
                    ->orderBy('terminal_order')
                    ->get(['id', 'terminal_name', 'terminal_order']);

                return [
                    'id' => $route->id,
                    'route_name' => $route->route_name,
                    'terminals' => $terminals,
                ];
            })
            ->values();
    }

    private function schoolDrivers(object $admin): Collection
    {
        return DB::table('users')
            ->where('role', 'school_driver')
            ->where('school_name', $admin->school_name)
            ->where('location', $admin->location)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email']);
    }

    private function schoolParents(object $admin): Collection
    {
        return DB::table('users')
            ->where('role', 'parent')
            ->where('school_name', $admin->school_name)
            ->where('location', $admin->location)
            ->orderBy('grade')
            ->orderBy('student_name')
            ->get(['id', 'name as parent_name', 'phone', 'student_name', 'grade', 'admission_number']);
    }

    private function dailyTrips(object $admin): Collection
    {
        return DB::table('school_daily_trips as t')
            ->leftJoin('school_routes as r', 'r.id', '=', 't.school_route_id')
            ->where('t.school_admin_id', $admin->id)
            ->select('t.*', 'r.route_name')
            ->orderBy('t.grade')
            ->orderBy('t.pickup_time')
            ->get()
            ->map(function ($trip) {
                $assignedCount = DB::table('school_daily_trip_assignments')
                    ->where('school_daily_trip_id', $trip->id)
                    ->count();

                $approvedPayments = DB::table('school_trip_payments')
                    ->where('trip_type', 'daily')
                    ->where('trip_id', $trip->id)
                    ->where('status', 'approved')
                    ->count();

                return [
                    'id' => $trip->id,
                    'route_name' => $trip->route_name,
                    'grade' => $trip->grade,
                    'pickup_time' => $trip->pickup_time,
                    'dropoff_time' => $trip->dropoff_time,
                    'amount' => (float) $trip->amount,
                    'assigned_students' => $assignedCount,
                    'approved_payments' => $approvedPayments,
                    'status' => $trip->status,
                ];
            })
            ->values();
    }

    private function educationalTrips(object $admin): Collection
    {
        return DB::table('school_educational_trips')
            ->where('school_admin_id', $admin->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($trip) {
                return [
                    'id' => $trip->id,
                    'trip_title' => $trip->trip_title,
                    'grade' => $trip->grade,
                    'destination' => $trip->destination,
                    'duration_days' => $trip->duration_days,
                    'amount' => (float) $trip->amount,
                    'trip_date' => $trip->trip_date,
                    'notes' => $trip->notes,
                    'status' => $trip->status,
                ];
            })
            ->values();
    }

    private function closingTrips(object $admin): Collection
    {
        return DB::table('school_closing_trips as t')
            ->leftJoin('users as s', 's.id', '=', 't.preferred_sacco_admin_id')
            ->where('t.school_admin_id', $admin->id)
            ->select('t.*', 's.name as sacco_admin_name', 's.sacco_name')
            ->orderByDesc('t.closing_day')
            ->get()
            ->map(function ($trip) {
                $fares = DB::table('school_closing_trip_fares as f')
                    ->join('sacco_routes as r', 'r.id', '=', 'f.sacco_route_id')
                    ->join('route_terminals as from_terminal', 'from_terminal.id', '=', 'f.from_terminal_id')
                    ->join('route_terminals as to_terminal', 'to_terminal.id', '=', 'f.to_terminal_id')
                    ->where('f.school_closing_trip_id', $trip->id)
                    ->select(
                        'f.id',
                        'f.amount',
                        'r.route_name',
                        'from_terminal.terminal_name as from_terminal_name',
                        'to_terminal.terminal_name as to_terminal_name'
                    )
                    ->get()
                    ->map(function ($fare) {
                        return [
                            'id' => $fare->id,
                            'route_name' => $fare->route_name,
                            'from_terminal_name' => $fare->from_terminal_name,
                            'to_terminal_name' => $fare->to_terminal_name,
                            'amount' => (float) $fare->amount,
                        ];
                    })
                    ->values();

                $assignments = DB::table('school_closing_trip_assignments as a')
                    ->join('users as d', 'd.id', '=', 'a.sacco_driver_id')
                    ->where('a.school_closing_trip_id', $trip->id)
                    ->select('a.student_name', 'a.grade', 'd.name as driver_name', 'd.phone as driver_phone', 'd.number_plate')
                    ->get();

                return [
                    'id' => $trip->id,
                    'preferred_sacco_admin_id' => $trip->preferred_sacco_admin_id,
                    'closing_day' => $trip->closing_day,
                    'notes' => $trip->notes,
                    'sacco_admin_name' => $trip->sacco_admin_name,
                    'sacco_name' => $trip->sacco_name,
                    'status' => $trip->status,
                    'fares' => $fares,
                    'assignments' => $assignments,
                ];
            })
            ->values();
    }

    private function approvedSaccoAdmins(): Collection
    {
        return DB::table('users')
            ->where('role', 'sacco_admin')
            ->where('status', 'active')
            ->orderBy('sacco_name')
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'sacco_name', 'route_name', 'location'])
            ->map(function ($admin) {
                $routes = DB::table('sacco_routes')
                    ->where('sacco_admin_id', $admin->id)
                    ->orderBy('route_name')
                    ->get()
                    ->map(function ($route) {
                        $terminals = DB::table('route_terminals')
                            ->where('sacco_route_id', $route->id)
                            ->orderBy('terminal_order')
                            ->get(['id', 'terminal_name', 'terminal_order']);

                        return [
                            'id' => $route->id,
                            'route_name' => $route->route_name,
                            'location' => $route->location,
                            'terminals' => $terminals,
                        ];
                    })
                    ->values();

                return [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'phone' => $admin->phone,
                    'sacco_name' => $admin->sacco_name,
                    'route_name' => $admin->route_name,
                    'location' => $admin->location,
                    'routes' => $routes,
                ];
            })
            ->values();
    }

    private function assignedSaccoDrivers(object $admin): Collection
    {
        return DB::table('school_transport_assignments as a')
            ->join('school_transport_requests as r', 'r.id', '=', 'a.request_id')
            ->join('users as d', 'd.id', '=', 'a.driver_id')
            ->where('r.school_name', $admin->school_name)
            ->where('r.location', $admin->location)
            ->select('d.id', 'd.name', 'd.phone', 'd.number_plate', 'd.matatu_name')
            ->distinct()
            ->orderBy('d.name')
            ->get();
    }

    private function requireSchoolAdmin(Request $request): object
    {
        $user = $request->user();

        abort_unless($user && $user->role === 'school_admin', 403, 'Only school admins can access this resource.');

        return $user;
    }
}
