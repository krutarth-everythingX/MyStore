<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Services\AuthService\SendPhoneVerification as SendPhoneVerificationService;
use Illuminate\Http\Request;

class SendPhoneVerification extends Controller
{
    public function __construct(private readonly SendPhoneVerificationService $sendPhoneVerification)
    {
    }

    public function __invoke(Request $request)
    {
        $fields = $request->validate([
            'country_code' => 'required|string|max:10',
            'phone' => 'required|string|max:20',
        ]);

        $user = $this->sendPhoneVerification->handle(
            $request->user(),
            $fields['country_code'],
            $fields['phone'],
        );

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Phone verification code sent successfully.');
        }

        return response([
            'message' => 'Phone verification code sent successfully.',
            'user' => $user,
        ], 200);
    }
}
