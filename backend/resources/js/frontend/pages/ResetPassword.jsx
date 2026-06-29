import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ResetPassword = () => {
  const { resetPassword, loading } = useAuth();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');

  const currentUrl = useMemo(() => new URL(window.location.href), []);
  const token = currentUrl.pathname.split('/').filter(Boolean).pop() || '';
  const email = currentUrl.searchParams.get('email') || '';
  const source = currentUrl.searchParams.get('source') === 'profile' ? 'profile' : 'forgot';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await resetPassword({
        token,
        email,
        source,
        password,
        password_confirmation: passwordConfirmation,
      });
      showToast('Password changed successfully.', 'success');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
      showToast(err.message || 'Failed to reset password', 'error');
    }
  };

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_58%,#fef3c7_100%)] px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_35px_90px_rgba(15,23,42,0.12)] lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[1fr_0.92fr]">
        <section className="relative hidden bg-neutral-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(248,113,113,0.14),_transparent_34%)]" />
          <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-bold tracking-[0.3em] text-white">MS</div>
          <div className="relative max-w-xl">
            <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">Password Reset</span>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight">Choose a new password.</h1>
            <p className="mt-6 text-base leading-7 text-neutral-300">
              {source === 'profile'
                ? 'Use a strong password you have not used before, then choose whether to continue in your dashboard or sign in again.'
                : 'Use a strong password you have not used before. After saving it, you will return to the login page.'}
            </p>
          </div>
          <p className="relative text-sm text-neutral-400">© {new Date().getFullYear()} MyStore. All rights reserved.</p>
        </section>

        <section className="flex items-center justify-center px-5 py-6 sm:px-10 sm:py-10">
          <div className="w-full max-w-lg">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold text-neutral-900">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-xs font-bold tracking-[0.3em] text-white">MS</span>
              MyStore
            </Link>

            <div className="mt-6 sm:mt-10">
              <Link href="/login" className="inline-flex min-h-11 items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to login
              </Link>
              <div className="mt-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 sm:mt-6">
                <KeyRound size={22} />
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:mt-5">Reset your password</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-500">
                {source === 'profile' ? (
                  <>
                    Create a new password for <span className="font-semibold text-neutral-900">{email || 'your account'}</span>. You can stay in your dashboard after saving.
                  </>
                ) : (
                  <>
                    Create a new password for <span className="font-semibold text-neutral-900">{email || 'your account'}</span>. Then sign in again with the new password.
                  </>
                )}
              </p>
            </div>

            {error && (
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-800">New Password</label>
                <div className="relative">
                  <input className="h-13 w-full rounded-2xl border border-neutral-300 bg-white px-4 pr-12 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-200/70 sm:h-12 sm:text-sm" type={showPassword ? 'text' : 'password'} placeholder="Enter new password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                  <button className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 sm:h-9 sm:w-9" type="button" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-800">Confirm Password</label>
                <div className="relative">
                  <input className="h-13 w-full rounded-2xl border border-neutral-300 bg-white px-4 pr-12 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-200/70 sm:h-12 sm:text-sm" type={showConfirmation ? 'text' : 'password'} placeholder="Confirm new password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required />
                  <button className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 sm:h-9 sm:w-9" type="button" onClick={() => setShowConfirmation((value) => !value)}>
                    {showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-5 border-t border-neutral-200 bg-white/95 px-5 pb-1 pt-4 backdrop-blur sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0">
                <button className="inline-flex h-13 w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400 sm:h-12" type="submit" disabled={loading}>
                  {loading ? 'Saving Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;
