<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Notifications extends Controller
{
    public function __invoke(Request $request)
    {
        return Inertia::render('App');
    }
}
