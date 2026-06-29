import React from 'react';
import { router } from '@inertiajs/react';
import { ArrowRight, ShieldCheck, Store, UserRoundCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SellerSetup = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-between gap-12 border border-white/10 bg-neutral-950 p-8 sm:p-10 lg:min-h-[42rem]">
            <div className="inline-flex h-11 w-11 items-center justify-center border border-white/10 text-sm font-semibold tracking-[0.3em] text-white">
              MS
            </div>

            <div className="max-w-xl">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Seller Onboarding</div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Start selling after business verification.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-neutral-400 sm:text-base">
                We collect business, payout, tax, and shipping details in one onboarding flow. Once approved, your full seller workspace opens automatically.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: UserRoundCheck, title: 'Identity', copy: 'Confirm the account owner and authorized representative.' },
                { icon: Store, title: 'Business', copy: 'Share legal registration, address, and fulfillment details.' },
                { icon: ShieldCheck, title: 'Review', copy: 'Admin reviews and approves before store access opens.' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="border border-white/10 bg-white/5 p-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 text-white">
                      <Icon size={18} />
                    </span>
                    <strong className="mt-4 block text-sm font-semibold text-white">{item.title}</strong>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="flex items-center justify-center bg-neutral-50 p-4 sm:p-6">
            <div className="w-full max-w-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="inline-flex items-center gap-3 text-sm font-semibold text-neutral-900">
                <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-950 text-xs font-bold tracking-[0.3em] text-white">
                  MS
                </span>
                MyStore Seller
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-950">Welcome{user?.name ? `, ${user.name}` : ''}</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                We no longer ask for business verification details during signup. Continue to the onboarding page to submit your seller information.
              </p>

              <div className="mt-6 space-y-3 border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 items-center justify-center border border-neutral-200 bg-white text-xs font-semibold text-neutral-950">1</span>
                  <div>
                    <strong className="block text-sm font-semibold text-neutral-950">Submit business details</strong>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">Country-based tax, payout, legal, and address details.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 items-center justify-center border border-neutral-200 bg-white text-xs font-semibold text-neutral-950">2</span>
                  <div>
                    <strong className="block text-sm font-semibold text-neutral-950">Wait for approval</strong>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">Regular verification follows the normal review queue. Urgent cases can contact admin from onboarding.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 items-center justify-center border border-neutral-200 bg-white text-xs font-semibold text-neutral-950">3</span>
                  <div>
                    <strong className="block text-sm font-semibold text-neutral-950">Enter seller workspace</strong>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">Approved sellers get product, order, and business tools inside the full dashboard.</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.visit('/seller/verification', { replace: true, preserveScroll: true })}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Start Seller Onboarding
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SellerSetup;
