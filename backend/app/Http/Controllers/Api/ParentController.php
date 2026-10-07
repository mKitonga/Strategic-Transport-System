<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\DarajaService;

class ParentController extends Controller
{
    public function child(Request $request): JsonResponse
    {
        $parent = $this->requireParent($request);

        return response()->json([
            'child' => [
                'parent_name' => $parent->name,
                'parent_phone' => $parent->phone,
                'student_name' => $parent->student_name,
                'grade' => $parent->grade,
                'school_name' => $parent->school_name,
                'location' => $parent->location,
                'admission_number' => $parent->admission_number,
            ],
        ]);
    }

    public function trips(Request $request): JsonResponse
    {
        $parent = $this->requireParent($request);

        $dailyTrips = DB::table('school_daily_trips as t')
            ->leftJoin('school_routes as r', 'r.id', '=', 't.school_route_id')
            ->where('t.school_name', $parent->school_name)
            ->where('t.location', $parent->location)
            ->where('t.grade', $parent->grade)
            ->select('t.*', 'r.route_name')
            ->orderBy('t.pickup_time')
            ->get()
            ->map(function ($trip) use ($parent) {
                $payment = $this->findPayment($parent->id, 'daily', $trip->id);
                $assignment = DB::table('school_daily_trip_assignments as a')
                    ->leftJoin('users as d', 'd.id', '=', 'a.school_driver_id')
                    ->where('a.school_daily_trip_id', $trip->id)
                    ->where('a.parent_id', $parent->id)
                    ->select('a.assigned_pickup_time', 'd.name as driver_name', 'd.phone as driver_phone')
                    ->first();

                return [
                    'id' => $trip->id,
                    'route_name' => $trip->route_name,
                    'pickup_time' => $trip->pickup_time,
                    'dropoff_time' => $trip->dropoff_time,
                    'amount' => (float) $trip->amount,
                    'payment_status' => $payment->status ?? 'not_paid',
                    'assignment' => $assignment,
                ];
            })
            ->values();

        $educationalTrips = DB::table('school_educational_trips')
            ->where('school_name', $parent->school_name)
            ->where('location', $parent->location)
            ->where('grade', $parent->grade)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($trip) use ($parent) {
                $payment = $this->findPayment($parent->id, 'educational', $trip->id);

                return [
                    'id' => $trip->id,
                    'trip_title' => $trip->trip_title,
                    'destination' => $trip->destination,
                    'duration_days' => $trip->duration_days,
                    'amount' => (float) $trip->amount,
                    'trip_date' => $trip->trip_date,
                    'notes' => $trip->notes,
                    'payment_status' => $payment->status ?? 'not_paid',
                ];
            })
            ->values();

        $closingTrips = DB::table('school_closing_trips')
            ->where('school_name', $parent->school_name)
            ->where('location', $parent->location)
            ->orderByDesc('closing_day')
            ->get()
            ->map(function ($trip) use ($parent) {
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
                    ->orderBy('r.route_name')
                    ->get()
                    ->map(function ($fare) use ($parent) {
                        $payment = $this->findPayment($parent->id, 'closing', $fare->id);

                        return [
                            'id' => $fare->id,
                            'route_name' => $fare->route_name,
                            'from_terminal_name' => $fare->from_terminal_name,
                            'to_terminal_name' => $fare->to_terminal_name,
                            'amount' => (float) $fare->amount,
                            'payment_status' => $payment->status ?? 'not_paid',
                        ];
                    })
                    ->values();

                $assignment = DB::table('school_closing_trip_assignments as a')
                    ->join('users as d', 'd.id', '=', 'a.sacco_driver_id')
                    ->where('a.school_closing_trip_id', $trip->id)
                    ->where('a.parent_id', $parent->id)
                    ->select('d.name as driver_name', 'd.phone as driver_phone', 'd.number_plate')
                    ->first();

                return [
                    'id' => $trip->id,
                    'closing_day' => $trip->closing_day,
                    'notes' => $trip->notes,
                    'fares' => $fares,
                    'assignment' => $assignment,
                ];
            })
            ->values();

        return response()->json([
            'child' => [
                'student_name' => $parent->student_name,
                'grade' => $parent->grade,
                'school_name' => $parent->school_name,
                'location' => $parent->location,
            ],
            'daily_trips' => $dailyTrips,
            'educational_trips' => $educationalTrips,
            'closing_trips' => $closingTrips,
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $parent = $this->requireParent($request);

        $payments = DB::table('school_trip_payments')
            ->where('parent_id', $parent->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'student_name' => $payment->student_name,
                    'trip_type' => $payment->trip_type,
                    'amount' => (float) $payment->amount,
                    'phone_number' => $payment->phone_number,
                    'mpesa_reference' => $payment->mpesa_reference,
                    'status' => $payment->status,
                    'approved_at' => $payment->approved_at,
                ];
            })
            ->values();

