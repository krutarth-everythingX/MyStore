<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Controller;
use App\Models\SellerVerification as SellerVerificationModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerVerificationSubmitted extends Controller
{
    public function __invoke(Request $request)
    {
        abort_unless($request->user()?->role === 'seller', 403);

        if (seller_setup_complete($request->user())) {
            return redirect('/seller/inventory');
        }

        if (seller_verification_status($request->user()) !== 'submitted') {
            return redirect('/seller/verification');
        }

        return Inertia::render('App', [
            'sellerVerification' => SellerVerificationModel::with('reviewer')
                ->firstWhere('user_id', $request->user()->id),
        ]);
    }
}
