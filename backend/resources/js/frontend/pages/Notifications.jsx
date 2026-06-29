import React from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Bell, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

const NotificationCard = ({ eyebrow, status, icon, title, description, actionHref, actionLabel, tone = 'neutral' }) => {
  const toneClasses = {
    neutral: 'bg-white text-neutral-950',
    warning: 'bg-[#fff7ed] text-neutral-950',
    success: 'bg-[#ecfdf5] text-neutral-950',
  };

  return (
    <article className={`border-2 border-neutral-950 p-5 shadow-[8px_8px_0_#171717] sm:p-6 ${toneClasses[tone] || toneClasses.neutral}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{eyebrow}</span>
            <span className="border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              {status}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">{title}</h2>
        </div>
        <div className="inline-flex h-12 w-12 items-center justify-center border-2 border-neutral-950 bg-white">
          {icon}
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-700 sm:text-base">{description}</p>

      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-5 inline-flex items-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white">
          {actionLabel}
          <ArrowRight size={14} />
        </Link>
      )}
    </article>
  );
};

export const Notifications = () => {
  const { user } = useAuth();
  const isUnverified = user && !user.email_verified_at;

  const notifications = [
    ...(isUnverified
      ? [{
        id: 'verify-email',
        eyebrow: 'Action Required',
        status: 'Pending',
        icon: <AlertTriangle size={20} />,
        title: 'Verify your email address',
        description: `A verification code was sent to ${user.email}. Open your profile and complete email verification to unlock checkout access and receive uninterrupted updates.`,
        actionHref: '/profile?tab=verify-email',
        actionLabel: 'Verify Now',
        tone: 'warning',
      }]
      : []),
    {
      id: 'account-status',
      eyebrow: 'System',
      status: isUnverified ? 'Limited' : 'Active',
      icon: isUnverified ? <Mail size={20} /> : <CheckCircle2 size={20} />,
      title: isUnverified ? 'Your account is almost ready' : 'Your account is fully active',
      description: isUnverified
        ? 'Finish email verification to enable the full buyer flow, including secure checkout and order progress updates.'
        : 'Your account is verified and ready. You can browse products, place orders, and manage your shopping activity without restrictions.',
      actionHref: isUnverified ? '/profile?tab=verify-email' : '/',
      actionLabel: isUnverified ? 'Open Profile' : 'Explore Store',
      tone: isUnverified ? 'neutral' : 'success',
    },
    {
      id: 'security-note',
      eyebrow: 'Security',
      status: 'Info',
      icon: <ShieldCheck size={20} />,
      title: 'Keep your profile up to date',
      description: 'Review your phone number, delivery address, and account details regularly so checkout, shipping updates, and notifications continue to work smoothly.',
      actionHref: '/profile',
      actionLabel: 'Manage Profile',
      tone: 'neutral',
    },
  ];

  const pendingCount = notifications.filter((item) => item.status === 'Pending').length;

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-950">
      <Navbar opaque />

      <main>
        <section className="border-b-2 border-neutral-950">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="border-2 border-neutral-950 bg-white p-6 shadow-[10px_10px_0_#171717] sm:p-8">
              <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                <Link href="/" className="transition hover:text-neutral-950">Home</Link>
                <span>/</span>
                <span className="text-neutral-950">Notifications</span>
              </nav>

              <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Notification Center</span>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Notifications</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">
                    View account alerts, verification tasks, and system updates in one place.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-3 border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white">
                    <Bell size={16} />
                    <span>{notifications.length} total</span>
                  </div>
                  <div className="inline-flex items-center gap-3 border-2 border-neutral-950 bg-white px-4 py-3 text-sm font-medium text-neutral-950">
                    <AlertTriangle size={16} />
                    <span>{pendingCount} pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="h-fit border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717] sm:p-6">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Panel</span>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Overview</h2>

              <div className="mt-5 space-y-3">
                <div className="border-2 border-neutral-950 bg-neutral-950 px-4 py-4 text-white">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Active alerts</span>
                  <span className="mt-2 block text-3xl font-semibold tracking-tight">{pendingCount}</span>
                </div>
                <div className="border-2 border-neutral-950 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Account email</span>
                  <span className="mt-2 block text-sm font-medium text-neutral-950">{user?.email || 'Signed out'}</span>
                </div>
                <div className="border-2 border-neutral-950 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Status</span>
                  <span className="mt-2 block text-sm font-medium text-neutral-950">{isUnverified ? 'Verification pending' : 'All clear'}</span>
                </div>
              </div>
            </aside>

            <div className="space-y-5">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  eyebrow={notification.eyebrow}
                  status={notification.status}
                  icon={notification.icon}
                  title={notification.title}
                  description={notification.description}
                  actionHref={notification.actionHref}
                  actionLabel={notification.actionLabel}
                  tone={notification.tone}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
