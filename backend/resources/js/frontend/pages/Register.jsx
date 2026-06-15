import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('buyer');
  const [brandName, setBrandName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, '', password, role, role === 'seller' ? brandName : '');
      showToast('Registration successful! A verification code has been sent to your email.', 'success');
    } catch (err) {
      setError(err.message || 'Registration failed');
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'border border-neutral-200 rounded-xl py-3 px-4 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all bg-white w-full';

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Left Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-14 py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_20%_80%,rgba(251,191,36,0.08),transparent)]" />
        <Link href="/" className="font-serif text-2xl font-semibold text-white tracking-tight z-10">MyStore</Link>
        <div className="z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-4 block">Create Account</span>
          <h1 className="font-serif text-4xl font-semibold text-white leading-tight mb-4">Join the storefront.</h1>
          <p className="text-neutral-400 text-base leading-relaxed">Create a buyer or seller account and step into a cleaner, more premium MyStore experience.</p>
        </div>
        <p className="text-neutral-600 text-xs z-10">© {new Date().getFullYear()} MyStore. All rights reserved.</p>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden font-serif text-2xl font-semibold text-neutral-900 tracking-tight mb-8 block">MyStore</Link>

          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-800 transition-colors mb-6">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
              Back to store
            </Link>
            <h2 className="font-serif text-3xl font-semibold text-neutral-900 mb-2">Create your Account</h2>
            <p className="text-sm text-neutral-500">Fill in the details below to get started.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-3.5 rounded-2xl mb-5">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Full Name</label>
              <input className={inputCls} type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Email Address</label>
              <input className={inputCls} type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputCls} pr-12`}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 p-1" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">I want to register as a:</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'buyer', label: 'Buyer', sub: 'to shop items' },
                  { value: 'seller', label: 'Seller', sub: 'to sell items' },
                ].map(({ value, label, sub }) => (
                  <label
                    key={value}
                    className={`flex flex-col items-center justify-center gap-1 border-2 rounded-2xl py-4 cursor-pointer transition-all ${role === value ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}
                  >
                    <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="hidden" />
                    <span className={`text-sm font-semibold ${role === value ? 'text-neutral-900' : 'text-neutral-600'}`}>{label}</span>
                    <span className="text-[11px] text-neutral-400">{sub}</span>
                  </label>
                ))}
              </div>
            </div>

            {role === 'seller' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Store / Brand Name</label>
                <input className={inputCls} type="text" placeholder="Enter your store name (e.g. ApexTech)" value={brandName} onChange={(e) => setBrandName(e.target.value)} required={role === 'seller'} />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 shadow-sm mt-2"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="text-sm text-neutral-500 text-center mt-6">
            Already have an account? <Link href="/login" className="text-neutral-900 font-semibold underline underline-offset-2 hover:no-underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
