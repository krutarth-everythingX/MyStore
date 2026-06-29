import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { Navbar } from '../components/Navbar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DismissibleAlert } from '../components/DismissibleAlert';
import SellerProfile from './SellerProfile';
import { formatDateTime, formatMoney, formatProductMoney, formatStoredMoney } from '../utils/localization';
import { codeActionLabel, codeMinutesLeft, codeStatus, verificationActionLabel, verificationCodeStatus, verificationMinutesLeft } from '../utils/emailVerification';
import { AlertTriangle, Calendar, Camera, CheckCircle2, Clock, CreditCard, Edit3, Heart, HelpCircle, LogOut, MailCheck, MapPin, MessageSquare, Package, Phone, Settings, ShoppingBag, Star, Truck } from 'lucide-react';
import { cn } from '../utils/cn';

const BUYER_SECTIONS = [
  { id: 'orders', label: 'My Orders', icon: ShoppingBag },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'verify-email', label: 'Verify Email', icon: MailCheck },
  { id: 'verify-phone', label: 'Verify Phone', icon: Phone },
  { id: 'recently-viewed', label: 'Recently Viewed', icon: Clock },
  { id: 'account-settings', label: 'Account Settings', icon: Settings },
  { id: 'my-activity', label: 'My Activity', icon: Star },
];

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Need to change shipping address',
  'Delivery is taking too long',
  'Want to change product or quantity',
  'Other',
];

const ORDER_STATUS_CLASS = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  processing: 'border-sky-200 bg-sky-50 text-sky-700',
  shipped: 'border-sky-200 bg-sky-50 text-sky-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};

