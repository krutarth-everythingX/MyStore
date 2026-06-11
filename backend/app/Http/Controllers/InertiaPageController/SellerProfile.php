<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerProfile extends Controller
{
    use EnsuresRoles;

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('SellerProfile');
    }
}
