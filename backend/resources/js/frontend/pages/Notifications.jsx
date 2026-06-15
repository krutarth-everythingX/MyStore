import React from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Bell, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export const Notifications = () => {
  const { user } = useAuth();
  const isUnverified = user && !user.email_verified_at;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 min-h-[100dvh]">
        {/* Header */}
        <nav className="hidden items-center gap-2 mb-6 text-[11px] font-bold uppercase tracking-wider text-neutral-400 sm:flex">
          <Link href="/" className="hover:text-neutral-800 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-neutral-800">Notifications</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
              <Bell size={18} className="text-neutral-700" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-neutral-900">Notifications</h1>
          </div>
          <span className="text-xs text-neutral-500 font-semibold bg-white border border-neutral-200 px-3 py-1.5 rounded-full">
            Active Alerts: {isUnverified ? 1 : 0}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {/* Email Verification Alert */}
          {isUnverified && (
            <div className="bg-white rounded-3xl border border-amber-100 shadow-xs overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-3 border-b border-amber-100 bg-amber-50">
                <span className="font-semibold text-sm text-amber-700">Action Required: Verify Your Email</span>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">Pending</span>
              </div>
              <div className="p-6 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-neutral-900 mb-1">Verification Code Sent to your Device!</p>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    We sent a 6-digit verification code to your registered email address (<strong>{user.email}</strong>).
                    To verify your email, go to your profile settings, select the Verify Email section, and enter your code.
                  </p>
                  <Link
                    href="/profile?tab=verify-email"
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 transition-all hover:-translate-y-0.5"
                  >
                    Verify Now on Profile <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Welcome / Account Status */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-xs overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-emerald-100 bg-emerald-50">
              <span className="font-semibold text-sm text-emerald-700">Account Status: Active</span>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">System</span>
            </div>
            <div className="p-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-neutral-900 mb-1">Welcome to MyStore!</p>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Your MyStore profile is ready. {isUnverified
                    ? 'Verify your email to unlock checkout access and full seller permissions.'
                    : 'Your account is fully verified. Enjoy exploring the marketplace!'}
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-50 transition-colors"
                >
                  Explore Products <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
