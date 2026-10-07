<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function companies(): JsonResponse
    {
        $companies = collect(config('booking.companies'))
            ->map(fn (array $company) => [
                'id' => $company['id'],
                'slug' => $company['slug'],
                'name' => $company['name'],
                'location' => $company['location'],
                'contact_phone' => $company['contact_phone'],
                'contact_email' => $company['contact_email'],
                'route_count' => count($company['routes']),
            ])
            ->values();

        return response()->json(['companies' => $companies]);
    }

    public function company(string $slug): JsonResponse
    {
        $company = $this->findCompany($slug);

        abort_unless($company, 404, 'Booking company not found.');

        return response()->json([
            'company' => [
                'id' => $company['id'],
                'slug' => $company['slug'],
                'name' => $company['name'],
                'location' => $company['location'],
                'contact_phone' => $company['contact_phone'],
                'contact_email' => $company['contact_email'],
                'routes' => collect($company['routes'])->map(fn (array $route) => [
                    'id' => $route['id'],
                    'name' => $route['name'],
                    'departure' => $route['departure'],
                    'destination' => $route['destination'],
                    'fare' => $route['fare'],
                ])->values(),
            ],
        ]);
    }

    public function route(int $routeId): JsonResponse
    {
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

    public function driverOverview(int $driverId): JsonResponse
    {
        $assignedTrips = collect(config('booking.companies'))
            ->flatMap(function (array $company) use ($driverId) {
                return collect($company['routes'])->flatMap(function (array $route) use ($company, $driverId) {
                    return collect($route['trips'])
                        ->where('driver_id', $driverId)
                        ->map(fn (array $trip) => [
                            'company_name' => $company['name'],
                            'route_name' => $route['name'],
                            'departure' => $route['departure'],
                            'destination' => $route['destination'],
                            'trip_id' => $trip['id'],
                            'time' => $trip['time'],
                            'fare' => $trip['fare'],
                            'major_departure_point' => $trip['major_departure_point'],
                            'passengers' => $trip['passengers'],
                        ]);
                });
            })
            ->values();

        return response()->json([
            'driver_id' => $driverId,
            'assigned_trips' => $assignedTrips,
        ]);
    }

    public function notifyArrival(Request $request, int $tripId): JsonResponse
    {
        $validated = $request->validate([
            'driver_id' => ['required', 'integer'],
        ]);

        [, , $trip] = $this->findTrip($tripId);

        abort_unless($trip, 404, 'Trip not found.');

        return response()->json([
            'message' => 'Booking admin has been notified of the driver arrival.',
            'driver_id' => $validated['driver_id'],
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
