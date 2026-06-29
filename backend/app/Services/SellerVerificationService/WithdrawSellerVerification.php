<?php

namespace App\Services\SellerVerificationService;

use App\Models\SellerVerification;
use App\Models\User;

class WithdrawSellerVerification
{
    public function handle(User $seller): SellerVerification
    {
        $verification = SellerVerification::where('user_id', $seller->id)->firstOrFail();

        if ($verification->status !== 'submitted') {
            return $verification->fresh(['user', 'reviewer']);
        }

        $verification->forceFill([
            'status' => 'draft',
            'review_note' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ])->save();

        return $verification->fresh(['user', 'reviewer']);
    }
}
