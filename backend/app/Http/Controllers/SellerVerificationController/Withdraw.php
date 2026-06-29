<?php

namespace App\Http\Controllers\SellerVerificationController;

use App\Http\Controllers\Controller;
use App\Services\SellerVerificationService\WithdrawSellerVerification;
use Illuminate\Http\Request;

class Withdraw extends Controller
{
    public function __construct(private readonly WithdrawSellerVerification $withdrawSellerVerification)
    {
    }

    public function __invoke(Request $request)
    {
        abort_unless($request->user()?->role === 'seller', 403);

        $verification = $this->withdrawSellerVerification->handle($request->user());

        return back()->with(
            'success',
            $verification->status === 'draft'
                ? 'Verification submission withdrawn successfully.'
                : 'Verification could not be withdrawn.'
        );
    }
}
