<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

        if ($user->status !== 'active') {
            return response()->json(['requires_login' => true, 'message' => 'Registration received. Sign in after an administrator approves your account.'], 201);
        }

        return response()->json([
            'requires_login' => true,
            'message' => 'Registration successful. Sign in to verify your email and enter your account.',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            Log::warning('Authentication failed.', ['ip' => $request->ip()]);
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 422);
        }

        if ($user->status !== 'active') {
            Log::notice('Login blocked for inactive account.', ['user_id' => $user->id, 'ip' => $request->ip()]);
            return response()->json(['message' => 'Your account is pending approval or inactive.'], 403);
        }

        $challengeId = (string) Str::uuid();
        $code = (string) random_int(100000, 999999);
        DB::table('admin_login_challenges')->where('user_id', $user->id)->delete();
        DB::table('admin_login_challenges')->insert([
            'id' => $challengeId,
            'user_id' => $user->id,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $deliveryMessage = 'A verification code has been sent to your account email.';
        try {
            Mail::raw("Your Strategic Transport System verification code is {$code}. It expires in 10 minutes.", function ($mail) use ($user) {
                $mail->to($user->email)->subject('Your sign-in verification code');
            });
        } catch (\Throwable $exception) {
            Log::error('Login verification email delivery failed.', [
                'user_id' => $user->id,
                'mailer' => config('mail.default'),
                'exception_type' => get_class($exception),
            ]);

            if (! app()->environment('local')) {
                DB::table('admin_login_challenges')->where('id', $challengeId)->delete();
                return response()->json(['message' => 'The verification email could not be delivered. Please try again later.'], 503);
            }

            Log::warning('LOCAL ONLY: sign-in verification code fallback.', [
                'challenge_id' => $challengeId,
                'code' => $code,
            ]);
            $deliveryMessage = 'Email delivery failed. For local testing, find the code in backend/storage/logs/laravel.log.';
        }
        Log::info('Login verification challenge issued.', ['user_id' => $user->id, 'ip' => $request->ip()]);

        return response()->json([
            'mfa_required' => true,
            'challenge_id' => $challengeId,
            'message' => $deliveryMessage,
        ]);
    }

    public function verifyAdminLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'challenge_id' => ['required', 'uuid'],
            'code' => ['required', 'digits:6'],
        ]);
        $challenge = DB::table('admin_login_challenges')->where('id', $validated['challenge_id'])->first();
        abort_unless($challenge && now()->lt($challenge->expires_at) && $challenge->attempts < 5, 422, 'The verification code is invalid or expired. Sign in again to request a new one.');

        if (! Hash::check($validated['code'], $challenge->code_hash)) {
            DB::table('admin_login_challenges')->where('id', $challenge->id)->increment('attempts');
            Log::warning('Login code verification failed.', ['user_id' => $challenge->user_id, 'ip' => $request->ip()]);
            return response()->json(['message' => 'The verification code is invalid or expired.'], 422);
        }

        $user = User::findOrFail($challenge->user_id);
        abort_unless($user->status === 'active', 403, 'Your account is pending approval or inactive.');
        DB::table('admin_login_challenges')->where('user_id', $user->id)->delete();
        Auth::login($user);
        $request->session()->regenerate();
        Log::info('Login code verification succeeded.', ['user_id' => $user->id, 'ip' => $request->ip()]);

        return response()->json([
            'message' => 'Login successful.',
            'redirect_path' => $user->role_definition['dashboard_path'] ?? '/dashboard',
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
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        if (! $user) {
            return response()->json(['message' => 'If an account with that email exists, we have sent a password reset link.']);
        }
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
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => ['required', 'string', 'min:8', 'regex:/[a-z]/', 'regex:/[0-9]/', 'confirmed'],
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
        if (! $user) {
            return response()->json(['message' => 'Invalid or expired password reset token.'], 400);
        }
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
