<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ForgotPassword extends Controller
{
    public function __invoke()
    {
        return Inertia::render('App');
    }
}
