import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();

  const redirectParam = new URLSearchParams(window.location.search).get('redirect');
  const googleHref = `/auth/google?role=${encodeURIComponent(role)}${redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ''}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, '', password, role);
      showToast('Registration successful! Send a verification code from your profile when you are ready.', 'success');
    } catch (err) {
      setError(err.message || 'Registration failed');
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
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
              <h1 className="text-5xl font-semibold tracking-tight text-white xl:text-6xl">Create account.</h1>
              <p className="mt-5 max-w-md text-base leading-7 text-neutral-400">Set up your MyStore account in a few simple steps.</p>
            </div>
            <p className="text-sm text-neutral-500">&copy; {new Date().getFullYear()} MyStore</p>
          </div>
        </section>

        <section className="flex h-dvh items-center justify-center overflow-hidden bg-neutral-50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col justify-center border-2 border-neutral-950 bg-white p-5 shadow-[10px_10px_0_#171717] sm:max-h-[calc(100dvh-2rem)] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold text-neutral-900">
                <span className="inline-flex h-10 w-10 items-center justify-center border-2 border-neutral-950 bg-neutral-950 text-xs font-bold tracking-[0.3em] text-white">
                  MS
                </span>
                MyStore
              </Link>
              <Link href="/" className="text-sm text-neutral-500 transition hover:text-neutral-900">Back</Link>
            </div>

            <div className="mt-4 sm:mt-6">
              <h2 className="text-[1.9rem] font-semibold tracking-tight text-neutral-950 sm:text-3xl">Register</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">Create your account with the details below.</p>
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5">
              <span className="text-sm font-medium text-neutral-700">Account type</span>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'buyer', label: 'Buyer', sub: 'to shop items' },
                  { value: 'seller', label: 'Seller', sub: 'to sell items' },
                ].map(({ value, label, sub }) => (
                  <label key={value} className={`min-h-18 cursor-pointer border-2 p-3 transition ${role === value ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-950'}`}>
                    <input className="sr-only" type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} />
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className={`mt-1 block text-xs ${role === value ? 'text-neutral-300' : 'text-neutral-500'}`}>{sub}</span>
                  </label>
                ))}
              </div>
            </div>

            <a href={googleHref} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-3 border-2 border-neutral-950 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100">
              <span className="inline-flex h-8 w-8 items-center justify-center border border-neutral-300 bg-neutral-100 text-sm font-bold text-neutral-700">
                G
              </span>
              Continue with Google
            </a>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-800">Full Name</label>
                <input className="h-11 w-full border-2 border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950" type="text" placeholder="Enter your full name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-800">Email Address</label>
                <input className="h-11 w-full border-2 border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950" type="email" placeholder="Enter your email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-800">Password</label>
                <div className="relative">
                  <input className="h-11 w-full border-2 border-neutral-300 bg-white px-4 pr-12 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950" type={showPassword ? 'text' : 'password'} placeholder="Enter password (min 6 chars)" value={password} onChange={(event) => setPassword(event.target.value)} required />
                  <button className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center text-neutral-500 transition hover:text-neutral-900" type="button" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button className="inline-flex h-11 w-full items-center justify-center border-2 border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-neutral-500">
              Already have an account?{' '}
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

export default Register;
