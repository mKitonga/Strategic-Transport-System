<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\ResetPasswordMail;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $definition = config('transport.roles.'.$validated['role']);
        $registrationDetails = $this->extractRegistrationDetails($validated, $definition);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'status' => $definition['default_status'],
            'profile_data' => $registrationDetails,
            ...$registrationDetails,
        ]);

        $token = $user->createToken('transport-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'token' => $token,
            'redirect_path' => $definition['dashboard_path'] ?? '/dashboard',
            'user' => $this->serializeUser($user->fresh()),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 422);
        }

        $user->tokens()->delete();
        $token = $user->createToken('transport-auth-token')->plainTextToken;
        $definition = $user->role_definition;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'redirect_path' => $definition['dashboard_path'] ?? '/dashboard',
            'user' => $this->serializeUser($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->serializeUser($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'No account is registered with this email address.',
        ]);

        $user = User::where('email', $request->email)->first();
        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        Mail::to($user->email)->send(new ResetPasswordMail($user, $token));

        return response()->json([
            'message' => 'If an account with that email exists, we have sent a password reset link.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (! $resetRecord || ! Hash::check($request->token, $resetRecord->token)) {
            return response()->json([
                'message' => 'Invalid or expired password reset token.',
            ], 400);
        }

        // Token expires after 60 minutes
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'message' => 'Password reset token has expired.',
            ], 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Delete all tokens for this user
        $user->tokens()->delete();
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Your password has been successfully reset. You can now login.',
        ]);
    }

    private function serializeUser(User $user): array
    {
        $definition = $user->role_definition;
        $registrationDetails = $this->collectRegistrationDetails($user, $definition);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'role_label' => $definition['label'] ?? Str::headline((string) $user->role),
            'status' => $user->status,
            'dashboard_path' => $definition['dashboard_path'] ?? '/dashboard',
            'profile_data' => $registrationDetails,
            'registration_details' => $registrationDetails,
            'registration_fields' => $definition['registration_fields'] ?? [],
        ];
    }

    private function extractRegistrationDetails(array $validated, array $definition): array
    {
        $profileData = $validated['profile_data'] ?? [];
        $details = [];

        foreach (array_keys($definition['registration_fields'] ?? []) as $field) {
            $details[$field] = $profileData[$field] ?? null;
        }

        return $details;
    }

    private function collectRegistrationDetails(User $user, array $definition): array
    {
        $details = [];

        foreach (array_keys($definition['registration_fields'] ?? []) as $field) {
            $details[$field] = $user->{$field} ?? ($user->profile_data[$field] ?? null);
        }

        return $details;
    }
}
