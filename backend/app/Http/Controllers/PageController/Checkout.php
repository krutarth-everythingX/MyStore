<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Checkout extends Controller
{
    use EnsuresRoles;

    public function __invoke(Request $request)
    {
        $this->ensureBuyer($request);

        return Inertia::render('App');
    }
}
