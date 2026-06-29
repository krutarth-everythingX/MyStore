<?php

namespace App\Services\SellerVerificationService;

use App\Models\SellerVerification;
use Illuminate\Database\Eloquent\Collection;

class ListSellerVerifications
{
    public function handle(): Collection
    {
        return SellerVerification::with(['user', 'reviewer'])
            ->latest('updated_at')
            ->get();
    }
}
