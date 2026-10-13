<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'message' => 'Laravel backend is connected.',
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    public function homepage(): JsonResponse
    {
        $roles = collect(config('transport.roles'))
            ->map(fn (array $definition, string $key) => [
                'key' => $key,
                'label' => $definition['label'],
                'fields' => collect($definition['registration_fields'])
                    ->map(fn (string $label, string $fieldKey) => [
                        'key' => $fieldKey,
                        'label' => $label,
                    ])
                    ->values()
                    ->all(),
            ])
            ->values();

        $activeSchoolProfiles = DB::table('users')
            ->where('role', 'school_admin')
            ->where('status', 'active')
            ->get(['school_name', 'location'])
            ->unique(fn ($admin) => strtolower(trim(($admin->school_name ?? '').'|'.($admin->location ?? ''))))
            ->count();

        $featuredRoutes = DB::table('sacco_routes as routes')
            ->join('users as admins', 'admins.id', '=', 'routes.sacco_admin_id')
            ->where('admins.role', 'sacco_admin')
            ->where('admins.status', 'active')
            ->orderBy('routes.route_name')
            ->limit(3)
            ->get([
                'routes.id',
                'routes.route_name',
                'routes.location',
                'routes.sacco_name',
            ]);

        return response()->json([
            'system_name' => 'Strategic Transport System',
            'homepage_links' => config('transport.homepage_links'),
            'common_registration_fields' => array_values(config('transport.common_registration_fields')),
            'roles' => $roles,
            'concepts' => config('transport.concepts'),
            'deferred_note' => config('transport.deferred_note'),
            'public_stats' => [
                'active_saccos' => DB::table('users')->where('role', 'sacco_admin')->where('status', 'active')->count(),
                'partner_schools' => $activeSchoolProfiles,
                'registered_routes' => DB::table('sacco_routes')
                    ->join('users as admins', 'admins.id', '=', 'sacco_routes.sacco_admin_id')
                    ->where('admins.role', 'sacco_admin')
                    ->where('admins.status', 'active')
                    ->count(),
            ],
            'featured_routes' => $featuredRoutes,
        ]);
    }

    public function directories(): JsonResponse
    {
        $saccoAdmins = DB::table('users')
            ->where('role', 'sacco_admin')
            ->where('status', 'active')
            ->orderBy('sacco_name')
            ->get(['id', 'name', 'email', 'phone', 'sacco_name', 'location']);
        $saccoRoutes = DB::table('sacco_routes')
            ->whereIn('sacco_admin_id', $saccoAdmins->pluck('id'))
            ->orderBy('route_name')
            ->get();
        $saccoTerminals = DB::table('route_terminals')
            ->whereIn('sacco_route_id', $saccoRoutes->pluck('id'))
            ->orderBy('terminal_order')
            ->get()
            ->groupBy('sacco_route_id');

        $schoolAdmins = DB::table('users')
            ->where('role', 'school_admin')
            ->where('status', 'active')
            ->orderBy('school_name')
            ->orderBy('location')
            ->get(['id', 'name', 'email', 'phone', 'school_name', 'location']);
        $schoolRoutes = DB::table('school_routes')
            ->whereIn('school_admin_id', $schoolAdmins->pluck('id'))
            ->orderBy('route_name')
            ->get();
        $schoolTerminals = DB::table('school_route_terminals')
            ->whereIn('school_route_id', $schoolRoutes->pluck('id'))
            ->orderBy('terminal_order')
            ->get()
            ->groupBy('school_route_id');

        return response()->json([
            'saccos' => $saccoAdmins->map(fn ($admin) => [
                'id' => $admin->id,
                'name' => $admin->sacco_name,
                'location' => $admin->location,
                'admin' => $admin->name,
                'phone' => $admin->phone,
                'email' => $admin->email,
                'routes' => $saccoRoutes->where('sacco_admin_id', $admin->id)->map(fn ($route) => [
                    'id' => $route->id,
                    'name' => $route->route_name,
                    'terminals' => ($saccoTerminals->get($route->id) ?? collect())->pluck('terminal_name')->values(),
                ])->values(),
            ])->values(),
            'schools' => $schoolAdmins->map(fn ($admin) => [
                'id' => $admin->id,
                'name' => $admin->school_name,
                'location' => $admin->location,
                'admin' => $admin->name,
                'phone' => $admin->phone,
                'email' => $admin->email,
                'routes' => $schoolRoutes->where('school_admin_id', $admin->id)->map(fn ($route) => [
                    'id' => $route->id,
                    'name' => $route->route_name,
                    'terminals' => ($schoolTerminals->get($route->id) ?? collect())->pluck('terminal_name')->values(),
                ])->values(),
            ])->values(),
        ]);
    }

    public function getComplaintOptions(): JsonResponse
    {
        $saccos = DB::table('users')
            ->where('role', 'sacco_admin')
            ->select('id', 'sacco_name')
            ->get()
            ->map(function ($admin) {
                return [
                    'name' => $admin->sacco_name,
                    'routes' => DB::table('sacco_routes')
                        ->where('sacco_admin_id', $admin->id)
                        ->pluck('route_name'),
                ];
            });

        $schools = DB::table('users')
            ->where('role', 'school_admin')
            ->select('school_name', 'location')
            ->get()
            ->groupBy('school_name')
            ->map(function ($items, $name) {
                return [
                    'name' => $name,
                    'locations' => $items->pluck('location'),
                ];
            })
            ->values();

        $bookingCompanies = DB::table('users')
            ->where('role', 'booking_admin')
            ->whereNotNull('company_name')
            ->select('id', 'company_name')
            ->get()
            ->map(function ($admin) {
                $company = collect(config('booking.companies'))
                    ->first(fn ($item) => strcasecmp(trim($item['name']), trim($admin->company_name)) === 0);

                return [
                    'name' => $admin->company_name,
                    'routes' => collect($company['routes'] ?? [])
                        ->pluck('name')
                        ->values(),
                ];
            })
            ->unique('name')
            ->values();

        return response()->json([
            'saccos' => $saccos,
            'schools' => $schools,
            'booking_companies' => $bookingCompanies,
        ]);
    }

    public function submitComplaint(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_type' => ['required', 'in:sacco,school,booking'],
            'service_name' => ['required', 'string'],
            'route_name' => ['nullable', 'string', 'required_if:service_type,sacco,booking'],
            'location' => ['nullable', 'string', 'required_if:service_type,school'],
            'passenger_phone' => ['nullable', 'string', 'required_without:passenger_email'],
            'passenger_email' => ['nullable', 'email', 'required_without:passenger_phone'],
            'message' => ['required', 'string', 'min:10'],
        ]);

        $assignedAdminId = null;

        if ($validated['service_type'] === 'sacco') {
            $admin = DB::table('users')
                ->where('role', 'sacco_admin')
                ->where('sacco_name', $validated['service_name'])
                ->whereExists(function ($query) use ($validated) {
                    $query->select(DB::raw(1))
                        ->from('sacco_routes')
                        ->whereColumn('sacco_routes.sacco_admin_id', 'users.id')
                        ->where('sacco_routes.route_name', $validated['route_name']);
                })
                ->first();
            $assignedAdminId = $admin->id ?? null;
        } elseif ($validated['service_type'] === 'school') {
            $admin = DB::table('users')
                ->where('role', 'school_admin')
                ->where('school_name', $validated['service_name'])
                ->where('location', $validated['location'])
                ->first();
            $assignedAdminId = $admin->id ?? null;
        } elseif ($validated['service_type'] === 'booking') {
            $admin = DB::table('users')
                ->where('role', 'booking_admin')
                ->where('company_name', $validated['service_name'])
                ->first();
            $assignedAdminId = $admin->id ?? null;
        }

        $complaintId = DB::table('passenger_complaints')->insertGetId(array_merge($validated, [
            'assigned_admin_id' => $assignedAdminId,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        Log::info("Complaint acknowledgment sent to " . ($validated['passenger_phone'] ?? $validated['passenger_email']));

        return response()->json([
            'message' => 'Your complaint has been received. We will get back to you shortly.',
            'complaint_id' => $complaintId,
        ], 201);
    }
}