const getOrderSellerCount = (order) => new Set((order?.items || []).map((item) => item.product?.user?.id).filter(Boolean)).size;
const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve('');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const Profile = () => {
  const { props, url } = usePage();
  const { user, logout, updateProfile, verifyEmailCode, resendVerificationCode, sendPhoneVerification, verifyPhoneCode } = useAuth();
  const { wishlist } = useWishlist();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState('orders');
  const [orders, setOrders] = useState(props.buyerOrders || []);
  const [recentlyViewed, setRecentlyViewed] = useState(props.recentlyViewed || []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verificationSentAt, setVerificationSentAt] = useState(user?.verification_code_sent_at || null);
  const [verificationNow, setVerificationNow] = useState(Date.now());
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [phoneVerifyMsg, setPhoneVerifyMsg] = useState('');
  const [phoneVerifyError, setPhoneVerifyError] = useState('');
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  const [phoneVerificationSentAt, setPhoneVerificationSentAt] = useState(user?.phone_verification_code_sent_at || null);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [addrSuccess, setAddrSuccess] = useState('');
  const [addrLoading, setAddrLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarSaving, setAvatarSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setAddress(user.address || '');
    setCity(user.city || '');
    setStateName(user.state || '');
    setCountry(user.country || '');
    setPincode(user.pincode || '');
    setCountryCode(user.country_code || '');
    setVerificationSentAt(user.verification_code_sent_at || null);
    setPhoneVerificationSentAt(user.phone_verification_code_sent_at || null);
    setAvatarPreview(user.avatar || '');
  }, [user?.id]);

  useEffect(() => {
    const params = new URL(url || window.location.href, window.location.origin).searchParams;
    const tab = params.get('tab');
    if (tab && BUYER_SECTIONS.some((section) => section.id === tab)) {
      setActiveSection(tab);
    }
  }, [url]);

  useEffect(() => {
    setOrders(Array.isArray(props.buyerOrders) ? props.buyerOrders : []);
    setRecentlyViewed(Array.isArray(props.recentlyViewed) ? props.recentlyViewed : []);
  }, [props.buyerOrders, props.recentlyViewed]);

  useEffect(() => {
    if (user?.verification_code_sent_at !== verificationSentAt) {
      setVerificationSentAt(user?.verification_code_sent_at || null);
    }
  }, [user?.verification_code_sent_at, verificationSentAt]);

  useEffect(() => {
    if (user?.phone_verification_code_sent_at !== phoneVerificationSentAt) {
      setPhoneVerificationSentAt(user?.phone_verification_code_sent_at || null);
    }
  }, [user?.phone_verification_code_sent_at, phoneVerificationSentAt]);

  useEffect(() => {
    const timer = window.setInterval(() => setVerificationNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const verificationStatus = verificationCodeStatus(verificationSentAt, verificationNow);
  const verificationSendLabel = verificationActionLabel(verificationSentAt, verificationNow);
  const verificationSendDisabled = verifyLoading || verificationStatus === 'active';
  const verificationMinutesRemaining = verificationMinutesLeft(verificationSentAt, verificationNow);
  const phoneVerificationStatus = codeStatus(phoneVerificationSentAt, verificationNow);
  const phoneVerificationSendLabel = codeActionLabel(phoneVerificationSentAt, verificationNow);
  const phoneVerificationSendDisabled = phoneVerifyLoading || phoneVerificationStatus === 'active' || !countryCode || !phone;
  const phoneVerificationMinutesRemaining = codeMinutesLeft(phoneVerificationSentAt, verificationNow);
  const completionCount = [user?.email_verified_at, user?.phone_verified_at, phone, address, city, stateName, country, pincode].filter(Boolean).length;

  const setSection = (sectionId) => {
    setActiveSection(sectionId);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('tab', sectionId);
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileLoading(true);
    try {
      const data = { name, email, phone, country_code: countryCode, address, city, state: stateName, country, pincode };
      if (password) data.password = password;
      await updateProfile(data);
      setProfileSuccess('Profile updated successfully.');
      showToast('Profile settings updated successfully!', 'success');
      setPassword('');
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile');
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();
    setAddrSuccess('');
    setAddrLoading(true);
    try {
      await updateProfile({ name, email, phone, country_code: countryCode, address, city, state: stateName, country, pincode });
      setAddrSuccess('Address saved successfully.');
      showToast('Delivery address updated successfully!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to save address', 'error');
    } finally {
      setAddrLoading(false);
    }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setVerifyError('');
    setVerifyMsg('');
    setVerifyLoading(true);
    try {
      await verifyEmailCode(verificationCode);
      setVerifyMsg('Email verified successfully!');
      showToast('Email verified successfully! Welcome to MyStore.', 'success');
      setVerificationCode('');
      setVerificationSentAt(null);
    } catch (error) {
      setVerifyError(error.message || 'Verification failed');
      showToast(error.message || 'Verification failed', 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendCode = async () => {
    setVerifyError('');
    setVerifyMsg('');
    try {
      const data = await resendVerificationCode();
      setVerificationSentAt(data.user?.verification_code_sent_at || new Date().toISOString());
      setVerifyMsg(data.message || 'Verification code sent successfully!');
      showToast(data.message || 'Verification code sent successfully.', 'success');
    } catch (error) {
      setVerifyError(error.message || 'Failed to send code');
      showToast(error.message || 'Failed to send code', 'error');
    }
  };

  const handleSendPhoneCode = async () => {
    setPhoneVerifyError('');
    setPhoneVerifyMsg('');
    setPhoneVerifyLoading(true);
    try {
      const data = await sendPhoneVerification(countryCode, phone);
      setPhoneVerificationSentAt(data.user?.phone_verification_code_sent_at || new Date().toISOString());
      setPhoneVerifyMsg(data.message || 'Phone verification code sent successfully!');
      showToast(data.message || 'Phone verification code sent successfully.', 'success');
    } catch (error) {
      setPhoneVerifyError(error.message || 'Failed to send phone verification code');
      showToast(error.message || 'Failed to send phone verification code', 'error');
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  const handleVerifyPhone = async (event) => {
    event.preventDefault();
    setPhoneVerifyError('');
    setPhoneVerifyMsg('');
    setPhoneVerifyLoading(true);
    try {
      await verifyPhoneCode(phoneVerificationCode);
      setPhoneVerifyMsg('Phone number verified successfully!');
      showToast('Phone number verified successfully!', 'success');
      setPhoneVerificationCode('');
      setPhoneVerificationSentAt(null);
    } catch (error) {
      setPhoneVerifyError(error.message || 'Phone verification failed');
      showToast(error.message || 'Phone verification failed', 'error');
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.visit('/');
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAvatarSaving(true);
      const avatar = await readFileAsDataUrl(file);
      await updateProfile({ avatar });
      setAvatarPreview(avatar);
      showToast('Profile image updated successfully!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to update profile image', 'error');
    } finally {
      setAvatarSaving(false);
      event.target.value = '';
    }
  };

  if (user?.role === 'seller') {
    return <SellerProfile />;
  }

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-950">
      <Navbar opaque />

      <main>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: 'My Account' }]} />

          <section className="mt-6 space-y-6">
            <div className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717] sm:p-6 lg:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="inline-flex items-center gap-2 border-2 border-rose-700 bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-rose-700"
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-col items-start gap-2">
                      <label className="group relative inline-flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden border-2 border-neutral-950 bg-neutral-950 text-3xl font-semibold uppercase text-white sm:h-24 sm:w-24">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt={user?.name || 'Profile'} className="h-full w-full object-cover" />
                        ) : (
                          <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/70 text-white opacity-0 transition group-hover:opacity-100">
                          <Camera size={22} />
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                          disabled={avatarSaving}
                        />
                      </label>
                      <p className="text-xs text-neutral-500">{avatarSaving ? 'Uploading profile image...' : 'Click to change image'}</p>
                    </div>
                    <div className="min-w-0">
                      <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                        {user?.name || 'My Account'}
                      </h1>
                      <p className="mt-2 max-w-7xl break-all text-sm text-neutral-600 sm:text-base">{user?.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Buyer ID</span>
                        <span className="break-all font-semibold text-neutral-950 sm:text-base">{user?.customer_id || 'Pending'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[24rem]">
                    <ProfileMetric label="Orders" value={orders.length} />
                    <ProfileMetric label="Wishlist" value={wishlist.length} />
                    <ProfileMetric label="Profile Ready" value={`${completionCount}/8`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 md:overflow-visible overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {BUYER_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-3 border-2 px-4 py-3 text-sm font-medium shadow-[6px_6px_0_#171717] transition md:shrink',
                    activeSection === id
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-neutral-950 bg-white text-neutral-950 hover:-translate-y-0.5',
                  )}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  {id === 'orders' && orders.length > 0 ? <NavBadge active={activeSection === id}>{orders.length}</NavBadge> : null}
                  {id === 'wishlist' && wishlist.length > 0 ? <NavBadge active={activeSection === id}>{wishlist.length}</NavBadge> : null}
                </button>
              ))}
            </div>

            <section className="min-w-0">
              {activeSection === 'orders' && <OrdersPanel orders={orders} props={props} />}

              {activeSection === 'wishlist' && (
                <ContentPanel title="Wishlist" subtitle="Products you saved for later.">
                  <ProductGrid items={wishlist} props={props} empty={<EmptyState icon={Heart} text="Your wishlist is empty." href="/" action="Browse Products" />} />
                </ContentPanel>
              )}

              {activeSection === 'verify-email' && (
                <ContentPanel title="Verify Email" subtitle="Secure your account and unlock full checkout confidence.">
                  <div className="space-y-5">
                    {user?.email_verified_at ? (
                      <StatusCard icon={CheckCircle2} tone="success" title="Email Verified" copy={user.email} />
                    ) : (
                      <>
                        <StatusCard
                          icon={AlertTriangle}
                          tone="warn"
                          title="Email not verified"
                          copy={verificationStatus === 'unsent' ? `Send a 6-digit verification code to ${user?.email}.` : `Enter the 6-digit code sent to ${user?.email}.`}
                          extra={verificationStatus === 'active' ? `Code expires in ${verificationMinutesRemaining} minute${verificationMinutesRemaining === 1 ? '' : 's'}.` : ''}
                        />

                        {verifyError ? <DismissibleAlert onClose={() => setVerifyError('')} role="alert">{verifyError}</DismissibleAlert> : null}

                        <form onSubmit={handleVerifyEmail} className="space-y-4">
                          <Input label="6-Digit Verification Code" type="text" placeholder="Enter code" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} required />
                          <div className="flex flex-wrap gap-3">
                            <Button type="submit" variant="primary" disabled={verifyLoading}>{verifyLoading ? 'Verifying...' : 'Verify Code'}</Button>
                            <Button type="button" variant="outline" onClick={handleResendCode} disabled={verificationSendDisabled}>{verificationSendLabel}</Button>
                          </div>
                        </form>
                      </>
                    )}

                    {verifyMsg ? <DismissibleAlert onClose={() => setVerifyMsg('')}>{verifyMsg}</DismissibleAlert> : null}
                  </div>
                </ContentPanel>
              )}

              {activeSection === 'verify-phone' && (
                <ContentPanel title="Verify Phone" subtitle="Use a verified phone number for updates and checkout recovery.">
                  <div className="space-y-5">
                    {user?.phone_verified_at ? (
                      <StatusCard icon={CheckCircle2} tone="success" title="Phone Verified" copy={`+${user.country_code} ${user.phone}`} />
                    ) : (
                      <>
                        <StatusCard
                          icon={AlertTriangle}
                          tone="warn"
                          title="Phone not verified"
                          copy="Enter your country calling code and phone number, then send an SMS code."
                          extra={phoneVerificationStatus === 'active' ? `SMS code expires in ${phoneVerificationMinutesRemaining} minute${phoneVerificationMinutesRemaining === 1 ? '' : 's'}.` : ''}
                        />

                        {phoneVerifyError ? <DismissibleAlert onClose={() => setPhoneVerifyError('')} role="alert">{phoneVerifyError}</DismissibleAlert> : null}

                        <form onSubmit={handleVerifyPhone} className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Country Code" type="text" placeholder="91" value={countryCode} onChange={(event) => setCountryCode(event.target.value.replace(/[^\d]/g, ''))} required />
                            <Input label="Phone Number" type="tel" placeholder="9876543210" value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^\d]/g, ''))} required />
                          </div>
                          <Input label="6-Digit SMS Code" type="text" placeholder="Enter SMS code" maxLength={6} value={phoneVerificationCode} onChange={(event) => setPhoneVerificationCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))} required />
                          <div className="flex flex-wrap gap-3">
                            <Button type="submit" variant="primary" disabled={phoneVerifyLoading}>{phoneVerifyLoading ? 'Verifying...' : 'Verify Phone'}</Button>
                            <Button type="button" variant="outline" onClick={handleSendPhoneCode} disabled={phoneVerificationSendDisabled}>{phoneVerificationSendLabel}</Button>
                          </div>
                        </form>
                      </>
                    )}

                    {phoneVerifyMsg ? <DismissibleAlert onClose={() => setPhoneVerifyMsg('')}>{phoneVerifyMsg}</DismissibleAlert> : null}
                  </div>
                </ContentPanel>
              )}

              {activeSection === 'recently-viewed' && (
                <ContentPanel title="Recently Viewed" subtitle="Jump back into products you explored recently.">
                  <ProductGrid items={recentlyViewed} props={props} showViewedAt empty={<EmptyState icon={Clock} text="No recently viewed products." href="/categories" action="Browse Categories" />} />
                </ContentPanel>
              )}

              {activeSection === 'account-settings' && (
                <ContentPanel title="Account Settings" subtitle="Manage profile details, password, and saved address information.">
                  <AccountSettings
                    name={name}
                    setName={setName}
                    email={email}
                    setEmail={setEmail}
                    phone={phone}
                    setPhone={setPhone}
                    countryCode={countryCode}
                    setCountryCode={setCountryCode}
                    password={password}
                    setPassword={setPassword}
                    profileSuccess={profileSuccess}
                    setProfileSuccess={setProfileSuccess}
                    profileError={profileError}
                    setProfileError={setProfileError}
                    profileLoading={profileLoading}
                    handleSaveProfile={handleSaveProfile}
                    address={address}
                    setAddress={setAddress}
                    city={city}
                    setCity={setCity}
                    stateName={stateName}
                    setStateName={setStateName}
                    country={country}
                    setCountry={setCountry}
                    pincode={pincode}
                    setPincode={setPincode}
                    addrSuccess={addrSuccess}
                    setAddrSuccess={setAddrSuccess}
                    addrLoading={addrLoading}
                    handleSaveAddress={handleSaveAddress}
                  />
                </ContentPanel>
              )}

              {activeSection === 'my-activity' && (
                <ContentPanel title="My Activity" subtitle="Track product reviews and community activity from one place.">
                  <ActivitySection />
                </ContentPanel>
              )}
            </section>
          </section>
        </div>

        {showLogoutConfirm ? (
          <div className="fixed inset-0 z-[70] bg-neutral-950/35 px-4 py-6" onClick={() => setShowLogoutConfirm(false)}>
            <div className="mx-auto max-w-md border-2 border-neutral-950 bg-neutral-50 p-6 shadow-[10px_10px_0_#171717]" onClick={(event) => event.stopPropagation()}>
              <div className="inline-flex h-14 w-14 items-center justify-center border-2 border-neutral-950 bg-neutral-950 text-white">
                <LogOut size={24} />
              </div>
              <h4 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950">Log out of MyStore?</h4>
              <p className="mt-2 text-sm leading-7 text-neutral-600">You will need to sign in again to access your account.</p>
              <div className="mt-6 flex gap-3">
                <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleLogout}>Yes, Log Out</Button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

const ProfileMetric = ({ label, value }) => (
  <div className="border-2 border-neutral-950 bg-neutral-50 p-4">
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</span>
    <strong className="mt-2 block text-2xl font-semibold tracking-tight text-neutral-950">{value}</strong>
  </div>
);

const NavBadge = ({ active, children }) => (
  <span className={cn('inline-flex min-w-6 items-center justify-center px-2 py-1 text-[10px] font-semibold', active ? 'border border-white/20 bg-white/10 text-white' : 'border border-neutral-950 bg-neutral-950 text-white')}>
    {children}
  </span>
);

const ContentPanel = ({ title, subtitle, action = null, children }) => (
  <div className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717] sm:p-6">
    <div className="border-b-2 border-neutral-950 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-neutral-600">{subtitle}</p>
        </div>
        {action ? <div className="shrink-0 sm:pt-1">{action}</div> : null}
      </div>
    </div>
    <div className="mt-5">{children}</div>
  </div>
);

