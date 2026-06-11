<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class Profile extends Controller
{
    public function __invoke(Request $request)
    {
        return response($request->user(), 200);
    }
}
