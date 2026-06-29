<?php

namespace App\Services\SellerVerificationService;

use App\Models\SellerVerification;
use App\Models\User;
use Illuminate\Support\Arr;

class ReviewSellerVerification
{
    public function handle(SellerVerification $verification, User $reviewer, string $decision, ?string $reviewNote = null): SellerVerification
    {
        $nextStatus = match ($decision) {
            'approve' => 'approved',
            'reject' => 'rejected',
            default => 'resubmission_required',
        };

        $verification->forceFill([
            'status' => $nextStatus,
            'review_note' => $reviewNote,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
        ])->save();

        if ($nextStatus === 'approved') {
            $this->syncApprovedVerificationToSellerProfile($verification);
        }

        return $verification->fresh(['user', 'reviewer']);
    }

    private function syncApprovedVerificationToSellerProfile(SellerVerification $verification): void
    {
        $seller = $verification->user()->first();

        if (! $seller) {
            return;
        }

        $currentSettings = $seller->seller_settings ?? [];
        $defaultChannel = $seller->default_fulfillment_channel ?: 'Seller Fulfilled';
        $currentChannels = collect($seller->fulfillment_channels ?: [])
            ->filter(fn ($channel) => filled($channel))
            ->values()
            ->all();
        $channels = array_values(array_unique(array_filter([
            ...$currentChannels,
            $defaultChannel,
        ])));
        $addressLine1 = trim((string) $verification->business_address);

        $nextSettings = array_replace_recursive($currentSettings, [
            'businessType' => $verification->business_type ?: Arr::get($currentSettings, 'businessType', 'Sole Proprietorship'),
            'panNumber' => $verification->pan_number ?: Arr::get($currentSettings, 'panNumber', ''),
            'registrationNumber' => $verification->registration_number ?: Arr::get($currentSettings, 'registrationNumber', ''),
            'addressLine1' => $addressLine1 ?: Arr::get($currentSettings, 'addressLine1', ''),
            'city' => $verification->business_city ?: Arr::get($currentSettings, 'city', ''),
            'state' => $verification->business_state ?: Arr::get($currentSettings, 'state', ''),
            'pickupCountry' => $verification->business_country ?: Arr::get($currentSettings, 'pickupCountry', ''),
            'pincode' => $verification->business_postal_code ?: Arr::get($currentSettings, 'pincode', ''),
            'accountHolderName' => $verification->bank_account_holder_name ?: Arr::get($currentSettings, 'accountHolderName', ''),
            'bankName' => $verification->bank_name ?: Arr::get($currentSettings, 'bankName', ''),
            'accountNumber' => $verification->bank_account_number ?: Arr::get($currentSettings, 'accountNumber', ''),
            'ifscCode' => $verification->bank_ifsc_code ?: Arr::get($currentSettings, 'ifscCode', ''),
            'gstRegistered' => filled($verification->tax_id) || Arr::get($currentSettings, 'gstRegistered', false),
            'gstCertificate' => $verification->gst_certificate_url ?: Arr::get($currentSettings, 'gstCertificate', ''),
            'panCard' => $verification->pan_card_url ?: Arr::get($currentSettings, 'panCard', ''),
            'businessLicense' => $verification->business_registration_url ?: Arr::get($currentSettings, 'businessLicense', ''),
            'addressProof' => $verification->address_proof_url ?: Arr::get($currentSettings, 'addressProof', ''),
            'cancelledCheque' => $verification->bank_proof_url ?: Arr::get($currentSettings, 'cancelledCheque', ''),
        ]);

        $seller->forceFill([
            'brand_name' => $verification->legal_name ?: $seller->brand_name ?: $seller->name,
            'gst_number' => $verification->tax_id ?: $seller->gst_number,
            'address' => $addressLine1 ?: $seller->address,
            'city' => $verification->business_city ?: $seller->city,
            'state' => $verification->business_state ?: $seller->state,
            'country' => $verification->business_country ?: $seller->country,
            'pincode' => $verification->business_postal_code ?: $seller->pincode,
            'fulfillment_channels' => $channels,
            'default_fulfillment_channel' => $defaultChannel,
            'shipping_acceptance_time' => $seller->shipping_acceptance_time ?: '2 hours',
            'handling_time_business_days' => $seller->handling_time_business_days ?: 1,
            'seller_settings' => $nextSettings,
        ])->save();
    }
}
