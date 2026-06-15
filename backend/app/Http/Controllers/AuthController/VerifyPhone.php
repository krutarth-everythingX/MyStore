<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Services\AuthService\VerifyPhone as VerifyPhoneService;
use Illuminate\Http\Request;

class VerifyPhone extends Controller
{
    public function __construct(private readonly VerifyPhoneService $verifyPhone)
    {
    }

    public function __invoke(Request $request)
    {
        $fields = $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $this->verifyPhone->handle($request->user(), $fields['code']);

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Phone number verified successfully.');
        }

        return response([
            'message' => 'Phone number verified successfully.',
            'user' => $user,
        ], 200);
    }
}
