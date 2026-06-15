import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      showToast(`Welcome back, ${loggedUser?.name || 'User'}!`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to login');
      showToast(err.message || 'Failed to login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-14 py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_20%_80%,rgba(251,191,36,0.08),transparent)]" />
        <Link href="/" className="font-serif text-2xl font-semibold text-white tracking-tight z-10">MyStore</Link>
        <div className="z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-4 block">Buyer Access</span>
          <h1 className="font-serif text-4xl font-semibold text-white leading-tight mb-4">Welcome back to MyStore.</h1>
          <p className="text-neutral-400 text-base leading-relaxed">Sign in to continue shopping, manage your account, and track your latest orders.</p>
        </div>
        <p className="text-neutral-600 text-xs z-10">© {new Date().getFullYear()} MyStore. All rights reserved.</p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden font-serif text-2xl font-semibold text-neutral-900 tracking-tight mb-8 block">MyStore</Link>

          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-800 transition-colors mb-6">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
              Back to store
            </Link>
            <h2 className="font-serif text-3xl font-semibold text-neutral-900 mb-2">Login to MyStore</h2>
            <p className="text-sm text-neutral-500">Enter your credentials to access your account.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-3.5 rounded-2xl mb-5">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-neutral-200 rounded-xl py-3 px-4 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all bg-white w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border border-neutral-200 rounded-xl py-3 px-4 pr-12 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all bg-white w-full"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 p-1" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 shadow-sm mt-2"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-sm text-neutral-500 text-center mt-6">
            Don't have an account? <Link href="/register" className="text-neutral-900 font-semibold underline underline-offset-2 hover:no-underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
