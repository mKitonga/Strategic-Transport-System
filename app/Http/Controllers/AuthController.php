<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user and auto-login
     */
    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'full_names'   => 'required|string|max:255',
                'phone_number' => [
                    'required',
                    'string',
                    'unique:users,phone_number',
                    'regex:/^(?:\+254|0)(7|1)[0-9]{8}$/'
                ],
                'email'    => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
                'role'     => 'required|in:Sacco Admin,Sacco Driver,School Admin,School Driver,Parent'
            ], [
                'phone_number.regex' => 'Phone number must be in Kenyan format (07XXXXXXXX, 01XXXXXXXX, or +254XXXXXXXX).'
            ]);

            $extraFields = [];

            /*
            |----------------------------------------------------------------------
            | Role Specific Fields
            |----------------------------------------------------------------------
            */
            switch ($request->role) {

                case 'Sacco Admin':
                    $request->validate([
                        'sacco_name' => 'required|string|max:255',
                        'route_name' => 'required|string|max:255'
                    ]);

                    $extraFields = [
                        'sacco_name' => trim($request->sacco_name),
                        'route_name' => trim($request->route_name),
                    ];
                    break;

                case 'Sacco Driver':
                    $request->validate([
                        'sacco_name'   => 'required|string|max:255',
                        'number_plate' => [
                            'required',
                            'string',
                            'regex:/^K[A-Z]{2}\s?[0-9]{3}[A-Z]$/'
                        ],
                        'matatu_name'  => 'required|string|max:255'
                    ], [
                        'number_plate.regex' => 'Number plate must be in Kenyan format (e.g., KCA 123A).'
                    ]);

                    $extraFields = [
                        'sacco_name'   => trim($request->sacco_name),
                        'number_plate' => strtoupper(trim($request->number_plate)),
                        'matatu_name'  => trim($request->matatu_name),
                    ];
                    break;

                case 'School Admin':
                case 'School Driver':
                    $request->validate([
                        'school_name'     => 'required|string|max:255',
                        'school_location' => 'required|string|max:255'
                    ]);

                    $extraFields = [
                        'school_name'     => trim($request->school_name),
                        'school_location' => trim($request->school_location),
                    ];
                    break;

                case 'Parent':
                    $request->validate([
                        'student_name'     => 'required|string|max:255',
                        'grade'            => 'required|string|max:20',
                        'school_name'      => 'required|string|max:255',
                        'admission_number' => 'required|string|max:50'
                    ]);

                    $extraFields = [
                        'student_name'     => trim($request->student_name),
                        'grade'            => trim($request->grade),
                        'school_name'      => trim($request->school_name),
                        'admission_number' => trim($request->admission_number),
                    ];
                    break;
            }

            DB::beginTransaction();

            $user = User::create(array_merge([
                'full_names'   => trim($request->full_names),
                'phone_number' => trim($request->phone_number),
                'email'        => strtolower(trim($request->email)),
                'password'     => Hash::make($request->password),
                'role'         => $request->role
            ], $extraFields));

            // Revoke old tokens and create new token
            $user->tokens()->delete();
            $token = $user->createToken('auth_token')->plainTextToken;

            DB::commit();

            return response()->json([
                'status'  => true,
                'message' => 'User registered and logged in successfully',
                'token'   => $token,
                'role'    => $user->role,
                'user'    => $user
            ], 201);

        } catch (ValidationException $ve) {
            // Return validation errors with 422 status
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $ve->errors()
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            // Return detailed error for debugging
            return response()->json([
                'status' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email|string',
            'password' => 'required|string',
        ]);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid email or password'
            ], 401);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status'  => true,
            'message' => 'Login successful',
            'token'   => $token,
            'role'    => $user->role,
            'user'    => $user
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
            return response()->json([
                'status' => true,
                'message' => 'Logged out successfully'
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'User not authenticated'
        ], 401);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        return response()->json([
            'status' => true,
            'user'   => $request->user()
        ]);
    }
}