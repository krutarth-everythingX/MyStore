<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class Profile extends Controller
{
    use EnsuresRoles;

    public function __invoke(Request $request)
    {
        $this->ensureBuyer($request);

        return response($request->user(), 200);
    }
}
