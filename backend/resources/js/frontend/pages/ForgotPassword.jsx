import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ForgotPassword = () => {
  const { sendPasswordResetLink, loading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await sendPasswordResetLink(email, 'forgot');
      const message = result.message || 'Password reset link sent successfully.';
      setSuccess(message);
      showToast(message, 'success');
    } catch (err) {
      const message = err.message || 'Failed to send password reset link';
      setError(message);
      showToast(message, 'error');
    }
  };

  return (
    <div className="min-h-dvh bg-neutral-950 text-white">
      <div className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-neutral-950 lg:flex">
          <div className="flex w-full flex-col justify-between p-12 xl:p-16">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-xs font-bold tracking-[0.3em] text-white">
              MS
            </div>
            <div className="max-w-xl">
              <h1 className="text-5xl font-semibold tracking-tight text-white xl:text-6xl">Reset password.</h1>
              <p className="mt-5 max-w-md text-base leading-7 text-neutral-400">We will send a password reset link to your email.</p>
            </div>
            <p className="text-sm text-neutral-500">&copy; {new Date().getFullYear()} MyStore</p>
          </div>
        </section>

        <section className="flex h-dvh items-center justify-center overflow-hidden bg-neutral-50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col justify-center border-2 border-neutral-950 bg-white p-5 shadow-[10px_10px_0_#171717] sm:max-h-[calc(100dvh-2rem)] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold text-neutral-900">
                <span className="inline-flex h-10 w-10 items-center justify-center border-2 border-neutral-950 bg-neutral-950 text-xs font-bold tracking-[0.3em] text-white">MS</span>
                MyStore
              </Link>
              <Link href="/" className="text-sm text-neutral-500 transition hover:text-neutral-900">Back</Link>
            </div>

            <div className="mt-4 sm:mt-6">
              <h2 className="text-[1.9rem] font-semibold tracking-tight text-neutral-950 sm:text-3xl">Forgot password</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">Enter your email address to receive a reset link.</p>
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-neutral-800">Email Address</label>
                  <Link href="/login" className="text-sm text-neutral-500 transition hover:text-neutral-900">
                    Back to login
                  </Link>
                </div>
                <input
                  className="h-11 w-full border-2 border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
                  type="email"
                  placeholder="Enter your account email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <button className="inline-flex h-11 w-full items-center justify-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400" type="submit" disabled={loading}>
                <span>{loading ? 'Sending Link...' : 'Send Reset Link'}</span>
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-neutral-500">
              Remember your password?{' '}
              <Link href="/login" className="font-semibold text-neutral-950 transition hover:text-neutral-700">
                Login here
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;
