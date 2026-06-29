import React, { useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock3, FileBadge2, LogOut, Mail, ShieldCheck, Store, Trash2, Upload } from 'lucide-react';
import { Button } from '../components/Button';
import { SellerSelect } from '../components/seller-workspace';
import { useAuth } from '../context/AuthContext';

const readFileAsDataUrl = file => new Promise((resolve, reject) => {
  if (!file) {
    resolve('');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const COUNTRY_VERIFICATION_PROFILES = {
  india: {
    taxIdLabel: 'GSTIN',
    secondaryTaxLabel: 'PAN Number',
    registrationLabel: 'CIN / LLPIN / Registration Number',
    bankCodeLabel: 'IFSC Code',
    personIdOptions: ['Aadhaar', 'PAN', 'Passport', 'Driving Licence'],
    documents: [
      ['GST Certificate', 'gstCertificateUrl'],
      ['PAN Card', 'panCardUrl'],
      ['Business Registration', 'businessRegistrationUrl'],
      ['Address Proof', 'addressProofUrl'],
      ['Cancelled Cheque / Bank Proof', 'bankProofUrl'],
      ['Owner / Authorized ID', 'identityDocumentUrl'],
    ],
  },
  'united states': {
    taxIdLabel: 'EIN / Tax ID',
    secondaryTaxLabel: 'SSN / ITIN / State Tax ID',
    registrationLabel: 'State Registration / LLC / Corporation Number',
    bankCodeLabel: 'Routing Number',
    personIdOptions: ['Passport', 'Driving Licence', 'State ID'],
    documents: [
      ['IRS / EIN Proof', 'gstCertificateUrl'],
      ['State Registration', 'businessRegistrationUrl'],
      ['Address Proof', 'addressProofUrl'],
      ['Voided Check / Bank Proof', 'bankProofUrl'],
      ['Owner / Authorized ID', 'identityDocumentUrl'],
      ['Additional Tax Proof', 'panCardUrl'],
    ],
  },
  'united kingdom': {
    taxIdLabel: 'VAT Number / UTR',
    secondaryTaxLabel: 'Company Number',
    registrationLabel: 'Companies House Registration',
    bankCodeLabel: 'Sort Code',
    personIdOptions: ['Passport', 'Driving Licence', 'Residence Permit'],
    documents: [
      ['VAT / UTR Proof', 'gstCertificateUrl'],
      ['Companies House Document', 'businessRegistrationUrl'],
      ['Address Proof', 'addressProofUrl'],
      ['Bank Statement / Bank Proof', 'bankProofUrl'],
      ['Director / Owner ID', 'identityDocumentUrl'],
      ['Additional Tax Document', 'panCardUrl'],
    ],
  },
  canada: {
    taxIdLabel: 'GST/HST / BN',
    secondaryTaxLabel: 'Provincial Tax ID',
    registrationLabel: 'Business Registration Number',
    bankCodeLabel: 'Transit / Institution Number',
    personIdOptions: ['Passport', 'Driving Licence', 'Provincial ID'],
    documents: [
      ['GST/HST or BN Proof', 'gstCertificateUrl'],
      ['Business Registration', 'businessRegistrationUrl'],
      ['Address Proof', 'addressProofUrl'],
      ['Bank Proof', 'bankProofUrl'],
      ['Owner / Authorized ID', 'identityDocumentUrl'],
      ['Additional Tax Document', 'panCardUrl'],
    ],
  },
  australia: {
    taxIdLabel: 'ABN / GST Number',
    secondaryTaxLabel: 'ACN / ARN',
    registrationLabel: 'Business Registration Number',
    bankCodeLabel: 'BSB Code',
    personIdOptions: ['Passport', 'Driving Licence', 'Medicare / State ID'],
    documents: [
      ['ABN / GST Proof', 'gstCertificateUrl'],
      ['Business Registration', 'businessRegistrationUrl'],
      ['Address Proof', 'addressProofUrl'],
      ['Bank Proof', 'bankProofUrl'],
      ['Owner / Authorized ID', 'identityDocumentUrl'],
      ['Additional Tax Document', 'panCardUrl'],
    ],
  },
  'united arab emirates': {
    taxIdLabel: 'TRN / VAT Number',
    secondaryTaxLabel: 'Trade Licence Number',
    registrationLabel: 'Trade Licence / Company Registration',
    bankCodeLabel: 'IBAN / Routing Code',
    personIdOptions: ['Passport', 'Emirates ID', 'Residence Permit'],
    documents: [
      ['TRN / VAT Proof', 'gstCertificateUrl'],
      ['Trade Licence', 'businessRegistrationUrl'],
      ['Address Proof', 'addressProofUrl'],
      ['Bank Proof', 'bankProofUrl'],
      ['Owner / Authorized ID', 'identityDocumentUrl'],
      ['Additional Registration Proof', 'panCardUrl'],
    ],
  },
  singapore: {
    taxIdLabel: 'GST / UEN',
    secondaryTaxLabel: 'ACRA Number',
    registrationLabel: 'Business Registration Number',
    bankCodeLabel: 'Bank / Branch Code',
    personIdOptions: ['Passport', 'NRIC / FIN', 'Driving Licence'],
    documents: [
      ['GST / UEN Proof', 'gstCertificateUrl'],
      ['ACRA Registration', 'businessRegistrationUrl'],
      ['Address Proof', 'addressProofUrl'],
      ['Bank Proof', 'bankProofUrl'],
      ['Owner / Authorized ID', 'identityDocumentUrl'],
      ['Additional Registration Proof', 'panCardUrl'],
    ],
  },
  japan: {
    taxIdLabel: 'Corporate Number / Consumption Tax ID',
    secondaryTaxLabel: 'Registration Number',
    registrationLabel: 'Business Registration Number',
    bankCodeLabel: 'Bank / Branch Code',
    personIdOptions: ['Passport', 'Residence Card', 'Driving Licence', 'My Number Card'],
    documents: [
      ['Tax / Corporate Number Proof', 'gstCertificateUrl'],
      ['Business Registration', 'businessRegistrationUrl'],
      ['Address Proof', 'addressProofUrl'],
      ['Bank Proof', 'bankProofUrl'],
      ['Owner / Authorized ID', 'identityDocumentUrl'],
      ['Additional Registration Proof', 'panCardUrl'],
    ],
  },
  europe: {
    taxIdLabel: 'VAT Number',
    secondaryTaxLabel: 'Business Registration Number',
    registrationLabel: 'Commercial / Chamber Registration',
    bankCodeLabel: 'IBAN / BIC',
    personIdOptions: ['Passport', 'National ID', 'Residence Permit', 'Driving Licence'],
    documents: [
      ['VAT Proof', 'gstCertificateUrl'],
      ['Business Registration', 'businessRegistrationUrl'],
      ['Address Proof', 'addressProofUrl'],
      ['Bank Proof', 'bankProofUrl'],
      ['Owner / Authorized ID', 'identityDocumentUrl'],
      ['Additional Tax / Registration Proof', 'panCardUrl'],
    ],
  },
  default: {
    taxIdLabel: 'Tax Registration ID',
    secondaryTaxLabel: 'Business / National Tax Number',
    registrationLabel: 'Business Registration Number',
    bankCodeLabel: 'Bank Routing / Branch Code',
    personIdOptions: ['Passport', 'National ID', 'Driving Licence'],
    documents: [
      ['Tax Registration Proof', 'gstCertificateUrl'],
      ['Business Registration', 'businessRegistrationUrl'],
      ['Address Proof', 'addressProofUrl'],
      ['Bank Proof', 'bankProofUrl'],
      ['Owner / Authorized ID', 'identityDocumentUrl'],
      ['Additional Tax / Registration Proof', 'panCardUrl'],
    ],
  },
};

const fieldCls = 'h-11 w-full border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-950';
const textareaCls = 'w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-950';

const VerificationStatusPill = ({ status }) => {
  const normalized = String(status || 'draft').toLowerCase();
  const cls = normalized === 'approved'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : normalized === 'rejected'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : normalized === 'resubmission_required'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : normalized === 'submitted'
          ? 'border-sky-200 bg-sky-50 text-sky-800'
          : 'border-neutral-300 bg-neutral-100 text-neutral-700';

  return <span className={`inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${cls}`}>{normalized.replace(/_/g, ' ')}</span>;
};

const DocumentField = ({ label, value, onFileChange }) => (
  <label className="flex min-h-[150px] cursor-pointer flex-col justify-between border border-neutral-200 bg-white p-4 transition hover:bg-neutral-50">
    <div>
      <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
      <strong className="mt-3 block text-sm text-neutral-950">{value ? 'Uploaded' : 'Upload document'}</strong>
      <span className="mt-2 block text-sm text-neutral-500">{value ? 'Replace file if needed' : 'Image or PDF accepted'}</span>
    </div>
    <span className="mt-4 inline-flex h-10 w-10 items-center justify-center border border-neutral-950 bg-white text-neutral-950">
      <Upload size={16} />
    </span>
    <input className="hidden" type="file" accept="image/*,.pdf" onChange={onFileChange} />
  </label>
);

const verificationProfileForCountry = country => {
  const normalized = String(country || '').trim().toLowerCase();
  return COUNTRY_VERIFICATION_PROFILES[normalized] || COUNTRY_VERIFICATION_PROFILES.default;
};

export const SellerVerification = () => {
  const { props } = usePage();
  const { user, logout, requestAccountDeletion } = useAuth();
  const verification = props.sellerVerification || null;
  const sellerSettings = user?.seller_settings || {};
  const sellerCountry = user?.country || sellerSettings.pickupCountry || '';
  const countries = Object.values(props.localization?.countries || {}).map(country => country.name);
  const supportEmail = 'support@mystore.com';

  const [businessType, setBusinessType] = useState(verification?.business_type || sellerSettings.businessType || 'Sole Proprietorship');
  const [legalName, setLegalName] = useState(verification?.legal_name || user?.brand_name || user?.name || '');
  const [taxId, setTaxId] = useState(verification?.tax_id || user?.gst_number || '');
  const [panNumber, setPanNumber] = useState(verification?.pan_number || sellerSettings.panNumber || '');
  const [registrationNumber, setRegistrationNumber] = useState(verification?.registration_number || sellerSettings.registrationNumber || '');
  const [contactPersonName, setContactPersonName] = useState(verification?.contact_person_name || user?.name || '');
  const [contactPersonIdType, setContactPersonIdType] = useState(verification?.contact_person_id_type || 'Passport');
  const [contactPersonIdNumber, setContactPersonIdNumber] = useState(verification?.contact_person_id_number || '');
  const [bankAccountHolderName, setBankAccountHolderName] = useState(verification?.bank_account_holder_name || sellerSettings.accountHolderName || user?.name || '');
  const [bankName, setBankName] = useState(verification?.bank_name || sellerSettings.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(verification?.bank_account_number || sellerSettings.accountNumber || '');
  const [bankIfscCode, setBankIfscCode] = useState(verification?.bank_ifsc_code || sellerSettings.ifscCode || '');
  const [businessAddress, setBusinessAddress] = useState(verification?.business_address || user?.address || sellerSettings.addressLine1 || '');
  const [businessCity, setBusinessCity] = useState(verification?.business_city || user?.city || sellerSettings.city || '');
  const [businessState, setBusinessState] = useState(verification?.business_state || user?.state || sellerSettings.state || '');
  const [businessCountry, setBusinessCountry] = useState(verification?.business_country || sellerCountry);
  const [businessPostalCode, setBusinessPostalCode] = useState(verification?.business_postal_code || user?.pincode || sellerSettings.pincode || '');
  const [submissionNote, setSubmissionNote] = useState(verification?.submission_note || '');
  const [gstCertificateUrl, setGstCertificateUrl] = useState(verification?.gst_certificate_url || sellerSettings.gstCertificate || '');
  const [panCardUrl, setPanCardUrl] = useState(verification?.pan_card_url || sellerSettings.panCard || '');
  const [businessRegistrationUrl, setBusinessRegistrationUrl] = useState(verification?.business_registration_url || sellerSettings.businessLicense || '');
  const [addressProofUrl, setAddressProofUrl] = useState(verification?.address_proof_url || sellerSettings.addressProof || '');
  const [bankProofUrl, setBankProofUrl] = useState(verification?.bank_proof_url || sellerSettings.cancelledCheque || '');
  const [identityDocumentUrl, setIdentityDocumentUrl] = useState(verification?.identity_document_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountActionLoading, setAccountActionLoading] = useState('');

  const riskFlags = useMemo(() => verification?.risk_flags || [], [verification?.risk_flags]);
  const status = verification?.status || 'draft';
  const countryProfile = useMemo(() => verificationProfileForCountry(businessCountry), [businessCountry]);

  const documentState = {
    gstCertificateUrl,
    panCardUrl,
    businessRegistrationUrl,
    addressProofUrl,
    bankProofUrl,
    identityDocumentUrl,
  };

  const documentSetters = {
    gstCertificateUrl: setGstCertificateUrl,
    panCardUrl: setPanCardUrl,
    businessRegistrationUrl: setBusinessRegistrationUrl,
    addressProofUrl: setAddressProofUrl,
    bankProofUrl: setBankProofUrl,
    identityDocumentUrl: setIdentityDocumentUrl,
  };

  const handleDocumentChange = key => async event => {
    const setter = documentSetters[key];
    if (typeof setter !== 'function') {
      return;
    }

    setter(await readFileAsDataUrl(event.target.files?.[0] || null));
  };

  const submitVerification = submit => {
    setLoading(true);
    setError('');

    router.post('/seller/verification', {
      business_type: businessType,
      legal_name: legalName,
      tax_id: taxId,
      pan_number: panNumber,
      registration_number: registrationNumber,
      contact_person_name: contactPersonName,
      contact_person_id_type: contactPersonIdType,
      contact_person_id_number: contactPersonIdNumber,
      bank_account_holder_name: bankAccountHolderName,
      bank_name: bankName,
      bank_account_number: bankAccountNumber,
      bank_ifsc_code: bankIfscCode,
      business_address: businessAddress,
      business_city: businessCity,
      business_state: businessState,
      business_country: businessCountry,
      business_postal_code: businessPostalCode,
      gst_certificate_url: gstCertificateUrl,
      pan_card_url: panCardUrl,
      business_registration_url: businessRegistrationUrl,
      address_proof_url: addressProofUrl,
      bank_proof_url: bankProofUrl,
      identity_document_url: identityDocumentUrl,
      submission_note: submissionNote,
      submit,
    }, {
      preserveScroll: true,
      onSuccess: page => {
        const nextVerification = page?.props?.auth?.user?.sellerVerification || page?.props?.auth?.user?.seller_verification || null;
        const nextStatus = String(nextVerification?.status || '');
        if (nextStatus === 'submitted') {
          router.visit('/seller/verification/submitted', {
            replace: true,
            preserveScroll: true,
          });
        }
      },
      onError: errors => {
        setError(Object.values(errors)[0] || 'Unable to save verification.');
        setLoading(false);
      },
      onFinish: () => setLoading(false),
    });
  };

  const reviewTimelineLabel = status === 'approved'
    ? 'Approved for selling'
    : status === 'submitted'
      ? 'Under review'
      : status === 'resubmission_required'
        ? 'Changes needed'
        : status === 'rejected'
          ? 'Review closed'
          : 'Draft in progress';

  const handleLogout = async () => {
    setAccountActionLoading('logout');
    try {
      await logout();
    } finally {
      setAccountActionLoading('');
    }
  };

  const handleDeleteAccount = async () => {
    setAccountActionLoading('delete');

    try {
      await requestAccountDeletion();
    } catch (err) {
      setError(err.message || 'Failed to schedule account deletion.');
      setAccountActionLoading('');
      return;
    }

    setAccountActionLoading('');
  };

  return (
    <div className="min-h-dvh bg-neutral-100">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-5 border border-neutral-200 bg-white p-6 shadow-sm xl:sticky xl:top-5 xl:h-fit">
            <div className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-neutral-950 text-sm font-semibold tracking-[0.3em] text-white">
              MS
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Seller Onboarding</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">Start selling with verification.</h1>
              <p className="mt-4 text-sm leading-7 text-neutral-600">
                This page is only for onboarding. Your seller workspace opens after the business review is approved.
              </p>
            </div>

            <div className="space-y-3">
              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Verification Status</span>
                <div className="mt-3">
                  <VerificationStatusPill status={status} />
                </div>
              </div>

              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-950">
                  <Clock3 size={15} />
                  {reviewTimelineLabel}
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Normal approval usually follows the standard review queue after submission.
                </p>
              </div>

              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Seller Country</span>
                <strong className="mt-2 block text-sm text-neutral-950">{businessCountry || 'Select country below'}</strong>
              </div>
            </div>

            {verification?.review_note ? (
              <div className="border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Reviewer Note</span>
                <p className="mt-2 text-sm leading-6">{verification.review_note}</p>
              </div>
            ) : null}

            {riskFlags.length ? (
              <div className="border border-rose-200 bg-rose-50 p-4 text-rose-900">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle size={15} />
                  Risk flags detected
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {riskFlags.map(flag => (
                    <span key={flag} className="inline-flex items-center border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700">
                      {flag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 size={15} />
                  No automatic risk flags right now.
                </div>
              </div>
            )}

            <div className="border border-neutral-200 bg-neutral-50 p-4 text-neutral-950">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Mail size={15} />
                Need urgent approval?
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Use the normal review queue for standard cases. If approval is time-sensitive, contact admin with your seller email and verification status.
              </p>
              <a href={`mailto:${supportEmail}?subject=Urgent seller verification`} className="mt-4 inline-flex min-h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800">
                {supportEmail}
              </a>
            </div>

            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Other Actions</span>
              <div className="mt-4 space-y-2">
                <Link href="/" className="flex min-h-11 items-center gap-3 border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100">
                  <Store size={16} />
                  Storefront
                </Link>
                <button type="button" onClick={handleLogout} disabled={accountActionLoading === 'logout'} className="flex min-h-11 w-full items-center gap-3 border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60">
                  <LogOut size={16} />
                  {accountActionLoading === 'logout' ? 'Logging out...' : 'Log Out'}
                </button>
                <button type="button" onClick={handleDeleteAccount} disabled={accountActionLoading === 'delete'} className="flex min-h-11 w-full items-center gap-3 border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">
                  <Trash2 size={16} />
                  {accountActionLoading === 'delete' ? 'Scheduling deletion...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </aside>

          <main className="bg-neutral-50 p-4 sm:p-5 lg:p-6">
            <div className="space-y-5">
              <div className="border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Business Verification</div>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">Submit your onboarding details.</h2>
                    <p className="mt-3 text-sm leading-7 text-neutral-600">
                      We only ask for details that already exist in the seller system and that sellers can actually provide. After approval, the same business details remain visible in your profile business section.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" disabled={loading} onClick={() => submitVerification(false)}>
                      Save Draft
                    </Button>
                    <Button type="button" disabled={loading || status === 'approved'} onClick={() => submitVerification(true)}>
                      {loading ? 'Submitting...' : status === 'resubmission_required' ? 'Resubmit for Review' : 'Submit for Review'}
                    </Button>
                  </div>
                </div>
              </div>

              {error ? <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}

              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_22rem]">
                <section className="space-y-5">
                  <div className="border border-neutral-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-950">Business Details</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Business Type</span>
                        <SellerSelect value={businessType} onChange={event => setBusinessType(event.target.value)}>
                          <option>Individual</option>
                          <option>Sole Proprietorship</option>
                          <option>Partnership</option>
                          <option>Private Limited</option>
                          <option>LLP</option>
                          <option>Corporation</option>
                        </SellerSelect>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Legal Business Name</span>
                        <input className={fieldCls} value={legalName} onChange={event => setLegalName(event.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Business Country</span>
                        <SellerSelect value={businessCountry} onChange={event => setBusinessCountry(event.target.value)}>
                          <option value="">Select country</option>
                          {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </SellerSelect>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{countryProfile.taxIdLabel}</span>
                        <input className={fieldCls} value={taxId} onChange={event => setTaxId(event.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{countryProfile.secondaryTaxLabel}</span>
                        <input className={fieldCls} value={panNumber} onChange={event => setPanNumber(event.target.value.toUpperCase())} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{countryProfile.registrationLabel}</span>
                        <input className={fieldCls} value={registrationNumber} onChange={event => setRegistrationNumber(event.target.value)} />
                      </label>
                    </div>
                  </div>

                  <div className="border border-neutral-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-950">Authorized Representative</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Representative Name</span>
                        <input className={fieldCls} value={contactPersonName} onChange={event => setContactPersonName(event.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Representative ID Type</span>
                        <SellerSelect value={contactPersonIdType} onChange={event => setContactPersonIdType(event.target.value)}>
                          {countryProfile.personIdOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </SellerSelect>
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Representative ID Number</span>
                        <input className={fieldCls} value={contactPersonIdNumber} onChange={event => setContactPersonIdNumber(event.target.value)} />
                      </label>
                    </div>
                  </div>

                  <div className="border border-neutral-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-950">Payout & Business Address</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Account Holder Name</span>
                        <input className={fieldCls} value={bankAccountHolderName} onChange={event => setBankAccountHolderName(event.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Bank Name</span>
                        <input className={fieldCls} value={bankName} onChange={event => setBankName(event.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Bank Account Number</span>
                        <input className={fieldCls} value={bankAccountNumber} onChange={event => setBankAccountNumber(event.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{countryProfile.bankCodeLabel}</span>
                        <input className={fieldCls} value={bankIfscCode} onChange={event => setBankIfscCode(event.target.value)} />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Business Address</span>
                        <textarea className={textareaCls} rows={4} value={businessAddress} onChange={event => setBusinessAddress(event.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">City</span>
                        <input className={fieldCls} value={businessCity} onChange={event => setBusinessCity(event.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">State / Region</span>
                        <input className={fieldCls} value={businessState} onChange={event => setBusinessState(event.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Postal / ZIP Code</span>
                        <input className={fieldCls} value={businessPostalCode} onChange={event => setBusinessPostalCode(event.target.value)} />
                      </label>
                    </div>
                  </div>

                  <div className="border border-neutral-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-950">Country-Specific Documents</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {countryProfile.documents.map(([label, key]) => (
                        <DocumentField key={key} label={label} value={documentState[key]} onFileChange={handleDocumentChange(key)} />
                      ))}
                    </div>
                  </div>

                  <div className="border border-neutral-200 bg-white p-6 shadow-sm">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Submission Note</span>
                      <textarea
                        className={textareaCls}
                        rows={4}
                        value={submissionNote}
                        onChange={event => setSubmissionNote(event.target.value)}
                        placeholder="Share anything the reviewer should know about your business registration, tax setup, or document variations."
                      />
                    </label>
                  </div>
                </section>

                <aside className="h-fit space-y-5 2xl:sticky 2xl:top-6">
                  <div className="border border-neutral-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} className="text-neutral-950" />
                      <h3 className="text-lg font-semibold text-neutral-950">Onboarding Summary</h3>
                    </div>
                    <div className="mt-5 space-y-4">
                      <div className="border border-neutral-200 bg-neutral-50 p-4">
                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Current Status</span>
                        <div className="mt-3"><VerificationStatusPill status={status} /></div>
                      </div>

                      <div className="border border-neutral-200 bg-neutral-50 p-4">
                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Country Rule Set</span>
                        <strong className="mt-2 block text-sm text-neutral-950">{businessCountry || 'Global default'}</strong>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">
                          Labels and evidence requirements change by business country.
                        </p>
                      </div>

                      <div className="border border-neutral-200 bg-neutral-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                          <FileBadge2 size={16} />
                          Business details collected here later appear in your profile business section after approval.
                        </div>
                      </div>

                      <div className="border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                          <AlertTriangle size={16} />
                          No seller workspace sidebar is shown until approval.
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SellerVerification;
