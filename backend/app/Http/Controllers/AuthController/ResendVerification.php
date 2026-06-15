<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Services\AuthService\ResendVerification as ResendVerificationService;
use Illuminate\Http\Request;

class ResendVerification extends Controller
{
    public function __construct(private readonly ResendVerificationService $resendVerificationService)
    {
    }

    public function __invoke(Request $request)
    {
        $user = $request->user();

        if (! $this->resendVerificationService->handle($user)) {
            return response([
                'message' => 'Email is already verified.',
                'user' => $user,
            ], 400);
        }

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Verification code sent successfully.');
        }

        return response([
            'message' => 'Verification code sent successfully.',
            'user' => $user->refresh(),
        ], 200);
    }
}
