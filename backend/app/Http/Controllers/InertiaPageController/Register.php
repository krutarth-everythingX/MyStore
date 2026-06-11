<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class Register extends Controller
{
    public function __invoke()
    {
        return Inertia::render('Register');
    }
}
