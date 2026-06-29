<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Services\AuthService\UpdateProfile as UpdateProfileService;
use Illuminate\Http\Request;

class UpdateProfile extends Controller
{
    public function __construct(private readonly UpdateProfileService $updateProfileService)
    {
    }

    public function __invoke(Request $request)
    {
        $user = $request->user();

        $fields = $request->validate([
            'name' => 'sometimes|required|string',
            'email' => 'sometimes|required|string|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'avatar' => 'nullable|string',
            'brand_name' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'country_code' => 'nullable|string|max:10',
            'gst_number' => 'nullable|string|max:15',
            'fulfillment_channels' => 'nullable|array',
            'fulfillment_channels.*' => 'nullable|string|max:120',
            'default_fulfillment_channel' => 'nullable|string|max:120',
            'shipping_acceptance_time' => 'nullable|string|max:120',
            'handling_time_business_days' => 'nullable|integer|min:0|max:30',
            'seller_settings' => 'nullable|array',
            'card_number' => 'nullable|string',
            'card_expiry' => 'nullable|string',
            'card_cvv' => 'nullable|string',
        ]);

        $updatedUser = $this->updateProfileService->handle($user, $fields);

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Profile updated successfully');
        }

        return response([
            'message' => 'Profile updated successfully',
            'user' => $updatedUser,
        ], 200);
    }
}
