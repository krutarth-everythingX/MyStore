import React, { useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Building2, CheckCircle2, Eye, ShieldCheck, XCircle } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { SellerModalBackdrop, SellerModalCard, SellerPageHeader, SellerPageShell, SellerPill } from '../components/seller-workspace';

const COUNTRY_REVIEW_PROFILES = {
  india: {
    taxIdLabel: 'GSTIN',
    secondaryTaxLabel: 'PAN Number',
    registrationLabel: 'CIN / LLPIN / Registration Number',
    bankCodeLabel: 'IFSC Code',
    documents: [
      ['GST Certificate', 'gst_certificate_url'],
      ['PAN Card', 'pan_card_url'],
      ['Business Registration', 'business_registration_url'],
      ['Address Proof', 'address_proof_url'],
      ['Cancelled Cheque / Bank Proof', 'bank_proof_url'],
      ['Owner / Authorized ID', 'identity_document_url'],
    ],
  },
  'united states': {
    taxIdLabel: 'EIN / Tax ID',
    secondaryTaxLabel: 'SSN / ITIN / State Tax ID',
    registrationLabel: 'State Registration / LLC / Corporation Number',
    bankCodeLabel: 'Routing Number',
    documents: [
      ['IRS / EIN Proof', 'gst_certificate_url'],
      ['State Registration', 'business_registration_url'],
      ['Address Proof', 'address_proof_url'],
      ['Voided Check / Bank Proof', 'bank_proof_url'],
      ['Owner / Authorized ID', 'identity_document_url'],
      ['Additional Tax Proof', 'pan_card_url'],
    ],
  },
  'united kingdom': {
    taxIdLabel: 'VAT Number / UTR',
    secondaryTaxLabel: 'Company Number',
    registrationLabel: 'Companies House Registration',
    bankCodeLabel: 'Sort Code',
    documents: [
      ['VAT / UTR Proof', 'gst_certificate_url'],
      ['Companies House Document', 'business_registration_url'],
      ['Address Proof', 'address_proof_url'],
      ['Bank Statement / Bank Proof', 'bank_proof_url'],
      ['Director / Owner ID', 'identity_document_url'],
      ['Additional Tax Document', 'pan_card_url'],
    ],
  },
  canada: {
    taxIdLabel: 'GST/HST / BN',
    secondaryTaxLabel: 'Provincial Tax ID',
    registrationLabel: 'Business Registration Number',
    bankCodeLabel: 'Transit / Institution Number',
    documents: [
      ['GST/HST or BN Proof', 'gst_certificate_url'],
      ['Business Registration', 'business_registration_url'],
      ['Address Proof', 'address_proof_url'],
      ['Bank Proof', 'bank_proof_url'],
      ['Owner / Authorized ID', 'identity_document_url'],
      ['Additional Tax Document', 'pan_card_url'],
    ],
  },
  australia: {
    taxIdLabel: 'ABN / GST Number',
    secondaryTaxLabel: 'ACN / ARN',
    registrationLabel: 'Business Registration Number',
    bankCodeLabel: 'BSB Code',
    documents: [
      ['ABN / GST Proof', 'gst_certificate_url'],
      ['Business Registration', 'business_registration_url'],
      ['Address Proof', 'address_proof_url'],
      ['Bank Proof', 'bank_proof_url'],
      ['Owner / Authorized ID', 'identity_document_url'],
      ['Additional Tax Document', 'pan_card_url'],
    ],
  },
  'united arab emirates': {
    taxIdLabel: 'TRN / VAT Number',
    secondaryTaxLabel: 'Trade Licence Number',
    registrationLabel: 'Trade Licence / Company Registration',
    bankCodeLabel: 'IBAN / Routing Code',
    documents: [
      ['TRN / VAT Proof', 'gst_certificate_url'],
      ['Trade Licence', 'business_registration_url'],
      ['Address Proof', 'address_proof_url'],
      ['Bank Proof', 'bank_proof_url'],
      ['Owner / Authorized ID', 'identity_document_url'],
      ['Additional Registration Proof', 'pan_card_url'],
    ],
  },
  singapore: {
    taxIdLabel: 'GST / UEN',
    secondaryTaxLabel: 'ACRA Number',
    registrationLabel: 'Business Registration Number',
    bankCodeLabel: 'Bank / Branch Code',
    documents: [
      ['GST / UEN Proof', 'gst_certificate_url'],
      ['ACRA Registration', 'business_registration_url'],
      ['Address Proof', 'address_proof_url'],
      ['Bank Proof', 'bank_proof_url'],
      ['Owner / Authorized ID', 'identity_document_url'],
      ['Additional Registration Proof', 'pan_card_url'],
    ],
  },
  japan: {
    taxIdLabel: 'Corporate Number / Consumption Tax ID',
    secondaryTaxLabel: 'Registration Number',
    registrationLabel: 'Business Registration Number',
    bankCodeLabel: 'Bank / Branch Code',
    documents: [
      ['Tax / Corporate Number Proof', 'gst_certificate_url'],
      ['Business Registration', 'business_registration_url'],
      ['Address Proof', 'address_proof_url'],
      ['Bank Proof', 'bank_proof_url'],
      ['Owner / Authorized ID', 'identity_document_url'],
      ['Additional Registration Proof', 'pan_card_url'],
    ],
  },
  europe: {
    taxIdLabel: 'VAT Number',
    secondaryTaxLabel: 'Business Registration Number',
    registrationLabel: 'Commercial / Chamber Registration',
    bankCodeLabel: 'IBAN / BIC',
    documents: [
      ['VAT Proof', 'gst_certificate_url'],
      ['Business Registration', 'business_registration_url'],
      ['Address Proof', 'address_proof_url'],
      ['Bank Proof', 'bank_proof_url'],
      ['Owner / Authorized ID', 'identity_document_url'],
      ['Additional Tax / Registration Proof', 'pan_card_url'],
    ],
  },
  default: {
    taxIdLabel: 'Tax Registration ID',
    secondaryTaxLabel: 'Business / National Tax Number',
    registrationLabel: 'Business Registration Number',
    bankCodeLabel: 'Bank Routing / Branch Code',
    documents: [
      ['Tax Registration Proof', 'gst_certificate_url'],
      ['Business Registration', 'business_registration_url'],
      ['Address Proof', 'address_proof_url'],
      ['Bank Proof', 'bank_proof_url'],
      ['Owner / Authorized ID', 'identity_document_url'],
      ['Additional Tax / Registration Proof', 'pan_card_url'],
    ],
  },
};

