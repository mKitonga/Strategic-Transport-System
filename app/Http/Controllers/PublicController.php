<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Route;

class PublicController extends Controller
{
    public function getTrafficUpdates()
    {
        // Mocking traffic updates for demonstration of the requested feature
        $updates = [
            ['id' => 1, 'location' => 'Nairobi CBD', 'status' => 'Heavy Traffic', 'message' => 'Delay expected due to road works.', 'time' => now()->subMinutes(15)->toTimeString()],
            ['id' => 2, 'location' => 'Thika Superhighway', 'status' => 'Clear', 'message' => 'Flowing smoothly.', 'time' => now()->subMinutes(5)->toTimeString()],
            ['id' => 3, 'location' => 'Mombasa Road', 'status' => 'Accident', 'message' => 'Minor accident at Nyayo stadium roundabout.', 'time' => now()->subMinutes(30)->toTimeString()],
            ['id' => 4, 'location' => 'Ngong Road', 'status' => 'Moderate', 'message' => 'Moving slowly near Adams Arcade.', 'time' => now()->subMinutes(45)->toTimeString()],
        ];
        return response()->json($updates);
    }

    public function getSaccosAndRoutes()
    {
        // Fetch registered Saccos
        $saccos = User::where('role', 'sacco_admin')->get(['id', 'name', 'email']);
        
        // Fetch registered routes
        $routes = Route::all();

        return response()->json([
            'saccos' => $saccos,
            'routes' => $routes
        ]);
    }

    public function getSchools()
    {
        // Fetch registered Schools
        $schools = User::where('role', 'school_admin')->get(['id', 'name', 'email']);
        
        // Map mock location data since exact GPS location might not be explicitly stored on users table
        $schoolsWithLocation = $schools->map(function($school) {
            $school->location = 'Regional District Address'; // Mocking physical location mapping
            return $school;
        });

        return response()->json($schoolsWithLocation);
    }
}
