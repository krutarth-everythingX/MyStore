<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;

trait EnsuresRoles
{
    protected function ensureBuyer(Request $request): void
    {
        if ($request->user()?->role === 'buyer') {
            return;
        }

        if ($request->user()?->role === 'seller' && ! $request->expectsJson()) {
            $redirectTo = seller_setup_complete($request->user())
                ? '/seller/inventory'
                : (seller_verification_status($request->user()) === 'submitted'
                    ? '/seller/verification/submitted'
                    : '/seller/verification');

            throw new HttpResponseException(redirect($redirectTo));
        }

        abort(403);
    }

    protected function ensureStorefrontAccess(Request $request): void
    {
        if ($request->user()?->role !== 'seller') {
            return;
        }

        $redirectTo = seller_setup_complete($request->user())
            ? '/seller/inventory'
            : (seller_verification_status($request->user()) === 'submitted'
                ? '/seller/verification/submitted'
                : '/seller/verification');

        throw new HttpResponseException(redirect($redirectTo));
    }

    protected function ensureSeller(Request $request): void
    {
        abort_unless($request->user()?->role === 'seller', 403);

        if (
            ! seller_setup_complete($request->user())
            && ! in_array($request->path(), ['seller/verification', 'seller/verification/submitted'], true)
        ) {
            $redirectTo = seller_verification_status($request->user()) === 'submitted'
                ? '/seller/verification/submitted'
                : '/seller/verification';

            throw new HttpResponseException(redirect($redirectTo));
        }
    }
}