        return response()->json([
            'payments' => $payments,
        ]);
    }

    public function makePayment(Request $request): JsonResponse
    {
        $parent = $this->requireParent($request);

        $validated = $request->validate([
            'trip_type' => ['required', 'in:daily,educational,closing'],
            'trip_id' => ['required', 'integer'],
            'phone_number' => ['required', 'string', 'regex:/^(\+254[17]\d{8}|0[17]\d{8})$/'],
        ], [
            'phone_number.regex' => 'Phone number must be in Kenyan format.',
        ]);

        [$schoolAdminId, $amount] = match ($validated['trip_type']) {
            'daily' => $this->resolveDailyPayment($parent, $validated['trip_id']),
            'educational' => $this->resolveEducationalPayment($parent, $validated['trip_id']),
            'closing' => $this->resolveClosingPayment($parent, $validated['trip_id']),
        };

        $mpesaReference = 'STS'.Str::upper(Str::random(8));

        // Call Daraja Service
        $daraja = new DarajaService();
        $stkResponse = $daraja->initiateStkPush(
            $validated['phone_number'],
            (int) $amount,
            $mpesaReference,
            "Payment for " . $validated['trip_type'] . " trip"
        );

        if (!$stkResponse || !isset($stkResponse['CheckoutRequestID'])) {
            return response()->json([
                'message' => 'Failed to initiate M-Pesa payment. Please try again later.',
            ], 500);
        }

        DB::table('school_trip_payments')->updateOrInsert(
            [
                'parent_id' => $parent->id,
                'trip_type' => $validated['trip_type'],
                'trip_id' => $validated['trip_id'],
            ],
            [
                'school_admin_id' => $schoolAdminId,
                'student_name' => $parent->student_name,
                'grade' => $parent->grade,
                'amount' => $amount,
                'phone_number' => $validated['phone_number'],
                'mpesa_reference' => $mpesaReference,
                'checkout_request_id' => $stkResponse['CheckoutRequestID'],
                'status' => 'submitted',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'M-Pesa payment initiated. Please check your phone and enter your PIN.',
        ], 201);
    }

    public function notifications(Request $request): JsonResponse
    {
        $parent = $this->requireParent($request);

        $dailyAssignments = DB::table('school_daily_trip_assignments as a')
            ->join('school_daily_trips as t', 't.id', '=', 'a.school_daily_trip_id')
            ->leftJoin('users as d', 'd.id', '=', 'a.school_driver_id')
            ->where('a.parent_id', $parent->id)
            ->select(
                'a.assigned_pickup_time',
                't.pickup_time',
                't.dropoff_time',
                'd.name as driver_name',
                'd.phone as driver_phone'
            )
            ->orderByDesc('a.updated_at')
            ->get();

        $closingAssignments = DB::table('school_closing_trip_assignments as a')
            ->join('school_closing_trips as t', 't.id', '=', 'a.school_closing_trip_id')
            ->join('users as d', 'd.id', '=', 'a.sacco_driver_id')
            ->where('a.parent_id', $parent->id)
            ->select(
                't.closing_day',
                'd.name as driver_name',
                'd.phone as driver_phone',
                'd.number_plate'
            )
            ->orderByDesc('a.updated_at')
            ->get();

        $payments = DB::table('school_trip_payments')
            ->where('parent_id', $parent->id)
            ->orderByDesc('updated_at')
            ->get(['trip_type', 'amount', 'mpesa_reference', 'status', 'approved_at']);

        return response()->json([
            'daily_assignments' => $dailyAssignments,
            'closing_assignments' => $closingAssignments,
            'payments' => $payments,
        ]);
    }

    private function resolveDailyPayment(object $parent, int $tripId): array
    {
        $trip = DB::table('school_daily_trips')
            ->where('id', $tripId)
            ->where('school_name', $parent->school_name)
            ->where('location', $parent->location)
            ->where('grade', $parent->grade)
            ->first();

        abort_unless($trip, 404, 'Daily trip not found for this student.');

        return [$trip->school_admin_id, $trip->amount];
    }

    private function resolveEducationalPayment(object $parent, int $tripId): array
    {
        $trip = DB::table('school_educational_trips')
            ->where('id', $tripId)
            ->where('school_name', $parent->school_name)
            ->where('location', $parent->location)
            ->where('grade', $parent->grade)
            ->first();

        abort_unless($trip, 404, 'Educational trip not found for this student.');

        return [$trip->school_admin_id, $trip->amount];
    }

    private function resolveClosingPayment(object $parent, int $fareId): array
    {
        $fare = DB::table('school_closing_trip_fares as f')
            ->join('school_closing_trips as t', 't.id', '=', 'f.school_closing_trip_id')
            ->where('f.id', $fareId)
            ->where('t.school_name', $parent->school_name)
            ->where('t.location', $parent->location)
            ->select('f.amount', 't.school_admin_id')
            ->first();

        abort_unless($fare, 404, 'Closing trip fare not found for this student.');

        return [$fare->school_admin_id, $fare->amount];
    }

    private function findPayment(int $parentId, string $tripType, int $tripId): ?object
    {
        return DB::table('school_trip_payments')
            ->where('parent_id', $parentId)
            ->where('trip_type', $tripType)
            ->where('trip_id', $tripId)
            ->orderByDesc('updated_at')
            ->first();
    }

    private function requireParent(Request $request): object
    {
        $user = $request->user();

        abort_unless($user && $user->role === 'parent', 403, 'Only parents can access this resource.');

        return $user;
    }
}
