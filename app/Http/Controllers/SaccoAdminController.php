<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Route;
use App\Models\Fare;
use App\Models\Queue;
use App\Models\Complaint;
use App\Models\Message;
use App\Models\SchoolAssignment;
use App\Models\Terminal;
use App\Models\DriverArrival;

class SaccoAdminController extends Controller
{
    /**
     * Dashboard statistics
     */
    public function dashboardStats()
    {
        $admin = auth()->user();
        $saccoName = $admin->sacco_name;

        return response()->json([
            'drivers' => User::where('role', 'Sacco Driver')->where('sacco_name', $saccoName)->count(),
            'routes' => Route::where('sacco_name', $saccoName)->count(),
            'fares' => Fare::whereHas('route', function($q) use ($saccoName) {
                $q->where('sacco_name', $saccoName);
            })->count(),
            'complaints' => Complaint::where('status','pending')
                ->where('sacco_name', $saccoName)
                ->count(),
            'schools' => SchoolAssignment::whereHas('driver', function($q) use ($saccoName) {
                $q->where('sacco_name', $saccoName);
            })->count()
        ]);
    }

    /**
     * View drivers awaiting approval
     */
    public function pendingDrivers()
    {
        $admin = auth()->user();

        $drivers = User::where('role','Sacco Driver')
                        ->where('sacco_name',$admin->sacco_name)
                        ->where('approved',false)
                        ->get();

        return response()->json($drivers);
    }

    /**
     * Approve driver
     */
    public function approveDriver($id)
    {
        $admin = auth()->user();

        $driver = User::where('id',$id)
                        ->where('sacco_name',$admin->sacco_name)
                        ->firstOrFail();

        $driver->approved = true;
        $driver->save();

        return response()->json([
            'message' => 'Driver approved successfully'
        ]);
    }

    /**
     * Get routes with terminals
     */
    public function getRoutes()
    {
        $admin = auth()->user();

        $routes = Route::with('terminals')
                        ->where('sacco_name',$admin->sacco_name)
                        ->get();

        return response()->json($routes);
    }

