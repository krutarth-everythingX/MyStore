<?php

namespace App\Models;

use App\Traits\StoresUtcTimestamps;
use Illuminate\Database\Eloquent\Model;

class SellerVerification extends Model
{
    use StoresUtcTimestamps;

    protected $fillable = [
        'user_id',
        'status',
        'business_type',
        'legal_name',
        'tax_id',
        'pan_number',
        'registration_number',
        'contact_person_name',
        'contact_person_id_type',
        'contact_person_id_number',
        'bank_account_holder_name',
        'bank_name',
        'bank_account_number',
        'bank_ifsc_code',
        'business_address',
        'business_city',
        'business_state',
        'business_country',
        'business_postal_code',
        'gst_certificate_url',
        'pan_card_url',
        'business_registration_url',
        'address_proof_url',
        'bank_proof_url',
        'identity_document_url',
        'risk_flags',
        'submission_note',
        'review_note',
        'reviewed_by',
        'submitted_at',
        'reviewed_at',
    ];

    protected $casts = [
        'risk_flags' => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
