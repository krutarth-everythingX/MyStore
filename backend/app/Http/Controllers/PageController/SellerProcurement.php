<?php

namespace App\Http\Controllers\PageController;

use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerProcurement
{
    public function __invoke(Request $request)
    {
        return Inertia::render('App');
    }
}