const EmptyState = ({ icon: Icon, text, href, action }) => (
  <div className="border-2 border-neutral-950 bg-neutral-100 p-8 text-center shadow-[6px_6px_0_#171717]">
    <div className="mx-auto inline-flex h-16 w-16 items-center justify-center border-2 border-neutral-950 bg-white">
      <Icon size={38} />
    </div>
    <p className="mt-4 text-sm text-neutral-700">{text}</p>
    <Link href={href} className="mt-5 inline-flex border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white">
      {action}
    </Link>
  </div>
);

const StatusCard = ({ icon: Icon, tone, title, copy, extra = '' }) => (
  <div className={cn('border-2 p-5 shadow-[6px_6px_0_#171717]', tone === 'success' ? 'border-emerald-950 bg-[#ecfdf5]' : tone === 'warn' ? 'border-neutral-950 bg-[#fff7ed]' : 'border-neutral-950 bg-white')}>
    <div className="flex items-start gap-4">
      <div className="inline-flex h-12 w-12 items-center justify-center border-2 border-neutral-950 bg-white">
        <Icon size={24} />
      </div>
      <div>
        <p className="text-lg font-semibold text-neutral-950">{title}</p>
        <p className="mt-2 text-sm leading-7 text-neutral-700">{copy}</p>
        {extra ? <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">{extra}</p> : null}
      </div>
    </div>
  </div>
);

const ProductGrid = ({ items, props, empty, showViewedAt = false }) => {
  if (!items.length) return empty;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const product = item.product;
        if (!product) return null;
        const price = product.sale_price ?? product.regular_price;

        return (
          <Link href={`/products/${product.id}`} key={item.id} className="border-2 border-neutral-950 bg-white p-4 shadow-[6px_6px_0_#171717] transition hover:-translate-y-1">
            <div className="flex aspect-square items-center justify-center border-2 border-neutral-950 bg-neutral-100 text-3xl font-semibold uppercase text-neutral-300">
              {product.name?.charAt(0)}
            </div>
            <div className="mt-4 space-y-2">
              <p className="line-clamp-2 text-base font-semibold leading-5 text-neutral-950">{product.name}</p>
              <span className="block text-sm font-medium text-neutral-950">{formatProductMoney(product, parseFloat(price), props)}</span>
              {showViewedAt ? (
                <span className="block text-xs text-neutral-500">
                  {formatDateTime(item.viewed_at, { includeTime: false }, props)}
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

const OrdersPanel = ({ orders, props }) => {
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelOtherReason, setCancelOtherReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason(CANCEL_REASONS[0]);
    setCancelOtherReason('');
    setCancelLoading(false);
  };

  const submitCancelOrder = () => {
    if (!cancelTarget) return;
    const reasonNote = cancelReason === 'Other' ? cancelOtherReason.trim() : '';
    if (cancelReason === 'Other' && !reasonNote) return;

    setCancelLoading(true);
    router.post(`/orders/${cancelTarget.id}/cancel`, {
      reason: cancelReason,
      reason_note: reasonNote || null,
    }, {
      preserveScroll: true,
      preserveState: false,
      onFinish: () => setCancelLoading(false),
      onSuccess: () => closeCancelModal(),
    });
  };

  return (
    <ContentPanel
      title="My Orders"
      subtitle="Review your purchases, track shipment progress, and open a dedicated order details page."
      action={(
        <Button
          type="button"
          variant="primary"
          onClick={() => router.visit('/profile/orders/my-orders')}
        >
          My Orders
        </Button>
      )}
    >
      {orders.length === 0 ? (
        <EmptyState icon={Package} text="No orders placed yet." href="/categories" action="Browse Categories" />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const sellerCount = getOrderSellerCount(order);
            const statusKey = String(order.status || '').toLowerCase();
            const canCancel = statusKey === 'pending' || statusKey === 'processing';

            return (
              <div key={order.id} className="border-2 border-neutral-950 bg-white p-5 shadow-[6px_6px_0_#171717]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold tracking-tight text-neutral-950">Order #{order.id}</h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-2"><Calendar size={12} />{formatDateTime(order.created_at, { includeTime: false }, props)}</span>
                      <span className="inline-flex items-center gap-2"><CreditCard size={12} />{order.payment_method || 'Payment unavailable'}</span>
                      <span className="inline-flex items-center gap-2"><Truck size={12} />{order.shipping_carrier || order.fulfillment_channel || 'Awaiting shipment'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <div className="text-xl font-semibold text-neutral-950">
                      {formatStoredMoney(parseFloat(order.total_amount), order.currency, props)}
                    </div>
                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      {canCancel ? (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(order)}
                          className="inline-flex items-center gap-2 border-2 border-rose-700 bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700"
                        >
                          Cancel Order
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoCard icon={Package} title="Items" lines={[`${order.items?.length || 0} item${order.items?.length === 1 ? '' : 's'}`, `${sellerCount} seller${sellerCount === 1 ? '' : 's'} involved`]} />
                  <InfoCard icon={Truck} title="Shipping" iconClassName="scale-[0.84]" lines={[order.tracking_number || 'Tracking number pending', order.shipping_address || 'Address unavailable']} />
                  <InfoCard icon={CreditCard} title="Payment" lines={[order.payment_status || 'Status not available', `Settles from ${order.currency || 'N/A'}`]} />
                  <InfoCard icon={MapPin} title="Destination" lines={[order.city || 'City unavailable', [order.state, order.country].filter(Boolean).join(', ') || 'Location unavailable']} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cancelTarget ? (
        <CancelOrderModal
          reason={cancelReason}
          otherReason={cancelOtherReason}
          loading={cancelLoading}
          onReasonChange={setCancelReason}
          onOtherReasonChange={setCancelOtherReason}
          onClose={closeCancelModal}
          onSubmit={submitCancelOrder}
        />
      ) : null}
    </ContentPanel>
  );
};

const StatusBadge = ({ status }) => (
  <span className={cn('inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', ORDER_STATUS_CLASS[status] || 'border-neutral-950 bg-white text-neutral-700')}>
    {status}
  </span>
);

const InfoCard = ({ icon: Icon, title, lines, iconClassName = '' }) => (
  <div className="border-2 border-neutral-950 bg-neutral-50 p-4">
    <div className="flex items-start gap-3">
      <div className="inline-flex h-12 w-12 items-center justify-center border-2 border-neutral-950 bg-white p-2">
        <Icon size={18} className={iconClassName} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{title}</div>
        {lines.map((line) => <div key={line} className="mt-2 break-words text-sm text-neutral-700">{line}</div>)}
      </div>
    </div>
  </div>
);

const CancelOrderModal = ({ reason, otherReason, loading, onReasonChange, onOtherReasonChange, onClose, onSubmit }) => {
  const needsOtherReason = reason === 'Other';
  const disableSubmit = loading || (needsOtherReason && !otherReason.trim());

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-950/40 px-4 py-6" onClick={onClose}>
      <div className="w-full max-w-lg border-2 border-neutral-950 bg-neutral-50 p-6 shadow-[10px_10px_0_#171717]" onClick={(event) => event.stopPropagation()}>
        <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Cancel this order?</h3>
        <p className="mt-2 text-sm leading-7 text-neutral-600">Select a reason so the seller understands why this order was cancelled.</p>

        <div className="mt-5 space-y-3">
          {CANCEL_REASONS.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-3 border-2 border-neutral-950 bg-white px-4 py-3">
              <input
                type="radio"
                name="cancel-reason"
                value={option}
                checked={reason === option}
                onChange={(event) => onReasonChange(event.target.value)}
                className="h-4 w-4 accent-neutral-950"
              />
              <span className="text-sm font-medium text-neutral-950">{option}</span>
            </label>
          ))}
        </div>

        {needsOtherReason ? (
          <div className="mt-4">
            <Input
              label="Your Reason"
              as="textarea"
              rows={4}
              placeholder="Tell the seller why you are cancelling this order"
              value={otherReason}
              onChange={(event) => onOtherReasonChange(event.target.value)}
              required
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Keep Order</Button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disableSubmit}
            className="inline-flex min-h-9 items-center justify-center gap-2 border border-rose-700 bg-rose-600 px-3.5 text-[13px] font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountSettings = ({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  countryCode,
  setCountryCode,
  password,
  setPassword,
  profileSuccess,
  setProfileSuccess,
  profileError,
  setProfileError,
  profileLoading,
  handleSaveProfile,
  address,
  setAddress,
  city,
  setCity,
  stateName,
  setStateName,
  country,
  setCountry,
  pincode,
  setPincode,
  addrSuccess,
  setAddrSuccess,
  addrLoading,
  handleSaveAddress,
}) => {
  const [sub, setSub] = useState('edit-profile');
  const isProfileIncomplete = !phone || !address || !city || !stateName || !country || !pincode;

  return (
    <div className="space-y-5">
      {isProfileIncomplete ? (
        <DismissibleAlert>
          <span>
            <AlertTriangle size={18} className="mr-2 inline-block" />
            <strong>Complete your phone and address details for a faster checkout experience.</strong>
          </span>
        </DismissibleAlert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant={sub === 'edit-profile' ? 'primary' : 'outline'} onClick={() => setSub('edit-profile')}>
          <Edit3 size={13} />
          Edit Profile
        </Button>
        <Button type="button" variant={sub === 'saved-addresses' ? 'primary' : 'outline'} onClick={() => setSub('saved-addresses')}>
          <MapPin size={13} />
          Saved Address
        </Button>
      </div>

      {sub === 'edit-profile' ? (
        <div className="space-y-4">
          {profileSuccess ? <DismissibleAlert onClose={() => setProfileSuccess('')}>{profileSuccess}</DismissibleAlert> : null}
          {profileError ? <DismissibleAlert onClose={() => setProfileError('')} role="alert">{profileError}</DismissibleAlert> : null}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full Name" type="text" value={name} onChange={(event) => setName(event.target.value)} required />
              <Input label="Email Address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Phone Number" type="tel" placeholder="9876543210" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <Input label="Country Code" type="text" placeholder="91" value={countryCode} onChange={(event) => setCountryCode(event.target.value.replace(/[^\d]/g, ''))} />
            </div>
            <Input label="New Password" type="password" placeholder="Leave blank to keep current password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Button type="submit" variant="primary" disabled={profileLoading}>{profileLoading ? 'Saving...' : 'Save Changes'}</Button>
          </form>
        </div>
      ) : null}

      {sub === 'saved-addresses' ? (
        <div className="space-y-4">
          {addrSuccess ? <DismissibleAlert onClose={() => setAddrSuccess('')}>{addrSuccess}</DismissibleAlert> : null}
          <form onSubmit={handleSaveAddress} className="space-y-4">
            <Input label="Street Address" as="textarea" rows={3} placeholder="Enter street name, building number, and area" value={address} onChange={(event) => setAddress(event.target.value)} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="City" type="text" value={city} onChange={(event) => setCity(event.target.value)} required />
              <Input label="State / Region" type="text" value={stateName} onChange={(event) => setStateName(event.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Country" type="text" value={country} onChange={(event) => setCountry(event.target.value)} required />
              <Input label="Pincode" type="text" value={pincode} onChange={(event) => setPincode(event.target.value)} required />
            </div>
            <Button type="submit" variant="primary" disabled={addrLoading}>{addrLoading ? 'Saving...' : 'Save Address'}</Button>
          </form>
        </div>
      ) : null}
    </div>
  );
};

const ActivitySection = () => {
  const [sub, setSub] = useState('reviews');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant={sub === 'reviews' ? 'primary' : 'outline'} onClick={() => setSub('reviews')}>
          <MessageSquare size={13} />
          My Reviews
        </Button>
        <Button type="button" variant={sub === 'qna' ? 'primary' : 'outline'} onClick={() => setSub('qna')}>
          <HelpCircle size={13} />
          Q&amp;A
        </Button>
      </div>
      {sub === 'reviews' ? <EmptyState icon={Star} text="You haven't reviewed any products yet." href="/categories" action="Browse Products" /> : null}
      {sub === 'qna' ? <EmptyState icon={HelpCircle} text="You haven't asked any questions yet." href="/categories" action="Browse Products" /> : null}
    </div>
  );
};

export default Profile;
