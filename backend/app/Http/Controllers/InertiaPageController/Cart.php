<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Cart extends Controller
{
    public function __invoke(Request $request)
    {
        return Inertia::render('Cart', [
            'couponPayload' => $request->session()->get('couponPayload'),
        ]);
    }
}
