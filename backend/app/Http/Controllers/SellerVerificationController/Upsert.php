<?php

namespace App\Http\Controllers\SellerVerificationController;

use App\Http\Controllers\Controller;
use App\Services\SellerVerificationService\UpsertSellerVerification;
use Illuminate\Http\Request;

class Upsert extends Controller
{
    public function __construct(private readonly UpsertSellerVerification $upsertSellerVerification)
    {
    }

    public function __invoke(Request $request)
    {
        abort_unless($request->user()?->role === 'seller', 403);

        $data = $request->validate([
            'business_type' => ['required', 'string', 'max:120'],
            'legal_name' => ['required', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:120'],
            'pan_number' => ['nullable', 'string', 'max:120'],
            'registration_number' => ['nullable', 'string', 'max:120'],
            'contact_person_name' => ['required', 'string', 'max:255'],
            'contact_person_id_type' => ['required', 'string', 'max:120'],
            'contact_person_id_number' => ['required', 'string', 'max:120'],
            'bank_account_holder_name' => ['required', 'string', 'max:255'],
            'bank_name' => ['required', 'string', 'max:160'],
            'bank_account_number' => ['required', 'string', 'max:120'],
            'bank_ifsc_code' => ['nullable', 'string', 'max:120'],
            'business_address' => ['required', 'string'],
            'business_city' => ['required', 'string', 'max:120'],
            'business_state' => ['required', 'string', 'max:120'],
            'business_country' => ['required', 'string', 'max:120'],
            'business_postal_code' => ['required', 'string', 'max:40'],
            'gst_certificate_url' => ['nullable', 'string', 'max:2048'],
            'pan_card_url' => ['nullable', 'string', 'max:2048'],
            'business_registration_url' => ['nullable', 'string', 'max:2048'],
            'address_proof_url' => ['nullable', 'string', 'max:2048'],
            'bank_proof_url' => ['nullable', 'string', 'max:2048'],
            'identity_document_url' => ['nullable', 'string', 'max:2048'],
            'submission_note' => ['nullable', 'string', 'max:4000'],
            'submit' => ['nullable', 'boolean'],
        ]);

        $verification = $this->upsertSellerVerification->handle($request->user(), [
            ...$data,
            'submit' => (bool) ($data['submit'] ?? false),
        ]);

        return back()->with(
            'success',
            $verification->status === 'submitted'
                ? 'Verification submitted successfully.'
                : 'Verification draft saved.'
        );
    }
}
