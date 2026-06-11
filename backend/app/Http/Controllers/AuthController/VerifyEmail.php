<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Services\AuthService\VerifyEmail as VerifyEmailService;
use Illuminate\Http\Request;

class VerifyEmail extends Controller
{
    public function __construct(private readonly VerifyEmailService $verifyEmailService)
    {
    }

    public function __invoke(Request $request)
    {
        $fields = $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $result = $this->verifyEmailService->handle($request->user(), $fields['code']);
        $message = $result['already_verified']
            ? 'Email is already verified.'
            : 'Email verified successfully';

        if ($request->header('X-Inertia')) {
            return back()->with('success', $message);
        }

        return response([
            'message' => $message,
            'user' => $result['user'],
        ], 200);
    }
}
