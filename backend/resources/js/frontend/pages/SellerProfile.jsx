import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { AlertTriangle, BadgeAlert, BadgeCheck, Bell, Building2, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Eye, FileCheck2, ImagePlus, Lock, LogOut, Package, RotateCcw, Search, ShieldCheck, Store, Trash2, Truck, Upload, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { DismissibleAlert } from '../components/DismissibleAlert';
import { SellerModalBackdrop, SellerModalCard, SellerPageHeader, SellerPageShell, SellerSelect } from '../components/seller-workspace';
import { cn } from '../utils/cn';
import { codeActionLabel, codeMinutesLeft, codeStatus, verificationActionLabel, verificationCodeStatus, verificationMinutesLeft } from '../utils/emailVerification';
const defaultSellerSettings = {
  profilePhoto: '',
  twoFactorEnabled: true,
  secondaryPhone: '',
  secondaryCountryCode: '',
  storeLogo: '',
  storeBanner: '',
  storeDescription: '',
  businessType: 'Sole Proprietorship',
  panNumber: '',
  registrationNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pickupCountry: '',
  pincode: '',
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
  cancelledCheque: '',
  gstRegistered: true,
  gstCertificate: '',
  panCard: '',
  businessLicense: '',
  addressProof: '',
  freeShippingAbove: '1000',
  packageWeight: '',
  packageLength: '',
  packageWidth: '',
  packageHeight: '',
  weightUnit: 'Kg',
  returnWindow: '15 Days',
  acceptReturns: true,
  orderEmail: true,
  orderSms: true,
  orderWhatsapp: true,
  promotionalEmails: false,
  storeStatus: 'Active'
};
const businessSteps = [{
  key: 'identity',
  label: 'Business Identity',
  icon: Store
}, {
  key: 'address',
  label: 'Pickup Address',
  icon: Building2
}, {
  key: 'payout',
  label: 'Payout',
  icon: CreditCard
}, {
  key: 'tax',
  label: 'Tax',
  icon: ShieldCheck
}, {
  key: 'documents',
  label: 'Documents',
  icon: FileCheck2
}, {
  key: 'shipping',
  label: 'Shipping',
  icon: Truck
}, {
  key: 'returns',
  label: 'Returns',
  icon: RotateCcw
}, {
  key: 'notifications',
  label: 'Notifications',
  icon: Bell
}, {
  key: 'status',
  label: 'Store Status',
  icon: Package
}];
const settingsCardClassName = 'rounded-lg border border-slate-200 shadow-none hover:translate-y-0 hover:border-slate-200 hover:shadow-none';
const alertToneClassName = {
  success: 'border border-emerald-200 bg-white text-emerald-800',
  error: 'border border-rose-200 bg-white text-rose-800'
};
const readFileAsDataUrl = file => new Promise((resolve, reject) => {
  if (!file) {
    resolve('');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
const hasText = value => String(value ?? '').trim().length > 0;
const LabeledField = ({
  label,
  children,
  className = ''
}) => <div className={cn('block space-y-2', className)}>
    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
    {children}
  </div>;
const settingsInputClassName = 'h-12 rounded-none border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-950 shadow-sm transition focus:border-neutral-950 focus:bg-white focus:ring-0 focus:shadow-none';
const settingsTextareaClassName = 'min-h-32 rounded-none border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 shadow-sm transition focus:border-neutral-950 focus:bg-white focus:ring-0 focus:shadow-none';
const settingsLabelClassName = 'text-[10px] tracking-[0.18em] text-neutral-500';
const SettingsInput = ({
  as = 'input',
  inputClassName = '',
  labelClassName = '',
  ...props
}) => <Input as={as} inputClassName={cn(as === 'textarea' ? settingsTextareaClassName : settingsInputClassName, inputClassName)} labelClassName={cn(settingsLabelClassName, labelClassName)} {...props} />;
const isPreviewableImage = value => /^(data:image|https?:\/\/|\/|blob:)/i.test(String(value || ''));
const SectionStack = ({
  children,
  className = ''
}) => <div className={cn('space-y-5', className)}>{children}</div>;
const FormGrid = ({
  children,
  className = ''
}) => <div className={cn('grid gap-4 md:grid-cols-2', className)}>{children}</div>;
const UploadBox = ({
  label,
  value,
  onChange,
  wide = false,
  compact = false,
  rectangle = false,
  overlayLabel = 'Change Image'
}) => <label className={cn('group flex cursor-pointer flex-col items-center justify-center gap-4 border border-dashed border-neutral-950 bg-neutral-50 px-5 py-6 text-center transition hover:bg-white', compact ? 'min-h-[190px] w-full max-w-[220px]' : rectangle ? 'min-h-[190px] w-full' : 'min-h-[220px]', wide && 'md:col-span-2')}>
    <span className={cn('relative overflow-hidden border border-neutral-200 bg-white text-neutral-950', compact ? 'h-28 w-28' : rectangle ? 'h-28 w-full max-w-[420px]' : 'h-16 w-16')}>
      {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center">
        <ImagePlus size={28} />
      </span>}
      {compact || rectangle ? <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/75 px-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-white opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
        {overlayLabel}
      </span> : null}
    </span>
    <strong className="text-sm font-semibold text-neutral-950">{label}</strong>
    <span className={cn('inline-flex min-h-10 items-center justify-center border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-950', (compact || rectangle) && 'md:hidden')}>
      <Upload size={13} />
      Upload
    </span>
    {compact || rectangle ? <span className="hidden text-xs font-medium uppercase tracking-[0.14em] text-neutral-500 md:block">
      Tap to change
    </span> : null}
    <input className="hidden" type="file" accept="image/*,.pdf" onChange={async event => onChange(await readFileAsDataUrl(event.target.files?.[0]))} />
  </label>;
const ChoicePill = ({
  active,
  children,
  className = '',
  ...props
}) => <button type="button" className={cn('inline-flex min-h-10 items-center justify-center border px-4 text-sm font-medium transition', active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100', className)} {...props}>
    {children}
  </button>;
const ToggleChoice = ({
  label,
  checked,
  onChange
}) => <label className="flex items-center justify-between gap-4 border border-neutral-200 bg-neutral-50 px-4 py-3">
    <span className="text-sm font-medium text-neutral-950">{label}</span>
    <input className="h-4 w-4 accent-neutral-950" type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
  </label>;
const DocumentTile = ({
  label,
  value,
  onChange,
  onRemove,
  onPreview
}) => <div className="flex min-h-[180px] flex-col justify-between border border-neutral-200 bg-neutral-50 p-4">
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <strong className="text-sm font-semibold text-neutral-950">{label}</strong>
        <span className={cn('inline-flex h-8 min-w-8 items-center justify-center border px-2 text-xs font-semibold uppercase tracking-[0.14em]', value ? 'border-emerald-700 bg-white text-emerald-700' : 'border-neutral-950 bg-white text-neutral-950')}>
          {value ? <Check size={14} strokeWidth={3} /> : 'No'}
        </span>
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
        {value ? 'Uploaded' : 'Not Uploaded'}
      </p>
    </div>
    <div className="mt-auto flex min-h-10 items-center gap-1 whitespace-nowrap pt-4">
      {value ? <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-white text-sm font-medium text-neutral-950 transition hover:bg-neutral-100" onClick={onPreview}>
        <Eye size={14} />
      </button> : null}
      <label className="inline-flex h-10 min-w-[76px] shrink-0 cursor-pointer items-center justify-center border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100">
        {value ? 'Change' : 'Upload'}
        <input className="hidden" type="file" accept="image/*,.pdf" onChange={async event => onChange(await readFileAsDataUrl(event.target.files?.[0]))} />
      </label>
      {value ? <button type="button" className="inline-flex h-10 min-w-[78px] shrink-0 items-center justify-center border border-rose-500 bg-white px-3 text-sm font-medium text-rose-700 transition hover:bg-neutral-100" onClick={onRemove}>
        Remove
      </button> : null}
    </div>
  </div>;
const StatusLine = ({
  label,
  value,
  status
}) => <div className="border border-neutral-200 bg-neutral-50 px-4 py-3">
    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
    <strong className="mt-2 block text-sm font-semibold text-neutral-950">{value}</strong>
    {status ? <em className="mt-2 inline-flex items-center gap-2 text-xs font-medium not-italic text-emerald-700">
      <BadgeCheck size={14} />
      {status}
    </em> : null}
  </div>;
const VerificationNotice = ({
  title,
  copy,
  extra
}) => <div className="flex items-start gap-4 border border-amber-200 bg-white px-4 py-4 text-amber-900">
    <AlertTriangle size={24} className="mt-1 shrink-0" />
    <div className="space-y-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm">{copy}</p>
      {extra ? <p className="text-xs font-medium uppercase tracking-[0.14em]">{extra}</p> : null}
    </div>
  </div>;
const renderAlert = (tone, value, onClose) => value ? <DismissibleAlert onClose={onClose} role={tone === 'error' ? 'alert' : 'status'}>
  {value}
</DismissibleAlert> : null;
export const SellerProfile = () => {
  const {
    url,
    props
  } = usePage();
  const localizationCountries = props.localization?.countries || {};
  const {
    user,
    updateProfile,
    verifyEmailCode,
    resendVerificationCode,
    sendPhoneVerification,
    verifyPhoneCode,
    sendPasswordResetLink,
    logout,
    requestAccountDeletion
  } = useAuth();
  const storageKey = `seller-settings-${user?.id || 'guest'}`;
  const pageUrl = new URL(url || window.location.href, window.location.origin);
  const panelParam = pageUrl.searchParams.get('panel');
  const [activeMobilePanel, setActiveMobilePanel] = useState(panelParam === 'business' ? 'business' : 'profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [brandName, setBrandName] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [fulfillmentChannels, setFulfillmentChannels] = useState('');
  const [defaultFulfillmentChannel, setDefaultFulfillmentChannel] = useState('');
  const [shippingAcceptanceTime, setShippingAcceptanceTime] = useState('');
  const [handlingTimeBusinessDays, setHandlingTimeBusinessDays] = useState(1);
  const [settings, setSettings] = useState(defaultSellerSettings);
  const [activeBusinessStep, setActiveBusinessStep] = useState('identity');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialProfileSnapshot, setInitialProfileSnapshot] = useState('');
  const [initialBusinessSnapshot, setInitialBusinessSnapshot] = useState('');
  const [unsavedModal, setUnsavedModal] = useState({
    open: false,
    section: 'profile'
  });
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
  const [passwordLinkLoading, setPasswordLinkLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState({
    open: false,
    label: '',
    value: ''
  });
  const [primaryCountrySearch, setPrimaryCountrySearch] = useState('');
  const [secondaryCountrySearch, setSecondaryCountrySearch] = useState('');
  const [primaryCountryPickerOpen, setPrimaryCountryPickerOpen] = useState(false);
  const [secondaryCountryPickerOpen, setSecondaryCountryPickerOpen] = useState(false);
  const primaryCountryPickerRef = useRef(null);
  const secondaryCountryPickerRef = useRef(null);
  const updateSetting = (key, value) => setSettings(current => ({
    ...current,
    [key]: value
  }));
  const channelOptions = useMemo(() => fulfillmentChannels.split(',').map(channel => channel.trim()).filter(Boolean), [fulfillmentChannels]);
  const countryOptions = useMemo(() => Object.entries(localizationCountries).map(([isoCode, details]) => ({
    isoCode,
    name: details.name,
    dialingCode: `+${String(details.phone_code || (isoCode === 'IN' ? '91' : isoCode === 'US' ? '1' : isoCode === 'GB' ? '44' : isoCode === 'CA' ? '1' : isoCode === 'AU' ? '61' : isoCode === 'AE' ? '971' : isoCode === 'EU' ? '33' : isoCode === 'SG' ? '65' : isoCode === 'JP' ? '81' : ''))}`,
    aliases: details.aliases || []
  })).filter(option => option.dialingCode !== '+'), [localizationCountries]);
  const selectedCountryOption = useMemo(() => countryOptions.find(option => option.dialingCode === countryCode) || null, [countryCode, countryOptions]);
  const selectedSecondaryCountryOption = useMemo(() => countryOptions.find(option => option.dialingCode === settings.secondaryCountryCode) || null, [countryOptions, settings.secondaryCountryCode]);
  const filterCountryOptions = queryText => {
    const query = queryText.trim().toLowerCase();
    if (!query) {
      return countryOptions;
    }
    return countryOptions.filter(option => option.name.toLowerCase().includes(query) || option.dialingCode.toLowerCase().includes(query) || option.isoCode.toLowerCase().includes(query) || option.aliases.some(alias => String(alias).toLowerCase().includes(query)));
  };
  const filteredPrimaryCountryOptions = useMemo(() => filterCountryOptions(primaryCountrySearch), [countryOptions, primaryCountrySearch]);
  const filteredSecondaryCountryOptions = useMemo(() => filterCountryOptions(secondaryCountrySearch), [countryOptions, secondaryCountrySearch]);
  const isIndianSeller = String(country || user?.country || '').trim().toLowerCase() === 'india';
  const approvedVerification = useMemo(() => {
    const verification = user?.sellerVerification || user?.seller_verification || null;
    return String(verification?.status || '').toLowerCase() === 'approved' ? verification : null;
  }, [user?.sellerVerification, user?.seller_verification]);
  useEffect(() => {
    if (!user) return;
    const nextName = user.name || '';
    const nextEmail = user.email || '';
    const nextPhone = user.phone || '';
    const nextCountryCode = user.country_code || '';
    const nextBrandName = user.brand_name || '';
    const nextAddress = user.address || '';
    const nextCountry = user.country || '';
    const nextGstNumber = user.gst_number || '';
    const nextFulfillmentChannels = Array.isArray(user.fulfillment_channels) ? user.fulfillment_channels.join(', ') : '';
    const nextDefaultFulfillmentChannel = user.default_fulfillment_channel || '';
    const nextShippingAcceptanceTime = user.shipping_acceptance_time || '';
    const nextHandlingTimeBusinessDays = user.handling_time_business_days ?? 1;
    setName(nextName);
    setEmail(nextEmail);
    setPhone(nextPhone);
    setCountryCode(nextCountryCode);
    setBrandName(nextBrandName);
    setAddress(nextAddress);
    setCountry(nextCountry);
    setGstNumber(nextGstNumber);
    setFulfillmentChannels(nextFulfillmentChannels);
    setDefaultFulfillmentChannel(nextDefaultFulfillmentChannel);
    setShippingAcceptanceTime(nextShippingAcceptanceTime);
    setHandlingTimeBusinessDays(nextHandlingTimeBusinessDays);
    setVerificationSentAt(user.verification_code_sent_at || null);
    setPhoneVerificationSentAt(user.phone_verification_code_sent_at || null);
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
      const merged = {
        ...defaultSellerSettings,
        ...(stored || {}),
        ...(user.seller_settings || {})
      };
      if (!merged.addressLine1 && user.address) merged.addressLine1 = user.address;
      if (!merged.pickupCountry && user.country) merged.pickupCountry = user.country;
      setSettings(merged);
      setInitialProfileSnapshot(JSON.stringify({
        name: nextName,
        email: nextEmail,
        phone: nextPhone,
        countryCode: nextCountryCode,
        profilePhoto: merged.profilePhoto,
        secondaryPhone: merged.secondaryPhone,
        twoFactorEnabled: merged.twoFactorEnabled
      }));
      setInitialBusinessSnapshot(JSON.stringify({
        brandName: nextBrandName,
        address: nextAddress,
        country: nextCountry,
        gstNumber: nextGstNumber,
        fulfillmentChannels: nextFulfillmentChannels,
        defaultFulfillmentChannel: nextDefaultFulfillmentChannel,
        shippingAcceptanceTime: nextShippingAcceptanceTime,
        handlingTimeBusinessDays: nextHandlingTimeBusinessDays,
        sellerSettings: merged
      }));
    } catch {
      const fallbackSettings = {
        ...defaultSellerSettings,
        addressLine1: user.address || '',
        pickupCountry: user.country || ''
      };
      setSettings(fallbackSettings);
      setInitialProfileSnapshot(JSON.stringify({
        name: nextName,
        email: nextEmail,
        phone: nextPhone,
        countryCode: nextCountryCode,
        profilePhoto: fallbackSettings.profilePhoto,
        secondaryPhone: fallbackSettings.secondaryPhone,
        twoFactorEnabled: fallbackSettings.twoFactorEnabled
      }));
      setInitialBusinessSnapshot(JSON.stringify({
        brandName: nextBrandName,
        address: nextAddress,
        country: nextCountry,
        gstNumber: nextGstNumber,
        fulfillmentChannels: nextFulfillmentChannels,
        defaultFulfillmentChannel: nextDefaultFulfillmentChannel,
        shippingAcceptanceTime: nextShippingAcceptanceTime,
        handlingTimeBusinessDays: nextHandlingTimeBusinessDays,
        sellerSettings: fallbackSettings
      }));
    }
  }, [storageKey, user]);
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
  useEffect(() => {
    setActiveMobilePanel(panelParam === 'business' ? 'business' : 'profile');
  }, [panelParam]);
  useEffect(() => {
    const handlePointerDown = event => {
      if (primaryCountryPickerRef.current && !primaryCountryPickerRef.current.contains(event.target)) setPrimaryCountryPickerOpen(false);
      if (secondaryCountryPickerRef.current && !secondaryCountryPickerRef.current.contains(event.target)) setSecondaryCountryPickerOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);
  const verificationStatus = verificationCodeStatus(verificationSentAt, verificationNow);
  const verificationSendLabel = verificationActionLabel(verificationSentAt, verificationNow);
  const verificationSendDisabled = verifyLoading || verificationStatus === 'active';
  const verificationMinutesRemaining = verificationMinutesLeft(verificationSentAt, verificationNow);
  const phoneVerificationStatus = codeStatus(phoneVerificationSentAt, verificationNow);
  const phoneVerificationSendLabel = codeActionLabel(phoneVerificationSentAt, verificationNow);
  const phoneVerificationSendDisabled = phoneVerifyLoading || phoneVerificationStatus === 'active' || !countryCode || !phone;
  const phoneVerificationMinutesRemaining = codeMinutesLeft(phoneVerificationSentAt, verificationNow);
  const saveLocalSettings = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  };
  const currentProfileSnapshot = JSON.stringify({
    name,
    email,
    phone,
    countryCode,
    profilePhoto: settings.profilePhoto,
    secondaryPhone: settings.secondaryPhone,
    twoFactorEnabled: settings.twoFactorEnabled
  });
  const currentBusinessSnapshot = JSON.stringify({
    brandName,
    address,
    country,
    gstNumber,
    fulfillmentChannels,
    defaultFulfillmentChannel,
    shippingAcceptanceTime,
    handlingTimeBusinessDays,
    sellerSettings: settings
  });
  const isProfileDirty = Boolean(initialProfileSnapshot) && currentProfileSnapshot !== initialProfileSnapshot;
  const isBusinessDirty = Boolean(initialBusinessSnapshot) && currentBusinessSnapshot !== initialBusinessSnapshot;
  const hasUnsavedChanges = isProfileDirty || isBusinessDirty;
  const saveSettings = async () => {
    setSuccess('');
    setError('');
    setLoading(true);
    const splitAddress = [settings.addressLine1, settings.addressLine2, settings.city, settings.state, settings.pickupCountry, settings.pincode].filter(Boolean).join(', ');
    try {
      const updateData = {
        name,
        email,
        phone,
        country_code: countryCode,
        brand_name: brandName,
        address: splitAddress || address,
        country: settings.pickupCountry || country,
        gst_number: isIndianSeller ? gstNumber : '',
        fulfillment_channels: channelOptions,
        default_fulfillment_channel: defaultFulfillmentChannel,
        shipping_acceptance_time: shippingAcceptanceTime,
        handling_time_business_days: Number(handlingTimeBusinessDays || 1),
        seller_settings: settings
      };
      await updateProfile(updateData);
      saveLocalSettings();
      setSuccess('Settings saved successfully.');
      setInitialProfileSnapshot(currentProfileSnapshot);
      setInitialBusinessSnapshot(currentBusinessSnapshot);
      setUnsavedModal({
        open: false,
        section: 'profile'
      });
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async event => {
    event.preventDefault();
    await saveSettings();
  };
  const handleVerifyEmail = async event => {
    event.preventDefault();
    setVerifyError('');
    setVerifyMsg('');
    setVerifyLoading(true);
    try {
      await verifyEmailCode(verificationCode);
      setVerifyMsg('Email verified successfully!');
      setVerificationCode('');
      setVerificationSentAt(null);
    } catch (err) {
      setVerifyError(err.message || 'Verification failed');
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
    } catch (err) {
      setVerifyError(err.message || 'Failed to send code');
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
    } catch (err) {
      setPhoneVerifyError(err.message || 'Failed to send phone verification code');
    } finally {
      setPhoneVerifyLoading(false);
    }
  };
  const handleVerifyPhone = async event => {
    event.preventDefault();
    setPhoneVerifyError('');
    setPhoneVerifyMsg('');
    setPhoneVerifyLoading(true);
    try {
      await verifyPhoneCode(phoneVerificationCode);
      setPhoneVerifyMsg('Phone number verified successfully!');
      setPhoneVerificationCode('');
      setPhoneVerificationSentAt(null);
    } catch (err) {
      setPhoneVerifyError(err.message || 'Phone verification failed');
    } finally {
      setPhoneVerifyLoading(false);
    }
  };
  const handleSendPasswordLink = async () => {
    setSuccess('');
    setError('');
    setPasswordLinkLoading(true);
    try {
      const result = await sendPasswordResetLink(email || user?.email || null, 'profile');
      setSuccess(result.message || 'Password reset link sent successfully.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset link');
    } finally {
      setPasswordLinkLoading(false);
    }
  };
  const handleLogout = async () => {
    setSuccess('');
    setError('');
    setLogoutLoading(true);
    try {
      await logout();
    } catch (err) {
      setError(err.message || 'Failed to log out');
      setLogoutLoading(false);
    }
  };
  const handleDeleteAccount = async () => {
    setSuccess('');
    setError('');
    setDeleteAccountLoading(true);
    try {
      await requestAccountDeletion();
    } catch (err) {
      setError(err.message || 'Failed to schedule account deletion');
      setDeleteAccountLoading(false);
    }
  };
  const selectPrimaryCountryCode = option => {
    setCountryCode(option.dialingCode);
    setCountry(option.name);
    setPrimaryCountrySearch('');
    setPrimaryCountryPickerOpen(false);
  };
  const selectSecondaryCountryCode = option => {
    updateSetting('secondaryCountryCode', option.dialingCode);
    setSecondaryCountrySearch('');
    setSecondaryCountryPickerOpen(false);
  };
  const openPreviewModal = (label, value) => setPreviewModal({
    open: true,
    label,
    value
  });
  const setMobilePanel = panel => {
    setActiveMobilePanel(panel);
    const nextUrl = new URL(window.location.href);
    if (panel === 'business') nextUrl.searchParams.set('panel', 'business'); else nextUrl.searchParams.delete('panel');
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  };
  useEffect(() => {
    const handlePointerDown = event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (unsavedModal.open) return;
      const profileArea = document.querySelector('[data-settings-section="profile"]');
      const businessArea = document.querySelector('[data-settings-section="business"]');
      if (isProfileDirty && profileArea && profileArea.contains(target)) return;
      if (isBusinessDirty && businessArea && businessArea.contains(target)) return;
      if (isProfileDirty) {
        setUnsavedModal({
          open: true,
          section: 'profile'
        });
        return;
      }
      if (isBusinessDirty) {
        setUnsavedModal({
          open: true,
          section: 'business'
        });
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isBusinessDirty, isProfileDirty, unsavedModal.open]);
  const activeStepIndex = businessSteps.findIndex(step => step.key === activeBusinessStep);
  const goToBusinessStep = index => {
    const nextStep = businessSteps[Math.max(0, Math.min(index, businessSteps.length - 1))];
    setActiveBusinessStep(nextStep.key);
  };
  const activeBusinessStepMeta = businessSteps[Math.max(activeStepIndex, 0)] || businessSteps[0];
  const ActiveBusinessIcon = activeBusinessStepMeta.icon;
  const businessPagerItems = useMemo(() => {
    const total = businessSteps.length;
    const visibleIndexes = new Set([0, total - 1]);
    if (total <= 6) {
      businessSteps.forEach((_, index) => visibleIndexes.add(index));
    } else if (activeStepIndex <= 1) {
      [0, 1, 2].forEach(index => visibleIndexes.add(index));
    } else if (activeStepIndex >= total - 2) {
      [total - 3, total - 2, total - 1].forEach(index => visibleIndexes.add(index));
    } else {
      [activeStepIndex - 1, activeStepIndex, activeStepIndex + 1].forEach(index => visibleIndexes.add(index));
    }
    const sortedIndexes = Array.from(visibleIndexes).filter(index => index >= 0 && index < total).sort((left, right) => left - right);
    return sortedIndexes.flatMap((index, itemIndex) => {
      const previousIndex = sortedIndexes[itemIndex - 1];
      const gapItems = previousIndex !== undefined && index - previousIndex > 1 ? [{
        type: 'ellipsis',
        key: `ellipsis-${previousIndex}-${index}`
      }] : [];
      return [...gapItems, {
        type: 'step',
        key: businessSteps[index].key,
        index,
        step: businessSteps[index],
        isCurrent: index === activeStepIndex
      }];
    });
  }, [activeStepIndex]);
  function isBusinessStepComplete(stepKey) {
    switch (stepKey) {
      case 'identity':
        return [settings.storeLogo, settings.storeBanner, brandName, settings.businessType, settings.storeDescription].every(hasText);
      case 'address':
        return [settings.addressLine1, settings.city, settings.state, settings.pickupCountry, settings.pincode].every(hasText);
      case 'payout':
        return [settings.accountHolderName, settings.bankName, settings.accountNumber, settings.ifscCode, settings.upiId, settings.cancelledCheque].every(hasText);
      case 'tax':
        if (!settings.gstRegistered) return true;
        return [gstNumber, settings.gstCertificate].every(hasText);
      case 'documents':
        return [settings.panCard, settings.businessLicense, settings.cancelledCheque, settings.addressProof, settings.gstRegistered ? settings.gstCertificate : 'not-required'].every(hasText);
      case 'shipping':
        return [fulfillmentChannels, defaultFulfillmentChannel, shippingAcceptanceTime, String(handlingTimeBusinessDays ?? ''), settings.freeShippingAbove, settings.packageWeight, settings.packageLength, settings.packageWidth, settings.packageHeight, settings.weightUnit].every(hasText);
      case 'returns':
        return hasText(settings.returnWindow);
      case 'notifications':
        return [settings.orderEmail, settings.orderSms, settings.orderWhatsapp].some(Boolean);
      case 'status':
        return hasText(settings.storeStatus);
      default:
        return false;
    }
  }
  const settingsSummary = useMemo(() => [{
    label: 'Profile Status',
    value: user?.email_verified_at && user?.phone_verified_at ? 'Verified' : 'Attention',
    icon: User,
    tone: user?.email_verified_at && user?.phone_verified_at ? 'green' : 'amber'
  }, {
    label: 'Business Steps',
    value: `${businessSteps.filter(step => isBusinessStepComplete(step.key)).length}/${businessSteps.length}`,
    icon: Building2,
    tone: 'blue'
  }, {
    label: 'Store Status',
    value: settings.storeStatus || 'Active',
    icon: Package,
    tone: String(settings.storeStatus || '').toLowerCase().includes('vacation') || String(settings.storeStatus || '').toLowerCase().includes('closed') ? 'amber' : 'green'
  }, {
    label: 'Unsaved Changes',
    value: hasUnsavedChanges ? 'Pending' : 'Saved',
    icon: ShieldCheck,
    tone: hasUnsavedChanges ? 'amber' : 'purple'
  }], [hasUnsavedChanges, settings.storeStatus, user?.email_verified_at, user?.phone_verified_at]);
  const renderVerificationCards = () => <SectionStack>
    {!user?.email_verified_at ? <Card title="Email Verification Required">
      <SectionStack>
        <VerificationNotice title="Your email is not verified" copy={verificationStatus === 'unsent' ? `Send a 6-digit verification code to ${user?.email}.` : `Enter the code sent to ${user?.email}.`} extra={verificationStatus === 'active' ? `Code expires in ${verificationMinutesRemaining} minute${verificationMinutesRemaining === 1 ? '' : 's'}.` : ''} />
        {renderAlert('error', verifyError, () => setVerifyError(''))}
        {renderAlert('success', verifyMsg, () => setVerifyMsg(''))}
        <form onSubmit={handleVerifyEmail}>
          <SettingsInput label="6-Digit Verification Code" maxLength={6} value={verificationCode} onChange={event => setVerificationCode(event.target.value)} required />
          <div>
            <Button type="submit" disabled={verifyLoading}>
              {verifyLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button type="button" variant="outline" onClick={handleResendCode} disabled={verificationSendDisabled}>
              {verificationSendLabel}
            </Button>
          </div>
        </form>
      </SectionStack>
    </Card> : null}

    {!user?.phone_verified_at ? <Card title="Phone Verification Required">
      <SectionStack>
        <VerificationNotice title="Your phone is not verified" copy="Enter your phone number, then send an SMS verification code." extra={phoneVerificationStatus === 'active' ? `SMS code expires in ${phoneVerificationMinutesRemaining} minute${phoneVerificationMinutesRemaining === 1 ? '' : 's'}.` : ''} />
        {renderAlert('error', phoneVerifyError, () => setPhoneVerifyError(''))}
        {renderAlert('success', phoneVerifyMsg, () => setPhoneVerifyMsg(''))}
        <form onSubmit={handleVerifyPhone}>
          <SettingsInput label="6-Digit SMS Code" maxLength={6} value={phoneVerificationCode} onChange={event => setPhoneVerificationCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))} required />
          <div>
            <Button type="submit" disabled={phoneVerifyLoading}>
              {phoneVerifyLoading ? 'Verifying...' : 'Verify Phone'}
            </Button>
            <Button type="button" variant="outline" onClick={handleSendPhoneCode} disabled={phoneVerificationSendDisabled}>
              {phoneVerificationSendLabel}
            </Button>
          </div>
        </form>
      </SectionStack>
    </Card> : null}
  </SectionStack>;
  const renderApprovedVerificationSummary = () => approvedVerification ? <Card title="Verified Business Record" extra={<ShieldCheck size={18} />}>
    <SectionStack>
      <div className="border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-900">
          <CheckCircle2 size={16} />
          Seller verification approved
        </div>
        <p className="mt-2 text-sm leading-6 text-emerald-900/80">
          These business details came from the approved onboarding submission and are now active for the seller account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatusLine label="Legal Business Name" value={approvedVerification.legal_name || 'N/A'} />
        <StatusLine label="Business Type" value={approvedVerification.business_type || 'N/A'} />
        <StatusLine label="Business Country" value={approvedVerification.business_country || 'N/A'} />
        <StatusLine label="Tax Registration" value={approvedVerification.tax_id || 'N/A'} />
        <StatusLine label="Secondary Tax / ID" value={approvedVerification.pan_number || 'N/A'} />
        <StatusLine label="Registration Number" value={approvedVerification.registration_number || 'N/A'} />
        <StatusLine label="Representative" value={approvedVerification.contact_person_name || 'N/A'} />
        <StatusLine label="Representative ID Type" value={approvedVerification.contact_person_id_type || 'N/A'} />
        <StatusLine label="Representative ID Number" value={approvedVerification.contact_person_id_number || 'N/A'} />
        <StatusLine label="Bank Account Holder" value={approvedVerification.bank_account_holder_name || 'N/A'} />
        <StatusLine label="Bank Name" value={approvedVerification.bank_name || 'N/A'} />
        <StatusLine label="Bank Account Number" value={approvedVerification.bank_account_number || 'N/A'} />
        <StatusLine label="Bank Code" value={approvedVerification.bank_ifsc_code || 'N/A'} />
        <StatusLine label="Business City" value={approvedVerification.business_city || 'N/A'} />
        <StatusLine label="Business State" value={approvedVerification.business_state || 'N/A'} />
        <StatusLine label="Postal Code" value={approvedVerification.business_postal_code || 'N/A'} />
      </div>

      <div className="border border-neutral-200 bg-neutral-50 px-4 py-3">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Business Address</span>
        <strong className="mt-2 block text-sm font-semibold text-neutral-950">{approvedVerification.business_address || 'N/A'}</strong>
      </div>
    </SectionStack>
  </Card> : null;
  const renderBusinessStep = () => {
    switch (activeBusinessStep) {
      case 'address':
        return <Card title="Pickup Address" extra={<Building2 size={18} />}>
          <FormGrid>
            <SettingsInput label="Address Line 1" value={settings.addressLine1} onChange={event => updateSetting('addressLine1', event.target.value)} />
            <SettingsInput label="Address Line 2" value={settings.addressLine2} onChange={event => updateSetting('addressLine2', event.target.value)} />
            <SettingsInput label="City" value={settings.city} onChange={event => updateSetting('city', event.target.value)} />
            <SettingsInput label="State" value={settings.state} onChange={event => updateSetting('state', event.target.value)} />
            <SettingsInput label="Country" value={settings.pickupCountry} onChange={event => updateSetting('pickupCountry', event.target.value)} />
            <SettingsInput label="Pincode" value={settings.pincode} onChange={event => updateSetting('pincode', event.target.value.replace(/[^\d]/g, ''))} />
          </FormGrid>
        </Card>;
      case 'payout':
        return <Card title="Payout Settings" extra={<CreditCard size={18} />}>
          <FormGrid>
            <SettingsInput label="Account Holder Name" value={settings.accountHolderName} onChange={event => updateSetting('accountHolderName', event.target.value)} />
            <SettingsInput label="Bank Name" value={settings.bankName} onChange={event => updateSetting('bankName', event.target.value)} />
            <SettingsInput label="Account Number" value={settings.accountNumber} onChange={event => updateSetting('accountNumber', event.target.value.replace(/[^\d]/g, ''))} />
            <SettingsInput label="IFSC Code" value={settings.ifscCode} onChange={event => updateSetting('ifscCode', event.target.value.toUpperCase())} />
            <SettingsInput label="UPI ID" value={settings.upiId} onChange={event => updateSetting('upiId', event.target.value)} />
            <DocumentTile label="Cancelled Cheque" value={settings.cancelledCheque} onChange={value => updateSetting('cancelledCheque', value)} onRemove={() => updateSetting('cancelledCheque', '')} onPreview={() => openPreviewModal('Cancelled Cheque', settings.cancelledCheque)} />
          </FormGrid>
        </Card>;
      case 'tax':
        return <Card title="Tax Settings" extra={<ShieldCheck size={18} />}>
          <SectionStack>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <strong className="block text-sm font-semibold text-neutral-950">GST Registered</strong>
                <span className="block text-sm text-neutral-600">
                  Control GST fields and certificates used for tax compliance.
                </span>
              </div>
              <div className="flex overflow-hidden border border-neutral-200 bg-white">
                <ChoicePill active={settings.gstRegistered} className="min-h-11 border-0 border-r border-neutral-200" onClick={() => updateSetting('gstRegistered', true)}>
                  Yes
                </ChoicePill>
                <ChoicePill active={!settings.gstRegistered} className="min-h-11 border-0" onClick={() => updateSetting('gstRegistered', false)}>
                  No
                </ChoicePill>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
              <DocumentTile label="GST Certificate" value={settings.gstCertificate} onChange={value => updateSetting('gstCertificate', value)} onRemove={() => updateSetting('gstCertificate', '')} onPreview={() => openPreviewModal('GST Certificate', settings.gstCertificate)} />
              <SettingsInput label="GST Number" value={gstNumber} onChange={event => setGstNumber(event.target.value.toUpperCase())} />
            </div>
          </SectionStack>
        </Card>;
      case 'documents':
        return <Card title="Documents" extra={<FileCheck2 size={18} />}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <DocumentTile label="GST Certificate" value={settings.gstCertificate} onChange={value => updateSetting('gstCertificate', value)} onRemove={() => updateSetting('gstCertificate', '')} onPreview={() => openPreviewModal('GST Certificate', settings.gstCertificate)} />
            <DocumentTile label="PAN Card" value={settings.panCard} onChange={value => updateSetting('panCard', value)} onRemove={() => updateSetting('panCard', '')} onPreview={() => openPreviewModal('PAN Card', settings.panCard)} />
            <DocumentTile label="Business License" value={settings.businessLicense} onChange={value => updateSetting('businessLicense', value)} onRemove={() => updateSetting('businessLicense', '')} onPreview={() => openPreviewModal('Business License', settings.businessLicense)} />
            <DocumentTile label="Cancelled Cheque" value={settings.cancelledCheque} onChange={value => updateSetting('cancelledCheque', value)} onRemove={() => updateSetting('cancelledCheque', '')} onPreview={() => openPreviewModal('Cancelled Cheque', settings.cancelledCheque)} />
            <DocumentTile label="Address Proof" value={settings.addressProof} onChange={value => updateSetting('addressProof', value)} onRemove={() => updateSetting('addressProof', '')} onPreview={() => openPreviewModal('Address Proof', settings.addressProof)} />
          </div>
        </Card>;
      case 'shipping':
        return <Card title="Shipping Settings" extra={<Truck size={18} />}>
          <FormGrid>
            <SettingsInput label="Fulfillment Channels *" value={fulfillmentChannels} onChange={event => setFulfillmentChannels(event.target.value)} required />
            <SettingsInput label="Default Fulfillment Channel *" value={defaultFulfillmentChannel} onChange={event => setDefaultFulfillmentChannel(event.target.value)} required />
            <SettingsInput label="Order Acceptance Time *" value={shippingAcceptanceTime} onChange={event => setShippingAcceptanceTime(event.target.value)} required />
            <SettingsInput label="Handling Time (Business Days)" type="number" min="0" max="30" value={handlingTimeBusinessDays} onChange={event => setHandlingTimeBusinessDays(event.target.value)} />
            <SettingsInput label="Free Shipping Above" value={settings.freeShippingAbove} onChange={event => updateSetting('freeShippingAbove', event.target.value.replace(/[^\d]/g, ''))} />
            <SettingsInput label="Default Package Weight" value={settings.packageWeight} onChange={event => updateSetting('packageWeight', event.target.value)} />
            <SettingsInput label="Default Package Length" value={settings.packageLength} onChange={event => updateSetting('packageLength', event.target.value)} />
            <SettingsInput label="Width" value={settings.packageWidth} onChange={event => updateSetting('packageWidth', event.target.value)} />
            <SettingsInput label="Height" value={settings.packageHeight} onChange={event => updateSetting('packageHeight', event.target.value)} />
            <LabeledField label="Weight Unit">
              <SellerSelect value={settings.weightUnit} onChange={event => updateSetting('weightUnit', event.target.value)}>
                <option>Kg</option>
                <option>Gram</option>
              </SellerSelect>
            </LabeledField>
          </FormGrid>
        </Card>;
      case 'returns':
        return <Card title="Return Settings" extra={<RotateCcw size={18} />}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <LabeledField label="Return Window">
              <SellerSelect value={settings.returnWindow} onChange={event => updateSetting('returnWindow', event.target.value)}>
                <option>7 Days</option>
                <option>15 Days</option>
                <option>30 Days</option>
              </SellerSelect>
            </LabeledField>
            <div className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Return Policy</span>
              <div className="flex min-h-12 flex-wrap overflow-hidden border border-neutral-200 bg-white">
                <ChoicePill active={settings.acceptReturns} className="min-h-12 flex-1 border-0 border-r border-neutral-200" onClick={() => updateSetting('acceptReturns', true)}>
                  Accept Returns
                </ChoicePill>
                <ChoicePill active={!settings.acceptReturns} className="min-h-12 flex-1 border-0" onClick={() => updateSetting('acceptReturns', false)}>
                  No Returns
                </ChoicePill>
              </div>
            </div>
          </div>
        </Card>;
      case 'notifications':
        return <Card title="Notification Preferences" extra={<Bell size={18} />}>
          <div>
            <ToggleChoice label="Order Emails" checked={settings.orderEmail} onChange={value => updateSetting('orderEmail', value)} />
            <ToggleChoice label="Order SMS" checked={settings.orderSms} onChange={value => updateSetting('orderSms', value)} />
            <ToggleChoice label="Order WhatsApp" checked={settings.orderWhatsapp} onChange={value => updateSetting('orderWhatsapp', value)} />
            <ToggleChoice label="Promotional Emails" checked={settings.promotionalEmails} onChange={value => updateSetting('promotionalEmails', value)} />
          </div>
        </Card>;
      case 'status':
        return <Card title="Store Status" extra={<Package size={18} />}>
          <div className="flex flex-col gap-3">
            {['Active', 'Vacation Mode', 'Temporarily Closed'].map(status => {
              const isActive = settings.storeStatus === status || (!settings.storeStatus && status === 'Active');
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateSetting('storeStatus', status)}
                  className={`flex items-center justify-between border p-4 text-sm font-medium transition ${isActive ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-50 hover:border-neutral-300'}`}
                >
                  <span>{status}</span>
                  {isActive ? <CheckCircle2 size={16} /> : null}
                </button>
              );
            })}
          </div>
        </Card>;
      case 'identity':
      default:
        return <Card title="Business Identity" extra={<Store size={18} />}>
          <SectionStack>
            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex justify-center lg:justify-start">
                <UploadBox label="Store Logo" value={settings.storeLogo} onChange={value => updateSetting('storeLogo', value)} compact overlayLabel="Change Store Logo" />
              </div>
              <div className="flex items-stretch">
                <UploadBox label="Store Banner" value={settings.storeBanner} onChange={value => updateSetting('storeBanner', value)} rectangle overlayLabel="Change Store Banner" />
              </div>
            </div>
            <FormGrid>
              <SettingsInput label="Store / Brand Name *" value={brandName} onChange={event => setBrandName(event.target.value)} required />
              <LabeledField label="Business Type">
                <SellerSelect value={settings.businessType} onChange={event => updateSetting('businessType', event.target.value)}>
                  <option>Individual</option>
                  <option>Sole Proprietorship</option>
                  <option>Partnership</option>
                  <option>Private Limited</option>
                  <option>LLP</option>
                </SellerSelect>
              </LabeledField>
              <SettingsInput label="PAN Number" value={settings.panNumber} onChange={event => updateSetting('panNumber', event.target.value.toUpperCase())} placeholder="ABCDE1234F" />
              <SettingsInput label="Business Registration Number" value={settings.registrationNumber} onChange={event => updateSetting('registrationNumber', event.target.value)} placeholder="CIN / LLPIN / Registration Number" />
            </FormGrid>
            <SettingsInput label="About Store" as="textarea" rows={4} value={settings.storeDescription} onChange={event => updateSetting('storeDescription', event.target.value)} placeholder="We sell office supplies and stationery." />
          </SectionStack>
        </Card>;
    }
  };
  const renderProfileSection = () => <div data-settings-section="profile">
    {renderVerificationCards()}

    <form onSubmit={handleSubmit}>
      <Card title="Profile Details" extra={<User size={18} />}>
        <SectionStack>
          <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex justify-center xl:justify-start">
              <UploadBox label="Profile Photo" value={settings.profilePhoto} onChange={value => updateSetting('profilePhoto', value)} compact />
            </div>
            <div className="space-y-4">
              <FormGrid className="gap-4">
                <SettingsInput label="Contact Person Name *" value={name} onChange={event => setName(event.target.value)} required />
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <SettingsInput label="Login Email Address *" type="email" value={email} onChange={event => setEmail(event.target.value)} required />
                  <div className="border border-neutral-200 bg-neutral-50 px-4 py-3">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Seller ID</span>
                    <strong className="mt-2 block break-all text-sm font-semibold text-neutral-950">{user?.seller_id || 'Pending'}</strong>
                  </div>
                </div>
              </FormGrid>
              <FormGrid className="items-start gap-y-4 gap-x-2 xl:grid-cols-3">
                <LabeledField label="Primary Phone">
                  <div className="flex gap-2">
                    <div className="relative w-24 shrink-0" ref={primaryCountryPickerRef}>
                      <button type="button" className="flex h-12 w-full items-center justify-between rounded-none border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-950 shadow-sm transition hover:bg-white focus:outline-none" onClick={() => setPrimaryCountryPickerOpen(open => !open)}>
                        <span className="truncate">{selectedCountryOption?.dialingCode || countryCode || '+91'}</span>
                        <ChevronDown size={16} />
                      </button>
                      {primaryCountryPickerOpen ? <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[320px] border border-neutral-200 bg-white shadow-sm">
                        <div className="border-b border-neutral-200 p-3">
                          <div className="flex items-center gap-2 border border-neutral-200 bg-neutral-50 px-3">
                            <Search size={15} className="text-neutral-500" />
                            <input className="h-10 w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400" value={primaryCountrySearch} onChange={event => setPrimaryCountrySearch(event.target.value)} placeholder="Search country or code" />
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {filteredPrimaryCountryOptions.length ? filteredPrimaryCountryOptions.map(option => <button key={`${option.isoCode}-${option.dialingCode}`} type="button" className="flex w-full items-center justify-between border-b border-neutral-200 px-3 py-3 text-left text-sm transition hover:bg-neutral-100" onClick={() => selectPrimaryCountryCode(option)}>
                            <span className="font-medium text-neutral-950">{option.name}</span>
                            <span className="text-neutral-500">{option.dialingCode}</span>
                          </button>) : <div className="px-3 py-4 text-sm text-neutral-500">No matching country codes found.</div>}
                        </div>
                      </div> : null}
                    </div>
                    <SettingsInput className="flex-1" labelClassName="sr-only" inputClassName="w-full" type="tel" maxLength={10} inputMode="numeric" value={phone} onChange={event => setPhone(event.target.value.replace(/[^\d]/g, '').slice(0, 10))} placeholder="Enter phone number" />
                  </div>
                </LabeledField>
                <LabeledField label="Secondary Phone">
                  <div className="flex gap-2">
                    <div className="relative w-24 shrink-0" ref={secondaryCountryPickerRef}>
                      <button type="button" className="flex h-12 w-full items-center justify-between rounded-none border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-950 shadow-sm transition hover:bg-white focus:outline-none" onClick={() => setSecondaryCountryPickerOpen(open => !open)}>
                        <span className="truncate">{selectedSecondaryCountryOption?.dialingCode || settings.secondaryCountryCode || countryCode || '+91'}</span>
                        <ChevronDown size={16} />
                      </button>
                      {secondaryCountryPickerOpen ? <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[320px] border border-neutral-200 bg-white shadow-sm">
                        <div className="border-b border-neutral-200 p-3">
                          <div className="flex items-center gap-2 border border-neutral-200 bg-neutral-50 px-3">
                            <Search size={15} className="text-neutral-500" />
                            <input className="h-10 w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400" value={secondaryCountrySearch} onChange={event => setSecondaryCountrySearch(event.target.value)} placeholder="Search country or code" />
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {filteredSecondaryCountryOptions.length ? filteredSecondaryCountryOptions.map(option => <button key={`secondary-${option.isoCode}-${option.dialingCode}`} type="button" className="flex w-full items-center justify-between border-b border-neutral-200 px-3 py-3 text-left text-sm transition hover:bg-neutral-100" onClick={() => selectSecondaryCountryCode(option)}>
                            <span className="font-medium text-neutral-950">{option.name}</span>
                            <span className="text-neutral-500">{option.dialingCode}</span>
                          </button>) : <div className="px-3 py-4 text-sm text-neutral-500">No matching country codes found.</div>}
                        </div>
                      </div> : null}
                    </div>
                    <SettingsInput className="flex-1" labelClassName="sr-only" inputClassName="w-full" type="tel" maxLength={10} inputMode="numeric" value={settings.secondaryPhone} onChange={event => updateSetting('secondaryPhone', event.target.value.replace(/[^\d]/g, '').slice(0, 10))} placeholder="Enter secondary number" />
                  </div>
                </LabeledField>
                <div className="xl:self-end">
                  <SettingsInput label="Country / Region" value={country} readOnly disabled inputClassName="cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-500 shadow-none focus:border-neutral-200 focus:bg-neutral-100 focus:ring-0" />
                  <span className="mt-2 block text-xs text-neutral-500">Change country from business setting.</span>
                </div>
              </FormGrid>
            </div>
          </div>
        </SectionStack>
      </Card>

      <Card className="mt-4" title="Security" extra={<Lock size={18} />}>
        <SectionStack>
          <div className="border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <strong className="block text-sm font-semibold text-neutral-950">Reset Password</strong>
                <small className="block text-sm text-neutral-600">
                  {email || user?.email || 'Your login email'} will receive a secure password reset link.
                </small>
              </div>
              <Button type="button" variant="outline" onClick={handleSendPasswordLink} disabled={passwordLinkLoading}>
                {passwordLinkLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </div>
          <div>
            <div>
              <strong>Two-Factor Authentication (2FA)</strong>
              <span>Use an additional verification step when signing in.</span>
            </div>
            <div>
              <ChoicePill active={!settings.twoFactorEnabled} onClick={() => updateSetting('twoFactorEnabled', false)}>
                Disabled
              </ChoicePill>
              <ChoicePill active={settings.twoFactorEnabled} onClick={() => updateSetting('twoFactorEnabled', true)}>
                Enabled
              </ChoicePill>
            </div>
          </div>
          <div>
            <StatusLine label="Email" value={email || user?.email || '-'} status={user?.email_verified_at ? 'Verified' : 'Pending'} />
            <StatusLine label="Last Login" value="18 June 2026" />
            <StatusLine label="Location" value="Ahmedabad, India" />
            <StatusLine label="Device" value="Chrome on Windows" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <button type="button" className="flex min-h-16 items-center justify-between border border-neutral-200 bg-white px-4 py-4 text-left transition hover:bg-neutral-100" onClick={handleLogout} disabled={logoutLoading}>
              <div>
                <strong className="block text-sm font-semibold text-neutral-950">Log Out</strong>
                <span className="block text-sm text-neutral-600">End this session immediately.</span>
              </div>
              <LogOut size={18} className="text-neutral-950" />
            </button>
            <button type="button" className="flex min-h-16 items-center justify-between border border-rose-500 bg-white px-4 py-4 text-left transition hover:bg-neutral-100" onClick={handleDeleteAccount} disabled={deleteAccountLoading}>
              <div>
                <strong className="block text-sm font-semibold text-rose-700">Delete Account</strong>
                <span className="block text-sm text-rose-600">Log out now and schedule deletion in 7 days.</span>
              </div>
              <Trash2 size={18} className="text-rose-700" />
            </button>
          </div>
        </SectionStack>
      </Card>
    </form>
  </div>;
  const renderBusinessSection = () => <div data-settings-section="business">
    <form onSubmit={handleSubmit}>
      {renderApprovedVerificationSummary()}

      <Card title="Business Workflow" extra={<ActiveBusinessIcon size={18} />}>
        <SectionStack>
          <div className="overflow-visible rounded-none border border-neutral-200 bg-neutral-50 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" disabled={activeStepIndex === 0} onClick={() => goToBusinessStep(activeStepIndex - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <div className="flex flex-1 justify-center overflow-x-auto">
                <div className="flex items-stretch gap-3">
                  {businessPagerItems.map(item => {
                    if (item.type === 'ellipsis') {
                      return <span key={item.key} className="inline-flex min-h-[72px] items-center px-2 text-sm font-semibold text-neutral-500">
                        ...
                      </span>;
                    }
                    const Icon = item.step.icon;
                    return <button key={item.key} type="button" className={cn('relative flex min-h-[72px] min-w-[104px] flex-col items-center justify-center gap-1.5 border px-3 py-2 text-center transition', item.isCurrent ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm' : 'border-neutral-950 bg-white text-neutral-950 shadow-sm hover:bg-neutral-100')} onClick={() => setActiveBusinessStep(item.step.key)}>
                      <span className={cn('text-[10px] font-semibold uppercase tracking-[0.14em]', item.isCurrent ? 'text-neutral-200' : 'text-neutral-500')}>
                        Step {item.index + 1}
                      </span>
                      <Icon size={15} />
                      <span className="text-sm font-semibold leading-tight">{item.step.label}</span>
                      {isBusinessStepComplete(item.step.key) ? <span className={cn('absolute right-[-2px] top-[-2px] flex h-7 w-7 items-center justify-center border border-neutral-200', item.isCurrent ? 'bg-white text-neutral-950' : 'bg-neutral-950 text-white')}>
                        <Check size={14} strokeWidth={3} />
                      </span> : null}
                    </button>;
                  })}
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" disabled={activeStepIndex === businessSteps.length - 1} onClick={() => goToBusinessStep(activeStepIndex + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>

          {renderBusinessStep()}

          <div>
            <Button type="button" variant="outline" disabled={activeStepIndex === 0} onClick={() => goToBusinessStep(activeStepIndex - 1)}>
              Back
            </Button>
            {activeStepIndex < businessSteps.length - 1 ? <Button type="button" onClick={() => goToBusinessStep(activeStepIndex + 1)}>
              Next
            </Button> : <Button type="submit" disabled={loading}>
              {loading ? 'Saving Changes...' : 'Save Business Details'}
            </Button>}
          </div>
        </SectionStack>
      </Card>
    </form>
  </div>;
  return <div>
    <Sidebar />
    <SellerPageShell>
      <SellerPageHeader title="Settings & Defaults" description="Manage profile, business identity, payout, tax, shipping, and store preferences from one place." stats={settingsSummary} action={<Button type="button" disabled={loading || !hasUnsavedChanges} onClick={saveSettings}>
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>} />

      <div className="flex justify-start">
        <div className="flex items-center overflow-hidden border border-neutral-200 bg-white shadow-sm">
          <button type="button" className={cn('min-h-11 px-5 text-sm font-medium transition', activeMobilePanel === 'profile' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-100')} onClick={() => setMobilePanel('profile')}>
            Profile
          </button>
          <span className="h-11 w-[2px] bg-neutral-950" />
          <button type="button" className={cn('min-h-11 px-5 text-sm font-medium transition', activeMobilePanel === 'business' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-100')} onClick={() => setMobilePanel('business')}>
            Business
          </button>
        </div>
      </div>

      {success || error ? <DismissibleAlert onClose={() => {
        setSuccess('');
        setError('');
      }} role={error ? 'alert' : 'status'}>
        {error || success}
      </DismissibleAlert> : null}

      <div className="space-y-4">
        {activeMobilePanel === 'profile' ? renderProfileSection() : renderBusinessSection()}
      </div>

      {unsavedModal.open ? <SellerModalBackdrop onClose={() => setUnsavedModal({
        open: false,
        section: 'profile'
      })}>
        <SellerModalCard onMouseDown={event => event.stopPropagation()}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-950">
                <BadgeAlert size={20} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-neutral-950">Save your changes?</h3>
            </div>
            <p className="text-sm leading-6 text-neutral-600">
              You changed {unsavedModal.section === 'business' ? 'business' : 'profile'} information. Save it now to keep the latest details.
            </p>
            <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setUnsavedModal({
                open: false,
                section: 'profile'
              })} className="w-full sm:w-auto">
                Keep Editing
              </Button>
              <Button type="button" onClick={saveSettings} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Saving...' : 'Save Info'}
              </Button>
            </div>
          </div>
        </SellerModalCard>
      </SellerModalBackdrop> : null}

      {previewModal.open ? <SellerModalBackdrop onClose={() => setPreviewModal({
        open: false,
        label: '',
        value: ''
      })}>
        <SellerModalCard onMouseDown={event => event.stopPropagation()} className="max-w-3xl">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3>{previewModal.label}</h3>
                <p className="text-sm text-neutral-600">View the uploaded file.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setPreviewModal({
                open: false,
                label: '',
                value: ''
              })}>
                Close
              </Button>
            </div>
            <div className="flex min-h-[320px] items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-50 p-4">
              {isPreviewableImage(previewModal.value) ? <img src={previewModal.value} alt={previewModal.label} className="max-h-[70vh] w-auto max-w-full object-contain" /> : <div className="space-y-3 text-center">
                <strong className="block text-base font-semibold text-neutral-950">Preview unavailable</strong>
                <p className="text-sm text-neutral-600">This uploaded file cannot be previewed here.</p>
              </div>}
            </div>
          </div>
        </SellerModalCard>
      </SellerModalBackdrop> : null}
    </SellerPageShell>
  </div>;
};
export default SellerProfile;
