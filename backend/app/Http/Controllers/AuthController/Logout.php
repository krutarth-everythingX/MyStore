<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class Logout extends Controller
{
    public function __invoke(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response(['message' => 'Logged out successfully'], 200);
    }
}