    /**
     * Create route and terminals
     */
    public function createRoute(Request $request)
    {
        $request->validate([
            'route_name' => 'required|string|max:255',
            'terminals' => 'nullable|array',
            'terminals.*' => 'string|max:255'
        ]);

        $admin = auth()->user();

        $route = Route::create([
            'route_name' => $request->route_name,
            'sacco_name' => $admin->sacco_name
        ]);

        if($request->has('terminals')){
            foreach($request->terminals as $terminalName){
                if(!empty(trim($terminalName))){
                    Terminal::create([
                        'route_id' => $route->id,
                        'terminal_name' => trim($terminalName)
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Route created successfully',
            'route' => $route->load('terminals')
        ]);
    }

    /**
     * Create terminal-to-terminal fare
     */
    public function createFare(Request $request)
    {
        $request->validate([
            'route_id' => 'required|exists:routes,id',
            'from_terminal_id' => 'required|exists:terminals,id',
            'to_terminal_id' => 'required|exists:terminals,id',
            'peak_fare' => 'required|numeric|min:0',
            'offpeak_fare' => 'required|numeric|min:0'
        ]);

        if($request->from_terminal_id == $request->to_terminal_id){
            return response()->json([
                'message' => 'From terminal and To terminal cannot be the same'
            ],422);
        }

        $admin = auth()->user();

        $route = Route::where('id',$request->route_id)
                        ->where('sacco_name',$admin->sacco_name)
                        ->firstOrFail();

        $fare = Fare::create([
            'route_id' => $route->id,
            'from_terminal_id' => $request->from_terminal_id,
            'to_terminal_id' => $request->to_terminal_id,
            'peak_fare' => $request->peak_fare,
            'offpeak_fare' => $request->offpeak_fare
        ]);

        return response()->json([
            'message' => 'Fare created successfully',
            'fare' => $fare
        ]);
    }

    /**
     * Get fares
     */
    public function getFares()
    {
        $admin = auth()->user();

        $fares = Fare::with(['route','fromTerminal','toTerminal'])
        ->whereHas('route',function($q) use ($admin){
            $q->where('sacco_name',$admin->sacco_name);
        })
        ->get();

        return response()->json($fares);
    }

    /**
     * View drivers waiting in terminals
     */
    public function waitingDrivers()
    {
        $drivers = DriverArrival::with(['driver','terminal','route'])
                    ->where('status','waiting')
                    ->get();

        return response()->json($drivers);
    }

    /**
     * Assign queue number to driver arrival
     */
    public function assignQueue(Request $request)
    {
        $request->validate([
            'arrival_id' => 'required|exists:driver_arrivals,id',
            'queue_number' => 'required|integer'
        ]);

        $arrival = DriverArrival::findOrFail($request->arrival_id);

        $arrival->queue_number = $request->queue_number;
        $arrival->status = 'queued';
        $arrival->save();

        return response()->json([
            'message' => 'Queue assigned successfully',
            'arrival' => $arrival
        ]);
    }

    /**
     * Assign route to arrived driver
     */
    public function assignRoute(Request $request)
    {
        $request->validate([
            'arrival_id' => 'required|exists:driver_arrivals,id',
            'route_id' => 'required|exists:routes,id'
        ]);

        $arrival = DriverArrival::findOrFail($request->arrival_id);

        $arrival->route_id = $request->route_id;
        $arrival->status = 'assigned_route';
        $arrival->save();

        return response()->json([
            'message' => 'Route assigned successfully',
            'arrival' => $arrival
        ]);
    }

    /**
     * View complaints for this sacco and route
     */
    public function viewComplaints()
    {
        $admin = auth()->user();

        $complaints = Complaint::where('sacco_name',$admin->sacco_name)
                        ->where('route_id',$admin->route_id ?? null)
                        ->latest()
                        ->get();

        return response()->json($complaints);
    }

    /**
     * Resolve complaint
     */
    public function resolveComplaint($id)
    {
        $admin = auth()->user();

        $complaint = Complaint::where('sacco_name',$admin->sacco_name)
                        ->where('route_id',$admin->route_id ?? null)
                        ->where('id',$id)
                        ->firstOrFail();

        $complaint->status = "resolved";
        $complaint->save();

        return response()->json([
            'message' => 'Complaint resolved successfully'
        ]);
    }

    /**
     * Fetch messages from School Admins
     */
    public function getMessages()
    {
        $messages = Message::with('sender')
            ->where('receiver_id', auth()->id())
            ->latest()
            ->get();

        return response()->json($messages);
    }

    /**
     * Reply to a School Admin
     */
    public function replyMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string'
        ]);

        $msg = Message::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $request->receiver_id,
            'message' => $request->message
        ]);

        return response()->json([
            'message' => 'Reply sent successfully',
            'data' => $msg
        ]);
    }

    /**
     * Mark message as read
     */
    public function markAsRead($id)
    {
        $message = Message::findOrFail($id);

        $message->is_read = true;
        $message->save();

        return response()->json([
            'message' => 'Message marked as read'
        ]);
    }

    /**
     * Assign driver to school after agreement
     */
    public function assignDriverToSchool(Request $request)
    {
        $request->validate([
            'driver_id' => 'required|exists:users,id',
            'school_id' => 'required'
        ]);

        $admin = auth()->user();

        $driver = User::where('id',$request->driver_id)
                        ->where('sacco_name',$admin->sacco_name)
                        ->firstOrFail();

        $assignment = SchoolAssignment::create([
            'driver_id' => $driver->id,
            'school_id' => $request->school_id
        ]);

        return response()->json([
            'message' => 'Driver assigned to school successfully',
            'assignment' => $assignment
        ]);
    }
}