const statusTone = status => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'success';
  if (normalized === 'submitted') return 'blue';
  if (normalized === 'resubmission_required') return 'warn';
  if (normalized === 'rejected') return 'danger';
  return 'neutral';
};

const profileForCountry = country => COUNTRY_REVIEW_PROFILES[String(country || '').trim().toLowerCase()] || COUNTRY_REVIEW_PROFILES.default;

const ReviewModal = ({ verification, onClose }) => {
  const [reviewNote, setReviewNote] = useState(verification.review_note || '');
  const [loading, setLoading] = useState(false);
  const countryProfile = profileForCountry(verification.business_country);

  const submitDecision = decision => {
    setLoading(true);
    router.post(`/seller/verification/${verification.id}/review`, {
      decision,
      review_note: reviewNote,
    }, {
      preserveScroll: true,
      onFinish: () => setLoading(false),
      onSuccess: () => onClose(),
    });
  };

  return (
    <SellerModalBackdrop onClose={onClose}>
      <SellerModalCard className="max-w-4xl" onMouseDown={event => event.stopPropagation()}>
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{verification.legal_name || verification.user?.brand_name || verification.user?.name}</h3>
              <p className="mt-2 text-sm text-neutral-600">{verification.user?.email}</p>
            </div>
            <SellerPill tone={statusTone(verification.status)}>{String(verification.status || '').replace(/_/g, ' ')}</SellerPill>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Business Type', verification.business_type || '-'],
              [countryProfile.taxIdLabel, verification.tax_id || '-'],
              [countryProfile.secondaryTaxLabel, verification.pan_number || '-'],
              [countryProfile.registrationLabel, verification.registration_number || '-'],
              ['Representative Name', verification.contact_person_name || '-'],
              ['Representative ID Type', verification.contact_person_id_type || '-'],
              ['Representative ID Number', verification.contact_person_id_number || '-'],
              ['Bank Holder', verification.bank_account_holder_name || '-'],
              ['Bank Name', verification.bank_name || '-'],
              ['Account Number', verification.bank_account_number || '-'],
              [countryProfile.bankCodeLabel, verification.bank_ifsc_code || '-'],
              ['Country', verification.business_country || '-'],
            ].map(([label, value]) => (
              <div key={label} className="border border-neutral-200 bg-white p-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
                <strong className="mt-2 block text-sm text-neutral-950">{value}</strong>
              </div>
            ))}
          </div>

          <div className="border border-neutral-200 bg-white p-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Business Address</span>
            <p className="mt-2 text-sm leading-6 text-neutral-700">{verification.business_address || '-'}</p>
            <p className="mt-2 text-sm text-neutral-500">{[verification.business_city, verification.business_state, verification.business_postal_code, verification.business_country].filter(Boolean).join(', ')}</p>
          </div>

          <div className="border border-neutral-200 bg-white p-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Submission Note</span>
            <p className="mt-2 text-sm leading-6 text-neutral-700">{verification.submission_note || 'No note shared.'}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {countryProfile.documents.map(([label, key]) => {
              const value = verification[key];
              return (
                <a key={label} href={value || '#'} target="_blank" rel="noopener noreferrer" className={`border p-4 ${value ? 'border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-50' : 'pointer-events-none border-neutral-200 bg-neutral-100 text-neutral-400'}`}>
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em]">{label}</span>
                  <span className="mt-3 block text-sm font-medium">{value ? 'Open uploaded file' : 'Not uploaded'}</span>
                </a>
              );
            })}
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Reviewer Note</span>
            <textarea value={reviewNote} onChange={event => setReviewNote(event.target.value)} rows={4} className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-950" />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="button" variant="outline" disabled={loading} onClick={() => submitDecision('resubmit')}>Request Resubmission</Button>
            <Button type="button" variant="outline" disabled={loading} onClick={() => submitDecision('reject')}>
              <XCircle size={15} />
              Reject
            </Button>
            <Button type="button" disabled={loading} onClick={() => submitDecision('approve')}>
              <CheckCircle2 size={15} />
              Approve
            </Button>
          </div>
        </div>
      </SellerModalCard>
    </SellerModalBackdrop>
  );
};

