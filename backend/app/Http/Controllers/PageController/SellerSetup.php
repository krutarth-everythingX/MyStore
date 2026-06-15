<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerSetup extends Controller
{
    use EnsuresRoles;

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        if (seller_setup_complete($request->user())) {
            return redirect('/seller');
        }

        return Inertia::render('App');
    }
}
