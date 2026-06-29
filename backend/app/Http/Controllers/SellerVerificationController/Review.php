<?php

namespace App\Http\Controllers\SellerVerificationController;

use App\Http\Controllers\Controller;
use App\Models\SellerVerification;
use App\Services\SellerVerificationService\ReviewSellerVerification;
use Illuminate\Http\Request;

class Review extends Controller
{
    public function __construct(private readonly ReviewSellerVerification $reviewSellerVerification)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        abort_unless($request->user() && seller_verification_reviewer($request->user()), 403);

        $data = $request->validate([
            'decision' => ['required', 'in:approve,reject,resubmit'],
            'review_note' => ['nullable', 'string', 'max:4000'],
        ]);

        $verification = SellerVerification::findOrFail($id);

        $this->reviewSellerVerification->handle(
            $verification,
            $request->user(),
            $data['decision'],
            $data['review_note'] ?? null,
        );

        return back()->with('success', 'Verification review updated.');
    }
}
