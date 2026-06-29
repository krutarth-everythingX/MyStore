import React from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const sellerDashboardPath = (user) => {
  if (!user) return '/login';

  const requiresIndianTaxRegistration = String(user?.country || '').trim().toLowerCase() === 'india';
  const profileReady = Boolean(
    user.brand_name
      && user.address
      && user.country
      && user.default_fulfillment_channel
      && (!requiresIndianTaxRegistration || user.gst_number)
  );
  const verification = user?.sellerVerification || user?.seller_verification || null;
  const verificationApproved = String(verification?.status || 'draft') === 'approved';

  if (user.role === 'seller') {
    return profileReady && verificationApproved ? '/seller/inventory' : '/seller/verification';
  }

  return '/';
};

export const PasswordResetComplete = () => {
  const { user, logout } = useAuth();

  const handleStay = () => {
    router.visit(sellerDashboardPath(user), {
      preserveScroll: true,
    });
  };

  const handleLoginAgain = async () => {
    await logout();
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.18),_transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ffffff_58%,#f0fdf4_100%)] px-4 py-4 sm:px-8 sm:py-10">
      <div className="w-full max-w-3xl rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-[0_35px_90px_rgba(15,23,42,0.12)] sm:rounded-[2rem] sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 sm:h-18 sm:w-18">
          <CheckCircle2 size={28} />
        </div>
        <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600 sm:mt-6">Password Updated</p>
        <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">Your new password is saved.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-neutral-500">
          Your password was changed from profile settings. Choose whether to continue in your dashboard right away or return to the login screen and sign in again manually.
        </p>

        <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2">
          <button className="group min-h-44 rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-5 text-left transition hover:border-neutral-900 hover:bg-white hover:shadow-xl sm:p-6" type="button" onClick={handleStay}>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
              <LayoutDashboard size={20} />
            </span>
            <strong className="mt-5 block text-lg font-semibold text-neutral-950">Stay in dashboard</strong>
            <span className="mt-2 block text-sm leading-6 text-neutral-500">Continue without logging in again.</span>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-950">
              Continue
              <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </span>
          </button>

          <button className="group min-h-44 rounded-[1.75rem] border border-neutral-200 bg-white p-5 text-left transition hover:border-neutral-900 hover:bg-neutral-50 hover:shadow-xl sm:p-6" type="button" onClick={handleLoginAgain}>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900">
              <LogIn size={20} />
            </span>
            <strong className="mt-5 block text-lg font-semibold text-neutral-950">Log in again</strong>
            <span className="mt-2 block text-sm leading-6 text-neutral-500">Return to the login page and sign in with the new password.</span>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-950">
              Go to login
              <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500">
          Need the storefront instead?{' '}
          <Link href="/" className="font-semibold text-neutral-950 transition hover:text-neutral-700">
            Go home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PasswordResetComplete;
