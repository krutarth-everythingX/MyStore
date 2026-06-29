<?php

namespace App\Services\SellerVerificationService;

use App\Models\SellerVerification;
use App\Models\User;

class UpsertSellerVerification
{
    public function handle(User $seller, array $data): SellerVerification
    {
        $verification = SellerVerification::firstOrNew([
            'user_id' => $seller->id,
        ]);

        $nextStatus = $data['submit']
            ? (in_array($verification->status, [null, '', 'draft', 'resubmission_required', 'rejected'], true)
                ? 'submitted'
                : $verification->status)
            : ($verification->status ?: 'draft');

        if (in_array($verification->status, ['approved', 'under_review'], true) && $data['submit']) {
            $nextStatus = $verification->status;
        }

        $verification->fill([
            'status' => $nextStatus,
            'business_type' => $data['business_type'],
            'legal_name' => $data['legal_name'],
            'tax_id' => $data['tax_id'],
            'pan_number' => $data['pan_number'],
            'registration_number' => $data['registration_number'],
            'contact_person_name' => $data['contact_person_name'],
            'contact_person_id_type' => $data['contact_person_id_type'],
            'contact_person_id_number' => $data['contact_person_id_number'],
            'bank_account_holder_name' => $data['bank_account_holder_name'],
            'bank_name' => $data['bank_name'],
            'bank_account_number' => $data['bank_account_number'],
            'bank_ifsc_code' => $data['bank_ifsc_code'],
            'business_address' => $data['business_address'],
            'business_city' => $data['business_city'],
            'business_state' => $data['business_state'],
            'business_country' => $data['business_country'],
            'business_postal_code' => $data['business_postal_code'],
            'gst_certificate_url' => $data['gst_certificate_url'],
            'pan_card_url' => $data['pan_card_url'],
            'business_registration_url' => $data['business_registration_url'],
            'address_proof_url' => $data['address_proof_url'],
            'bank_proof_url' => $data['bank_proof_url'],
            'identity_document_url' => $data['identity_document_url'],
            'risk_flags' => $this->buildRiskFlags($data),
            'submission_note' => $data['submission_note'],
            'submitted_at' => $data['submit'] ? now() : $verification->submitted_at,
        ]);

        if (in_array($nextStatus, ['draft', 'submitted', 'resubmission_required'], true)) {
            $verification->review_note = null;
            $verification->reviewed_by = null;
            $verification->reviewed_at = null;
        }

        $verification->save();

        return $verification->fresh(['user', 'reviewer']);
    }

    private function buildRiskFlags(array $data): array
    {
        $flags = [];

        if (
            filled($data['legal_name'])
            && filled($data['bank_account_holder_name'])
            && strcasecmp(trim((string) $data['legal_name']), trim((string) $data['bank_account_holder_name'])) !== 0
        ) {
            $flags[] = 'name_mismatch';
        }

        if (strcasecmp((string) ($data['business_country'] ?? ''), 'India') === 0 && blank($data['tax_id'])) {
            $flags[] = 'missing_india_tax_id';
        }

        foreach ([
            'pan_card_url',
            'address_proof_url',
            'bank_proof_url',
            'identity_document_url',
        ] as $key) {
            if (blank($data[$key] ?? null)) {
                $flags[] = 'missing_' . str_replace('_url', '', $key);
            }
        }

        return array_values(array_unique($flags));
    }
}
