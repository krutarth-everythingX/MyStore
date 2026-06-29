<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seller_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status', 40)->default('draft');
            $table->string('business_type', 120)->nullable();
            $table->string('legal_name')->nullable();
            $table->string('tax_id', 120)->nullable();
            $table->string('pan_number', 120)->nullable();
            $table->string('registration_number', 120)->nullable();
            $table->string('contact_person_name')->nullable();
            $table->string('contact_person_id_type', 120)->nullable();
            $table->string('contact_person_id_number', 120)->nullable();
            $table->string('bank_account_holder_name')->nullable();
            $table->string('bank_name', 160)->nullable();
            $table->string('bank_account_number', 120)->nullable();
            $table->string('bank_ifsc_code', 120)->nullable();
            $table->text('business_address')->nullable();
            $table->string('business_city', 120)->nullable();
            $table->string('business_state', 120)->nullable();
            $table->string('business_country', 120)->nullable();
            $table->string('business_postal_code', 40)->nullable();
            $table->string('gst_certificate_url', 2048)->nullable();
            $table->string('pan_card_url', 2048)->nullable();
            $table->string('business_registration_url', 2048)->nullable();
            $table->string('address_proof_url', 2048)->nullable();
            $table->string('bank_proof_url', 2048)->nullable();
            $table->string('identity_document_url', 2048)->nullable();
            $table->json('risk_flags')->nullable();
            $table->text('submission_note')->nullable();
            $table->text('review_note')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seller_verifications');
    }
};
