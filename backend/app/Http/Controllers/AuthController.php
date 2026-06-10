<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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

        $user = $this->createUser($fields);

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

    public function registerWeb(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:buyer,seller',
            'brand_name' => 'nullable|string'
        ]);

        $user = $this->createUser($fields);

        Auth::login($user);
        $request->session()->regenerate();

        return $this->redirectAfterAuthentication($request, $user);
    }

    public function loginWeb(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        if (! Auth::attempt($fields)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.']
            ]);
        }

        $request->session()->regenerate();

        return $this->redirectAfterAuthentication($request, $request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response(['message' => 'Logged out successfully'], 200);
    }

    public function logoutWeb(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
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
            'gst_number' => 'nullable|string|max:15',
            'shiprocket_email' => 'nullable|string|email',
            'shiprocket_password' => 'nullable|string',
            'card_number' => 'nullable|string',
            'card_expiry' => 'nullable|string',
            'card_cvv' => 'nullable|string',
        ]);

        $updateData = [
            'name' => $fields['name'],
            'email' => $fields['email'],
            'phone' => $fields['phone'] ?? $user->phone,
            'brand_name' => $user->role === 'seller'
                ? seller_brand_name($fields['brand_name'] ?? null, $fields['name'])
                : $user->brand_name,
            'address' => $fields['address'] ?? $user->address,
            'gst_number' => $fields['gst_number'] ?? $user->gst_number,
            'shiprocket_email' => $fields['shiprocket_email'] ?? $user->shiprocket_email,
            'shiprocket_password' => isset($fields['shiprocket_password']) && $fields['shiprocket_password'] !== ''
                ? $fields['shiprocket_password']
                : $user->shiprocket_password,
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
                ]
            );
        }

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Profile updated successfully');
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

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Email verified successfully');
        }

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
            $user->notify(new VerificationCodeNotification());
        } catch (\Exception $e) {
            Log::error("Failed to resend verification code: " . $e->getMessage());
        }

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Verification code resent successfully.');
        }

        return response([
            'message' => 'Verification code resent successfully.'
        ], 200);
    }

    private function createUser(array $fields): User
    {
        $code = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $sellerBrandName = $fields['role'] === 'seller'
            ? seller_brand_name($fields['brand_name'] ?? null, $fields['name'])
            : null;

        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'phone' => $fields['phone'] ?? null,
            'password' => Hash::make($fields['password']),
            'role' => $fields['role'],
            'verification_code' => $code,
            'brand_name' => $sellerBrandName,
        ]);

        if ($user->role === 'seller') {
            \App\Models\Brand::create([
                'user_id' => $user->id,
                'name' => $user->brand_name,
            ]);
        }

        try {
            $user->notify(new VerificationCodeNotification());
        } catch (\Exception $e) {
            Log::error("Failed to send verification code: " . $e->getMessage());
        }

        return $user;
    }

    private function redirectAfterAuthentication(Request $request, User $user)
    {
        $redirect = $request->input('redirect');

        if ($redirect === 'checkout' && $user->role === 'buyer') {
            return redirect('/checkout');
        }

        return redirect($user->role === 'seller' ? '/seller' : '/');
    }
}
