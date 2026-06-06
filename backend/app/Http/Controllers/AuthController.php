<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:buyer,seller',
            'brand_name' => 'nullable|string'
        ]);

        $code = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);

        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'phone' => $fields['phone'] ?? null,
            'password' => Hash::make($fields['password']),
            'role' => $fields['role'],
            'verification_code' => $code,
            'brand_name' => $fields['role'] === 'seller' ? ($fields['brand_name'] ?? $fields['name'] . "'s Store") : null,
        ]);

        if ($user->role === 'seller') {
            \App\Models\Brand::create([
                'user_id' => $user->id,
                'name' => $user->brand_name,
                'slug' => \Illuminate\Support\Str::slug($user->brand_name) . '-' . uniqid()
            ]);
        }

        // Send verification code
        try {
            $notifier = new \App\Services\NotificationService();
            $notifier->sendVerificationCode($user);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send verification code: " . $e->getMessage());
        }

        $token = $user->createToken('mystoretoken')->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token
        ], 210);
    }

    public function login(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $fields['email'])->first();

        if (!$user || !Hash::check($fields['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.']
            ]);
        }

        $token = $user->createToken('mystoretoken')->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response(['message' => 'Logged out successfully'], 200);
    }

    public function profile(Request $request)
    {
        return response($request->user(), 200);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $fields = $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'brand_name' => 'nullable|string',
            'address' => 'nullable|string',
            'card_number' => 'nullable|string',
            'card_expiry' => 'nullable|string',
            'card_cvv' => 'nullable|string',
        ]);

        $updateData = [
            'name' => $fields['name'],
            'email' => $fields['email'],
            'phone' => $fields['phone'] ?? $user->phone,
            'brand_name' => $fields['brand_name'] ?? $user->brand_name,
            'address' => $fields['address'] ?? $user->address,
            'card_number' => $fields['card_number'] ?? $user->card_number,
            'card_expiry' => $fields['card_expiry'] ?? $user->card_expiry,
            'card_cvv' => $fields['card_cvv'] ?? $user->card_cvv,
        ];

        if (!empty($fields['password'])) {
            $updateData['password'] = Hash::make($fields['password']);
        }

        $user->update($updateData);

        if ($user->role === 'seller') {
            \App\Models\Brand::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $user->brand_name,
                    'slug' => \Illuminate\Support\Str::slug($user->brand_name) . '-' . uniqid()
                ]
            );
        }

        return response([
            'message' => 'Profile updated successfully',
            'user' => $user
        ], 200);
    }

    public function verifyEmail(Request $request)
    {
        $fields = $request->validate([
            'code' => 'required|string|size:6'
        ]);

        $user = $request->user();

        if ($user->email_verified_at) {
            return response([
                'message' => 'Email is already verified.',
                'user' => $user
            ], 200);
        }

        if ($user->verification_code !== $fields['code']) {
            throw ValidationException::withMessages([
                'code' => ['Invalid verification code.']
            ]);
        }

        $user->email_verified_at = now();
        $user->verification_code = null;
        $user->save();

        return response([
            'message' => 'Email verified successfully',
            'user' => $user
        ], 200);
    }

    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return response([
                'message' => 'Email is already verified.',
                'user' => $user
            ], 400);
        }

        $code = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->verification_code = $code;
        $user->save();

        try {
            $notifier = new \App\Services\NotificationService();
            $notifier->sendVerificationCode($user);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to resend verification code: " . $e->getMessage());
        }

        return response([
            'message' => 'Verification code resent successfully.'
        ], 200);
    }
}
