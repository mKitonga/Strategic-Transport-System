<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    public function saccoRevenue(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin && $admin->role === 'sacco_admin', 403);

        $query = DB::table('sacco_passenger_payments as p')
            ->join('users as d', 'd.id', '=', 'p.driver_id')
            ->where('d.sacco_name', $admin->sacco_name);

        $this->applyDateFilter($query, $request, 'p.created_at');

        $revenue = $query->select(
                'p.created_at',
                'd.name as driver_name',
                'd.number_plate',
                'p.fare_amount',
                'p.passenger_phone',
                'p.prompt_status'
            )
            ->orderByDesc('p.created_at')
            ->get();

        return response()->json([
            'role' => 'admin',
            'sacco_name' => $admin->sacco_name,
            'period' => $this->getPeriodLabel($request),
            'summary' => [
                'total_revenue' => $revenue->where('prompt_status', 'Completed')->sum('fare_amount'),
                'passenger_count' => $revenue->count(),
                'active_drivers' => $revenue->unique('driver_name')->count()
            ],
            'details' => $revenue->map(fn($r) => [
                'created_at' => $r->created_at,
                'description' => "Driver: {$r->driver_name} ({$r->number_plate})",
                'amount' => $r->fare_amount,
                'payment_status' => $r->prompt_status
            ])
        ]);
    }

    public function schoolPayments(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin && $admin->role === 'school_admin', 403);

        $query = DB::table('school_trip_payments as p')
            ->join('users as u', 'u.id', '=', 'p.parent_id')
            ->where('u.school_name', $admin->school_name);

        $this->applyDateFilter($query, $request, 'p.created_at');

        $payments = $query->select(
                'u.name as parent_name',
                'u.student_name',
                'p.amount',
                'p.payment_status',
                'p.created_at'
            )
            ->orderByDesc('p.created_at')
            ->get();

        return response()->json([
            'role' => 'admin',
            'school_name' => $admin->school_name,
            'period' => $this->getPeriodLabel($request),
            'summary' => [
                'fees_collected' => $payments->where('status', 'completed')->sum('amount'),
                'total_trips' => $payments->count(),
                'parents_engaged' => $payments->unique('parent_name')->count()
            ],
            'details' => $payments->map(fn($p) => [
                'created_at' => $p->created_at,
                'description' => "Parent: {$p->parent_name} (Student: {$p->student_name})",
                'amount' => $p->amount,
                'payment_status' => $p->status
            ])
        ]);
    }

    public function bookingManifest(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin && $admin->role === 'booking_admin', 403);

        $company = collect(config('booking.companies'))->firstWhere('id', $admin->id); 
        
        return response()->json([
            'role' => 'admin',
            'period' => $this->getPeriodLabel($request),
            'summary' => [
                'routes_active' => count($company['routes'] ?? []),
                'system_status' => 'Live'
            ],
            'details' => []
        ]);
    }

    public function driverActivity(Request $request): JsonResponse
    {
        $driver = $request->user();
        abort_unless($driver && in_array($driver->role, ['sacco_driver', 'school_driver', 'booking_driver']), 403);

        $report = ['role' => $driver->role, 'period' => $this->getPeriodLabel($request)];

        if ($driver->role === 'sacco_driver') {
            $query = DB::table('sacco_passenger_payments')->where('driver_id', $driver->id);
            $this->applyDateFilter($query, $request, 'created_at');
            $payments = $query->orderByDesc('created_at')->get();
            $report['summary'] = [
                'total_earnings' => $payments->where('prompt_status', 'Completed')->sum('fare_amount'),
                'passenger_count' => $payments->count(),
            ];
            $report['details'] = $payments->map(fn($p) => [
                'created_at' => $p->created_at,
                'passenger_phone' => $p->passenger_phone,
                'fare_amount' => $p->fare_amount,
                'prompt_status' => $p->prompt_status
            ]);
        } elseif ($driver->role === 'school_driver') {
            $query = DB::table('school_transport_assignments')->where('driver_id', $driver->id);
            $this->applyDateFilter($query, $request, 'created_at');
            $assignments = $query->orderByDesc('created_at')->get();
            $report['summary'] = [
                'trips_completed' => $assignments->count(),
                'students_carried' => $assignments->sum('student_count')
            ];
            $report['details'] = $assignments->map(fn($a) => [
                'created_at' => $a->created_at,
                'description' => "Route: {$a->route_name}",
                'amount' => 0,
                'payment_status' => 'Completed'
            ]);
        }

        return response()->json($report);
    }

    public function userActivity(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && in_array($user->role, ['parent', 'passenger']), 403);

        $report = ['role' => $user->role, 'period' => $this->getPeriodLabel($request)];

        if ($user->role === 'parent') {
            $query = DB::table('school_trip_payments')->where('parent_id', $user->id);
            $this->applyDateFilter($query, $request, 'created_at');
            $payments = $query->orderByDesc('created_at')->get();
            $report['summary'] = [
                'fees_paid' => $payments->where('status', 'completed')->sum('amount'),
                'trips_logged' => $payments->count()
            ];
            $report['details'] = $payments->map(fn($p) => [
                'created_at' => $p->created_at,
                'description' => "School Transport Fee",
                'amount' => $p->amount,
                'payment_status' => $p->status
            ]);
        } elseif ($user->role === 'passenger') {
            $query = DB::table('sacco_passenger_payments')->where('passenger_phone', $user->phone);
            $this->applyDateFilter($query, $request, 'created_at');
            $payments = $query->orderByDesc('created_at')->get();
            $report['summary'] = [
                'total_spent' => $payments->where('prompt_status', 'Completed')->sum('fare_amount'),
                'trips_taken' => $payments->count()
            ];
            $report['details'] = $payments->map(fn($p) => [
                'created_at' => $p->created_at,
                'description' => "Sacco Transport Fare",
                'amount' => $p->fare_amount,
                'payment_status' => $p->prompt_status
            ]);
        }

        return response()->json($report);
    }

    private function applyDateFilter($query, Request $request, string $column)
    {
        if ($request->has('month')) {
            $query->whereMonth($column, $request->month);
            if ($request->has('year')) {
                $query->whereYear($column, $request->year);
            } else {
                $query->whereYear($column, now()->year);
            }
        } elseif ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween($column, [$request->start_date, $request->end_date]);
        }
    }

    private function getPeriodLabel(Request $request): string
    {
        if ($request->has('month')) {
            $monthName = date("F", mktime(0, 0, 0, (int)$request->month, 10));
            return $monthName . ' ' . ($request->year ?? now()->year);
        }
        if ($request->has('start_date')) {
            return $request->start_date . ' to ' . $request->end_date;
        }
        return 'All Time';
    }
}