export const SellerVerificationReview = () => {
  const { props } = usePage();
  const verifications = props.sellerVerifications || [];
  const [selectedVerification, setSelectedVerification] = useState(null);

  const summary = useMemo(() => ({
    total: verifications.length,
    submitted: verifications.filter(item => item.status === 'submitted').length,
    approved: verifications.filter(item => item.status === 'approved').length,
    resubmission: verifications.filter(item => item.status === 'resubmission_required').length,
  }), [verifications]);

  return (
    <div>
      <Sidebar />
      <SellerPageShell>
        <SellerPageHeader
          title="Verification Review"
          description="Review seller identity, payout, address, tax, and country-specific document submissions."
          stats={[
            { label: 'Total Cases', value: String(summary.total), icon: Building2 },
            { label: 'Submitted', value: String(summary.submitted), icon: ShieldCheck, tone: 'blue' },
            { label: 'Approved', value: String(summary.approved), icon: CheckCircle2, tone: 'green' },
            { label: 'Resubmission', value: String(summary.resubmission), icon: XCircle, tone: 'amber' },
          ]}
        />

        <div className="border border-neutral-200 bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(0,1.2fr)_160px_160px_140px_120px] gap-3 border-b border-neutral-200 bg-neutral-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            <div>Seller</div>
            <div>Country</div>
            <div>Submitted</div>
            <div>Status</div>
            <div>Action</div>
          </div>
          <div className="divide-y divide-neutral-200">
            {verifications.map(verification => (
              <div key={verification.id} className="grid grid-cols-[minmax(0,1.2fr)_160px_160px_140px_120px] gap-3 px-4 py-4 text-sm text-neutral-800">
                <div className="min-w-0">
                  <strong className="block truncate text-neutral-950">{verification.legal_name || verification.user?.brand_name || verification.user?.name}</strong>
                  <span className="mt-1 block truncate text-xs text-neutral-500">{verification.user?.email}</span>
                </div>
                <div>{verification.business_country || '-'}</div>
                <div>{verification.submitted_at ? new Date(verification.submitted_at).toLocaleDateString() : '-'}</div>
                <div><SellerPill tone={statusTone(verification.status)}>{String(verification.status || '').replace(/_/g, ' ')}</SellerPill></div>
                <div>
                  <button type="button" onClick={() => setSelectedVerification(verification)} className="inline-flex h-9 w-9 items-center justify-center border border-neutral-950 bg-white text-neutral-950 transition hover:bg-neutral-100">
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedVerification ? <ReviewModal verification={selectedVerification} onClose={() => setSelectedVerification(null)} /> : null}
      </SellerPageShell>
    </div>
  );
};

export default SellerVerificationReview;
