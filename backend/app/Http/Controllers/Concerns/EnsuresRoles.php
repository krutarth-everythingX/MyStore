<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

trait EnsuresRoles
{
    protected function ensureBuyer(Request $request): void
    {
        abort_unless($request->user()?->role === 'buyer', 403);
    }

    protected function ensureSeller(Request $request): void
    {
        abort_unless($request->user()?->role === 'seller', 403);
    }
}
