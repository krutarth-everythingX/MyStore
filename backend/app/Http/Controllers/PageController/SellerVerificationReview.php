<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Controller;
use App\Services\SellerVerificationService\ListSellerVerifications;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerVerificationReview extends Controller
{
    public function __construct(private readonly ListSellerVerifications $listSellerVerifications)
    {
    }

    public function __invoke(Request $request)
    {
        abort_unless($request->user() && seller_verification_reviewer($request->user()), 403);

        return Inertia::render('App', [
            'sellerVerificationReview' => true,
            'sellerVerifications' => $this->listSellerVerifications->handle(),
        ]);
    }
}
