import React, { useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock3, FileClock, LogOut, Mail, PencilLine, RotateCcw, Store, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SellerVerificationSubmitted = () => {
  const { props } = usePage();
  const { logout, requestAccountDeletion } = useAuth();
  const verification = props.sellerVerification || null;
  const [error, setError] = useState('');
  const [accountActionLoading, setAccountActionLoading] = useState('');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const supportEmail = 'support@mystore.com';
  const detailRows = useMemo(() => [
    ['Legal Business Name', verification?.legal_name],
    ['Business Type', verification?.business_type],
    ['Business Country', verification?.business_country],
    ['Tax Registration', verification?.tax_id],
    ['Secondary Tax / ID', verification?.pan_number],
    ['Registration Number', verification?.registration_number],
    ['Representative Name', verification?.contact_person_name],
    ['Representative ID Type', verification?.contact_person_id_type],
    ['Representative ID Number', verification?.contact_person_id_number],
    ['Bank Account Holder', verification?.bank_account_holder_name],
    ['Bank Name', verification?.bank_name],
    ['Bank Account Number', verification?.bank_account_number],
    ['Bank Code', verification?.bank_ifsc_code],
    ['Business Address', verification?.business_address],
    ['Business City', verification?.business_city],
    ['Business State', verification?.business_state],
    ['Postal / ZIP Code', verification?.business_postal_code],
  ], [verification]);

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

  const handleWithdraw = () => {
    setWithdrawLoading(true);
    setError('');

    router.post('/seller/verification/withdraw', {}, {
      preserveScroll: true,
      onSuccess: () => {
        router.visit('/seller/verification', {
          replace: true,
          preserveScroll: true,
        });
      },
      onError: errors => {
        setError(Object.values(errors)[0] || 'Unable to withdraw the verification submission.');
        setWithdrawLoading(false);
      },
      onFinish: () => setWithdrawLoading(false),
    });
  };

  return (
    <div className="min-h-dvh bg-neutral-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5 border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-neutral-950 text-sm font-semibold tracking-[0.3em] text-white">
              MS
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Verification Submitted</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">Your seller onboarding is under review.</h1>
              <p className="mt-4 text-sm leading-7 text-neutral-600">
                You already submitted all required details. There is nothing else to fill right now. We will unlock the seller workspace after approval.
              </p>
            </div>

            <div className="space-y-3">
              <div className="border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-sky-900">
                  <FileClock size={16} />
                  Submission received
                </div>
                <p className="mt-2 text-sm leading-6 text-sky-900/80">
                  The onboarding form is locked while the review is in progress.
                </p>
              </div>

              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-950">
                  <Clock3 size={16} />
                  Current status: Submitted
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Normal approvals follow the standard admin review queue.
                </p>
              </div>
            </div>

            <div className="border border-neutral-200 bg-neutral-50 p-4 text-neutral-950">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Mail size={15} />
                Need urgent approval?
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                If the case is time-sensitive, contact admin with your seller email and mention that the verification is already submitted.
              </p>
              <a href={`mailto:${supportEmail}?subject=Urgent seller verification review`} className="mt-4 inline-flex min-h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800">
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

          <main className="space-y-5">
            {error ? <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}

            <section className="border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="mx-auto max-w-3xl text-center">
                <span className="mx-auto inline-flex h-16 w-16 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={28} />
                </span>
                <h2 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-950">Verification submitted successfully.</h2>
                <p className="mt-4 text-sm leading-7 text-neutral-600">
                  We have your business, payout, identity, tax, and address details. Your seller dashboard will become available automatically after approval.
                </p>
                <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailsVisible(current => !current)}
                    className="inline-flex min-h-11 items-center gap-2 border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  >
                    <PencilLine size={16} />
                    {detailsVisible ? 'Hide Submission Details' : 'Review & Edit Submission'}
                  </button>
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={withdrawLoading}
                    className="inline-flex min-h-11 items-center gap-2 border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCcw size={16} />
                    {withdrawLoading ? 'Withdrawing...' : 'Withdraw Submission'}
                  </button>
                </div>
              </div>
            </section>

            {detailsVisible ? (
              <>
                <section className="border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center border border-amber-200 bg-white text-amber-700">
                      <AlertTriangle size={18} />
                    </span>
                    <div>
                      <strong className="block text-sm font-semibold text-amber-900">Editing submitted details can delay approval.</strong>
                      <p className="mt-2 text-sm leading-6 text-amber-900/80">
                        If you reopen and change the submitted onboarding data, the admin may need to review the seller file again from the updated state.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-950">Submitted Details</h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        Review the exact seller details currently waiting for approval.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.visit('/seller/verification', { preserveScroll: true })}
                      className="inline-flex min-h-11 items-center justify-center gap-2 border border-neutral-950 bg-white px-4 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
                    >
                      <PencilLine size={16} />
                      Edit Submission
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {detailRows.map(([label, value]) => (
                      <div key={label} className="border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
                        <strong className="mt-2 block text-sm font-semibold text-neutral-950">{value || 'N/A'}</strong>
                      </div>
                    ))}
                  </div>

                  {verification?.submission_note ? (
                    <div className="mt-4 border border-neutral-200 bg-neutral-50 px-4 py-3">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Submission Note</span>
                      <p className="mt-2 text-sm leading-6 text-neutral-700">{verification.submission_note}</p>
                    </div>
                  ) : null}
                </section>
              </>
            ) : null}

            <section className="grid gap-5 md:grid-cols-3">
              <div className="border border-neutral-200 bg-white p-6 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Step 1</span>
                <strong className="mt-3 block text-lg font-semibold text-neutral-950">Submitted</strong>
                <p className="mt-2 text-sm leading-6 text-neutral-600">Your seller onboarding details are already in the review queue.</p>
              </div>
              <div className="border border-neutral-200 bg-white p-6 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Step 2</span>
                <strong className="mt-3 block text-lg font-semibold text-neutral-950">Review</strong>
                <p className="mt-2 text-sm leading-6 text-neutral-600">Admin checks business identity, tax, payout, and uploaded evidence.</p>
              </div>
              <div className="border border-neutral-200 bg-white p-6 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Step 3</span>
                <strong className="mt-3 block text-lg font-semibold text-neutral-950">Workspace Access</strong>
                <p className="mt-2 text-sm leading-6 text-neutral-600">Once approved, products, orders, profile business settings, and inventory tools open automatically.</p>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SellerVerificationSubmitted;
