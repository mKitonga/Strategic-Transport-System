<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaccoAdminController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $driverBase = DB::table('users')
            ->where('role', 'sacco_driver')
            ->where('sacco_name', $admin->sacco_name);

        return response()->json([
            'stats' => [
                'pending_driver_approvals' => (clone $driverBase)->where('status', 'pending_approval')->count(),
                'active_routes' => DB::table('sacco_routes')->where('sacco_admin_id', $admin->id)->count(),
                'queue_waiting' => DB::table('driver_queue_entries')->where('sacco_admin_id', $admin->id)->where('status', 'waiting')->count(),
                'open_complaints' => DB::table('sacco_complaints')->where('route_name', $admin->route_name)->where('status', 'open')->count(),
            ],
        ]);
    }

    public function drivers(Request $request): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $drivers = DB::table('users')
            ->select('id', 'name', 'phone', 'email', 'matatu_name', 'number_plate', 'status', 'sacco_name')
            ->where('role', 'sacco_driver')
            ->where('sacco_name', $admin->sacco_name)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'drivers' => $drivers,
        ]);
    }

    public function approveDriver(Request $request, int $driverId): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $driver = DB::table('users')
            ->where('id', $driverId)
            ->where('role', 'sacco_driver')
            ->where('sacco_name', $admin->sacco_name)
            ->first();

        abort_unless($driver, 404, 'Driver not found for this SACCO.');

        DB::table('users')
            ->where('id', $driverId)
            ->update([
                'status' => 'active',
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Driver approved successfully.',
        ]);
    }

    public function routes(Request $request): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $routes = DB::table('sacco_routes')
            ->where('sacco_admin_id', $admin->id)
            ->orderBy('created_at')
            ->get()
            ->map(function ($route) {
                $terminals = DB::table('route_terminals')
                    ->where('sacco_route_id', $route->id)
                    ->orderBy('terminal_order')
                    ->get(['id', 'terminal_name', 'terminal_order']);

                return [
                    'id' => $route->id,
                    'route_name' => $route->route_name,
                    'sacco_name' => $route->sacco_name,
                    'location' => $route->location,
                    'terminals' => $terminals,
                ];
            })
            ->values();

        return response()->json(['routes' => $routes]);
    }

    public function storeRoute(Request $request): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $validated = $request->validate([
            'route_name' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'terminals' => ['required', 'array', 'min:1'],
            'terminals.*' => ['required', 'string', 'max:255'],
        ]);

        $routeId = DB::table('sacco_routes')->insertGetId([
            'sacco_admin_id' => $admin->id,
            'sacco_name' => $admin->sacco_name,
            'route_name' => $validated['route_name'],
            'location' => $validated['location'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach (array_values($validated['terminals']) as $index => $terminal) {
            DB::table('route_terminals')->insert([
                'sacco_route_id' => $routeId,
                'terminal_name' => $terminal,
                'terminal_order' => $index + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Route and terminals added successfully.',
        ], 201);
    }

    public function fares(Request $request): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $routes = DB::table('sacco_routes')
            ->where('sacco_admin_id', $admin->id)
            ->orderBy('route_name')
            ->get()
            ->map(function ($route) {
                $terminals = DB::table('route_terminals')
                    ->where('sacco_route_id', $route->id)
                    ->orderBy('terminal_order')
                    ->get(['id', 'terminal_name', 'terminal_order']);

                $fares = DB::table('sacco_fares')
                    ->where('sacco_route_id', $route->id)
                    ->orderByDesc('updated_at')
                    ->get()
                    ->map(function ($fare) use ($terminals) {
                        $from = $terminals->firstWhere('id', $fare->from_terminal_id);
                        $to = $terminals->firstWhere('id', $fare->to_terminal_id);

                        return [
                            'id' => $fare->id,
                            'amount' => (float) $fare->amount,
                            'peak_amount' => $fare->peak_amount !== null ? (float) $fare->peak_amount : null,
                            'off_peak_amount' => $fare->off_peak_amount !== null ? (float) $fare->off_peak_amount : null,
                            'from_terminal_id' => $fare->from_terminal_id,
                            'to_terminal_id' => $fare->to_terminal_id,
                            'from_terminal_name' => $from->terminal_name ?? 'Unknown',
                            'to_terminal_name' => $to->terminal_name ?? 'Unknown',
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

        return response()->json(['routes' => $routes]);
    }

    public function storeFare(Request $request): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $validated = $request->validate([
            'sacco_route_id' => ['required', 'integer'],
            'from_terminal_id' => ['required', 'integer'],
            'to_terminal_id' => ['required', 'integer', 'different:from_terminal_id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'peak_amount' => ['nullable', 'numeric', 'min:0'],
            'off_peak_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $route = DB::table('sacco_routes')
            ->where('id', $validated['sacco_route_id'])
            ->where('sacco_admin_id', $admin->id)
            ->first();

        abort_unless($route, 404, 'Route not found for this SACCO admin.');

        DB::table('sacco_fares')->updateOrInsert(
            [
                'sacco_route_id' => $validated['sacco_route_id'],
                'from_terminal_id' => $validated['from_terminal_id'],
                'to_terminal_id' => $validated['to_terminal_id'],
            ],
            [
                'amount' => $validated['amount'],
                'peak_amount' => $validated['peak_amount'] ?? null,
                'off_peak_amount' => $validated['off_peak_amount'] ?? null,
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Fare saved successfully.',
        ]);
    }

    public function queue(Request $request): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $entries = DB::table('driver_queue_entries as q')
            ->join('users as d', 'd.id', '=', 'q.driver_id')
            ->leftJoin('sacco_routes as r', 'r.id', '=', 'q.assigned_route_id')
            ->where('q.sacco_admin_id', $admin->id)
            ->select(
                'q.id',
                'q.station_location',
                'q.notified_at',
                'q.queue_position',
                'q.assigned_route_name',
                'q.status',
                'q.departed_at',
                'd.id as driver_id',
                'd.name',
                'd.phone',
                'd.number_plate',
                'd.matatu_name',
                'r.route_name as route_name'
            )
            ->orderBy('q.queue_position')
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'driver_id' => $entry->driver_id,
                    'full_name' => $entry->name,
                    'phone' => $entry->phone,
                    'number_plate' => $entry->number_plate,
                    'matatu_name' => $entry->matatu_name,
                    'station_location' => $entry->station_location,
                    'notified_at' => $entry->notified_at,
                    'queue_position' => $entry->queue_position,
                    'assigned_route_name' => $entry->assigned_route_name ?: $entry->route_name,
                    'status' => $entry->status,
                    'departed_at' => $entry->departed_at,
                ];
            })
            ->values();

        $routes = DB::table('sacco_routes')
            ->where('sacco_admin_id', $admin->id)
            ->orderBy('route_name')
            ->get(['id', 'route_name']);

        return response()->json([
            'queue_entries' => $entries,
            'routes' => $routes,
        ]);
    }

    public function dispatchQueueEntry(Request $request, int $entryId): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $validated = $request->validate([
            'assigned_route_id' => ['required', 'integer'],
        ]);

        $route = DB::table('sacco_routes')
            ->where('id', $validated['assigned_route_id'])
            ->where('sacco_admin_id', $admin->id)
            ->first();

        abort_unless($route, 404, 'Assigned route not found.');

        DB::table('driver_queue_entries')
            ->where('id', $entryId)
            ->where('sacco_admin_id', $admin->id)
            ->update([
                'assigned_route_id' => $route->id,
                'assigned_route_name' => $route->route_name,
                'status' => 'dispatched',
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Driver dispatched successfully.',
        ]);
    }

    public function markQueueLeft(Request $request, int $entryId): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        DB::table('driver_queue_entries')
            ->where('id', $entryId)
            ->where('sacco_admin_id', $admin->id)
            ->update([
                'status' => 'left',
                'departed_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Driver marked as left.',
        ]);
    }

    public function schoolRequests(Request $request): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $requests = DB::table('school_transport_requests')
            ->where(function ($query) use ($admin) {
                $query
                    ->whereNull('preferred_sacco_admin_id')
                    ->orWhere('preferred_sacco_admin_id', $admin->id);
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($schoolRequest) use ($admin) {
                $assignments = DB::table('school_transport_assignments as a')
                    ->join('users as d', 'd.id', '=', 'a.driver_id')
                    ->where('a.request_id', $schoolRequest->id)
                    ->where('a.sacco_admin_id', $admin->id)
                    ->select('d.name', 'd.phone', 'd.number_plate')
                    ->get();

                return [
                    'id' => $schoolRequest->id,
                    'school_name' => $schoolRequest->school_name,
                    'location' => $schoolRequest->location,
                    'requested_vehicles' => $schoolRequest->requested_vehicles,
                    'notes' => $schoolRequest->notes,
                    'status' => $schoolRequest->status,
                    'requested_at' => $schoolRequest->requested_at,
                    'assigned_drivers' => $assignments,
                ];
            })
            ->values();

        $drivers = DB::table('users')
            ->where('role', 'sacco_driver')
            ->where('sacco_name', $admin->sacco_name)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'number_plate']);

        return response()->json([
            'requests' => $requests,
            'drivers' => $drivers,
        ]);
    }

    public function assignSchoolDrivers(Request $request, int $requestId): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $validated = $request->validate([
            'driver_ids' => ['required', 'array', 'min:1'],
            'driver_ids.*' => ['integer'],
        ]);

        $schoolRequest = DB::table('school_transport_requests')->where('id', $requestId)->first();
        abort_unless($schoolRequest, 404, 'School request not found.');

        DB::table('school_transport_assignments')
            ->where('request_id', $requestId)
            ->where('sacco_admin_id', $admin->id)
            ->delete();

        foreach ($validated['driver_ids'] as $driverId) {
            $driver = DB::table('users')
                ->where('id', $driverId)
                ->where('role', 'sacco_driver')
                ->where('sacco_name', $admin->sacco_name)
                ->first();

            if (! $driver) {
                continue;
            }

            DB::table('school_transport_assignments')->insert([
                'request_id' => $requestId,
                'sacco_admin_id' => $admin->id,
                'driver_id' => $driverId,
                'sent_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('school_transport_requests')
            ->where('id', $requestId)
            ->update([
                'status' => 'drivers_assigned',
                'updated_at' => now(),
            ]);

        if ($schoolRequest->school_admin_id) {
            DB::table('school_transport_notifications')->insert([
                'school_admin_id' => $schoolRequest->school_admin_id,
                'source_user_id' => $admin->id,
                'source_role' => 'sacco_admin',
                'school_name' => $schoolRequest->school_name,
                'location' => $schoolRequest->location,
                'subject' => 'SACCO driver list prepared',
                'message' => 'The selected SACCO admin has prepared and sent a driver list for your school request.',
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Driver list sent to school admin successfully.',
        ]);
    }

    public function complaints(Request $request): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $traditionalComplaints = DB::table('sacco_complaints')
            ->where('route_name', $admin->route_name)
            ->select('*', DB::raw("'sacco_traditional' as source_table"))
            ->get();

        $passengerComplaints = DB::table('passenger_complaints')
            ->where('assigned_admin_id', $admin->id)
            ->select('*', DB::raw("'passenger_unified' as source_table"))
            ->get();

        return response()->json([
            'complaints' => $traditionalComplaints->concat($passengerComplaints)->sortByDesc('created_at')->values(),
        ]);
    }

    public function respondComplaint(Request $request, int $complaintId): JsonResponse
    {
        $admin = $this->requireSaccoAdmin($request);

        $validated = $request->validate([
            'response_message' => ['required', 'string', 'max:1000'],
            'source_table' => ['nullable', 'string', 'in:sacco_traditional,passenger_unified'],
        ]);

        $source = $validated['source_table'] ?? 'sacco_traditional';

        if ($source === 'passenger_unified') {
            DB::table('passenger_complaints')
                ->where('id', $complaintId)
                ->where('assigned_admin_id', $admin->id)
                ->update([
                    'response_message' => $validated['response_message'],
                    'responded_by' => $admin->id,
                    'responded_at' => now(),
                    'status' => 'acknowledged',
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('sacco_complaints')
                ->where('id', $complaintId)
                ->where('route_name', $admin->route_name)
                ->update([
                    'response_message' => $validated['response_message'],
                    'responded_by' => $admin->id,
                    'responded_at' => now(),
                    'status' => 'responded',
                    'updated_at' => now(),
                ]);
        }

        return response()->json([
            'message' => 'Complaint response sent successfully.',
        ]);
    }

    private function requireSaccoAdmin(Request $request): object
    {
        $user = $request->user();

        abort_unless($user && $user->role === 'sacco_admin', 403, 'Only SACCO admins can access this resource.');

        return $user;
    }
}
