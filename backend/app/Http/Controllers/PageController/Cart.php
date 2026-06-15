<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Cart extends Controller
{
    use EnsuresRoles;

    public function __invoke(Request $request)
    {
        $this->ensureStorefrontAccess($request);

        return Inertia::render('App');
    }
}
