<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    public function drivers(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin && $admin->role === 'booking_admin', 403, 'Only booking admins can review booking drivers.');

        $companyName = mb_strtolower(trim((string) $admin->company_name));
        abort_if($companyName === '', 422, 'Add your booking company name to your account before reviewing drivers.');

        $drivers = DB::table('users')
            ->where('role', 'booking_driver')
            ->whereRaw('LOWER(TRIM(company_name)) = ?', [$companyName])
            ->orderByRaw("CASE WHEN status = 'pending_approval' THEN 0 ELSE 1 END")
            ->orderBy('created_at')
            ->get(['id', 'name', 'phone', 'email', 'company_name', 'number_plate', 'bus_capacity', 'status', 'created_at']);

        return response()->json(['drivers' => $drivers]);
    }

    public function approveDriver(Request $request, int $driverId): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin && $admin->role === 'booking_admin', 403, 'Only booking admins can approve booking drivers.');

        $companyName = mb_strtolower(trim((string) $admin->company_name));
        abort_if($companyName === '', 422, 'Add your booking company name to your account before approving drivers.');

        $driver = DB::table('users')
            ->where('id', $driverId)
            ->where('role', 'booking_driver')
            ->whereRaw('LOWER(TRIM(company_name)) = ?', [$companyName])
            ->first();

        abort_unless($driver, 404, 'Booking driver not found under your company.');
        abort_if($driver->status !== 'pending_approval', 422, 'This booking driver is not awaiting approval.');

        DB::table('users')->where('id', $driverId)->update([
            'status' => 'active',
            'updated_at' => now(),
        ]);
        Log::info('Driver approval state changed.', ['event' => 'booking_driver_approved', 'admin_id' => $admin->id, 'driver_id' => $driverId]);

        return response()->json(['message' => 'Booking driver approved successfully.']);
    }

    public function companies(): JsonResponse
    {
        $companies = DB::table('users')
            ->where('role', 'booking_admin')
            ->whereNotNull('company_name')
            ->where('company_name', '!=', '')
            ->orderBy('company_name')
            ->orderBy('id')
            ->get(['id', 'company_name', 'location', 'phone', 'email'])
            ->groupBy(fn ($admin) => mb_strtolower(trim($admin->company_name)))
            ->map(function ($admins) {
                $admin = $admins->first();

                return [
                    'id' => $admin->id,
                    'slug' => (string) $admin->id,
                    'name' => $admin->company_name,
                    'location' => $admin->location,
                    'contact_phone' => $admin->phone,
                    'contact_email' => $admin->email,
                    'route_count' => DB::table('booking_routes')->where('booking_admin_id', $admin->id)->count(),
                ];
            })
            ->values();

        return response()->json(['companies' => $companies]);
    }

    public function company(string $slug): JsonResponse
    {
        abort_unless(ctype_digit($slug), 404, 'Booking company not found.');

        $admin = DB::table('users')
            ->where('id', (int) $slug)
            ->where('role', 'booking_admin')
            ->whereNotNull('company_name')
            ->first(['id', 'company_name', 'location', 'phone', 'email']);

        abort_unless($admin, 404, 'Booking company not found.');

        return response()->json([
            'company' => [
                'id' => $admin->id,
                'slug' => (string) $admin->id,
                'name' => $admin->company_name,
                'location' => $admin->location,
                'contact_phone' => $admin->phone,
                'contact_email' => $admin->email,
                'routes' => DB::table('booking_routes')
                    ->where('booking_admin_id', $admin->id)
                    ->orderBy('route_name')
                    ->get()
                    ->map(fn ($route) => $this->formatStoredRoute($route)),
            ],
        ]);
    }

    public function adminRoutes(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin && $admin->role === 'booking_admin', 403, 'Only booking admins can manage booking routes.');

        return response()->json([
            'routes' => DB::table('booking_routes')->where('booking_admin_id', $admin->id)->orderByDesc('id')->get()
                ->map(fn ($route) => $this->formatStoredRoute($route)),
        ]);
    }

    public function createAdminRoute(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin && $admin->role === 'booking_admin', 403, 'Only booking admins can manage booking routes.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'departure' => ['required', 'string', 'max:255'],
            'destination' => ['required', 'string', 'max:255', 'different:departure'],
            'fare' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
        ]);

        $id = DB::transaction(function () use ($data, $admin) {
            $routeId = DB::table('booking_routes')->insertGetId([
                'booking_admin_id' => $admin->id,
                'route_name' => $data['name'],
                'location' => $data['departure'].' to '.$data['destination'],
                'fare' => $data['fare'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ([$data['departure'], $data['destination']] as $index => $terminal) {
                DB::table('booking_route_terminals')->insert([
                    'booking_route_id' => $routeId,
                    'terminal_name' => $terminal,
                    'terminal_order' => $index + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $routeId;
        });

        return response()->json(['route' => $this->formatStoredRoute(DB::table('booking_routes')->where('id', $id)->first())], 201);
    }

    private function formatStoredRoute(object $route): array
    {
        $terminals = DB::table('booking_route_terminals')->where('booking_route_id', $route->id)
            ->orderBy('terminal_order')->get(['id', 'terminal_name', 'terminal_order']);

        return [
            'id' => $route->id,
            'route_name' => $route->route_name,
            'name' => $route->route_name,
            'departure' => $terminals->first()->terminal_name ?? null,
            'destination' => $terminals->last()->terminal_name ?? null,
            'location' => $route->location,
            'fare' => $route->fare === null ? null : (float) $route->fare,
            'terminals' => $terminals,
        ];
    }

    public function route(int $routeId): JsonResponse
    {
        $storedRoute = DB::table('booking_routes')->join('users', 'users.id', '=', 'booking_routes.booking_admin_id')
            ->where('booking_routes.id', $routeId)
            ->select('booking_routes.*', 'users.company_name')
            ->first();

        if ($storedRoute) {
            return response()->json([
                'company' => ['id' => $storedRoute->booking_admin_id, 'name' => $storedRoute->company_name],
                'route' => [...$this->formatStoredRoute($storedRoute), 'trips' => collect()],
            ]);
        }

        [$company, $route] = $this->findRoute($routeId);

        abort_unless($route, 404, 'Route not found.');

        return response()->json([
            'company' => [
                'id' => $company['id'],
                'name' => $company['name'],
            ],
            'route' => [
                'id' => $route['id'],
                'name' => $route['name'],
                'departure' => $route['departure'],
                'destination' => $route['destination'],
                'fare' => $route['fare'],
                'trips' => collect($route['trips'])->map(fn (array $trip) => [
                    'id' => $trip['id'],
                    'time' => $trip['time'],
                    'fare' => $trip['fare'],
                    'driver_name' => $trip['driver_name'],
                    'major_departure_point' => $trip['major_departure_point'],
                    'available_seats' => collect($trip['seats'])->where('available', true)->count(),
                ])->values(),
            ],
        ]);
    }

    public function trip(int $tripId): JsonResponse
    {
        [$company, $route, $trip] = $this->findTrip($tripId);

        abort_unless($trip, 404, 'Trip not found.');

        return response()->json([
            'company' => [
                'id' => $company['id'],
                'name' => $company['name'],
            ],
            'route' => [
                'id' => $route['id'],
                'name' => $route['name'],
                'departure' => $route['departure'],
                'destination' => $route['destination'],
            ],
            'trip' => [
                'id' => $trip['id'],
                'time' => $trip['time'],
                'fare' => $trip['fare'],
                'driver_name' => $trip['driver_name'],
                'major_departure_point' => $trip['major_departure_point'],
                'seats' => $trip['seats'],
            ],
        ]);
    }

    public function bookTrip(Request $request, int $tripId): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'regex:/^(\+254[17]\d{8}|0[17]\d{8})$/'],
            'seat' => ['required', 'string'],
        ], [
            'phone.regex' => 'Phone number must be in Kenyan format.',
        ]);

        [$company, $route, $trip] = $this->findTrip($tripId);

        abort_unless($trip, 404, 'Trip not found.');

        $seat = collect($trip['seats'])->firstWhere('number', $validated['seat']);

        abort_if(! $seat || ! $seat['available'], 422, 'The selected seat is no longer available.');

        return response()->json([
            'message' => 'Seat reserved and payment prompt sent successfully.',
            'payment' => [
                'phone' => $validated['phone'],
                'seat' => $validated['seat'],
                'fare' => $trip['fare'],
                'company' => $company['name'],
                'route' => $route['name'],
                'time' => $trip['time'],
            ],
        ]);
    }

    public function driverOverview(Request $request, int $driverId): JsonResponse
    {
        $driver = $request->user();
        abort_unless($driver && $driver->role === 'booking_driver' && (int) $driver->id === $driverId, 403, 'Only this booking driver can view their trips.');

        return response()->json([
            'driver_id' => $driver->id,
            // Booking trip assignments are not persisted yet; never expose sample config records as driver assignments.
            'assigned_trips' => [],
        ]);
    }

    public function notifyArrival(Request $request, int $tripId): JsonResponse
    {
        $driver = $request->user();
        abort_unless($driver && $driver->role === 'booking_driver', 403, 'Only booking drivers can notify arrival.');

        [, , $trip] = $this->findTrip($tripId);

        abort_unless($trip, 404, 'Trip not found.');
        abort_unless((int) ($trip['driver_id'] ?? $trip['assigned_driver_id'] ?? 0) === (int) $driver->id, 403, 'This trip is not assigned to your account.');

        return response()->json([
            'message' => 'Booking admin has been notified of the driver arrival.',
            'driver_id' => $driver->id,
            'trip_id' => $tripId,
            'major_departure_point' => $trip['major_departure_point'],
            'next_action' => 'Driver can now be considered for another trip assignment.',
        ]);
    }

    public function complaints(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin && $admin->role === 'booking_admin', 403, 'Forbidden.');

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
        $admin = $request->user();
        abort_unless($admin && $admin->role === 'booking_admin', 403, 'Forbidden.');

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
        Log::info('Complaint response saved.', ['event' => 'complaint_responded', 'admin_id' => $admin->id, 'complaint_id' => $id]);

        return response()->json([
            'message' => 'Response recorded and passenger notified.',
        ]);
    }

    private function findCompany(string $slug): ?array
    {
        return collect(config('booking.companies'))->firstWhere('slug', $slug);
    }

    private function findRoute(int $routeId): array
    {
        foreach (config('booking.companies') as $company) {
            foreach ($company['routes'] as $route) {
                if ($route['id'] === $routeId) {
                    return [$company, $route];
                }
            }
        }

        return [null, null];
    }

    private function findTrip(int $tripId): array
    {
        foreach (config('booking.companies') as $company) {
            foreach ($company['routes'] as $route) {
                foreach ($route['trips'] as $trip) {
                    if ($trip['id'] === $tripId) {
                        return [$company, $route, $trip];
                    }
                }
            }
        }

        return [null, null, null];
    }
}
