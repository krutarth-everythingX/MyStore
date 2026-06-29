import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { RightDrawer } from './RightDrawer';
import { DismissibleAlert } from './DismissibleAlert';
import { codeActionLabel, codeMinutesLeft, codeStatus, verificationActionLabel, verificationCodeStatus, verificationMinutesLeft } from '../utils/emailVerification';
const alertClassName = {
  success: 'border border-emerald-200 bg-white text-emerald-800',
  error: 'border border-rose-200 bg-white text-rose-800'
};
const drawerCardClassName = 'rounded-2xl border border-slate-200 shadow-none hover:translate-y-0 hover:border-slate-200 hover:shadow-none';
const VerifyNotice = ({
  title,
  copy,
  extra
}) => <div>
    <AlertTriangle size={24} />
    <div>
      <p>{title}</p>
      <p>{copy}</p>
      {extra ? <p>{extra}</p> : null}
    </div>
  </div>;
const FormSectionTitle = ({
  children
}) => <h4>{children}</h4>;
export const ProfileDrawer = ({
  isOpen,
  onClose
}) => {
  const {
    user,
    updateProfile,
    verifyEmailCode,
    resendVerificationCode,
    sendPhoneVerification,
    verifyPhoneCode
  } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [password, setPassword] = useState('');
  const [brandName, setBrandName] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [fulfillmentChannels, setFulfillmentChannels] = useState('');
  const [defaultFulfillmentChannel, setDefaultFulfillmentChannel] = useState('');
  const [shippingAcceptanceTime, setShippingAcceptanceTime] = useState('');
  const [handlingTimeBusinessDays, setHandlingTimeBusinessDays] = useState(1);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
  const channelOptions = useMemo(() => fulfillmentChannels.split(',').map(channel => channel.trim()).filter(Boolean), [fulfillmentChannels]);
  const isIndianSeller = String(country || user?.country || '').trim().toLowerCase() === 'india';
  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setCountryCode(user.country_code || '');
    setBrandName(user.brand_name || '');
    setAddress(user.address || '');
    setCountry(user.country || '');
    setGstNumber(user.gst_number || '');
    setFulfillmentChannels(Array.isArray(user.fulfillment_channels) ? user.fulfillment_channels.join(', ') : '');
    setDefaultFulfillmentChannel(user.default_fulfillment_channel || '');
    setShippingAcceptanceTime(user.shipping_acceptance_time || '');
    setHandlingTimeBusinessDays(user.handling_time_business_days ?? 1);
    setVerificationSentAt(user.verification_code_sent_at || null);
    setPhoneVerificationSentAt(user.phone_verification_code_sent_at || null);
  }, [user?.id]);
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
  const handleSubmit = async event => {
    event.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);
    try {
      const updateData = {
        name,
        email,
        phone,
        country_code: countryCode,
        brand_name: brandName,
        address,
        country,
        gst_number: isIndianSeller ? gstNumber : '',
        fulfillment_channels: channelOptions,
        default_fulfillment_channel: defaultFulfillmentChannel,
        shipping_acceptance_time: shippingAcceptanceTime,
        handling_time_business_days: Number(handlingTimeBusinessDays || 1)
      };
      if (password) updateData.password = password;
      await updateProfile(updateData);
      setSuccess('Store profile updated successfully!');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
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
  return <RightDrawer isOpen={isOpen} onClose={onClose} title="Store Profile Settings">
      <p>
        Manage brand, origin country, fulfillment, and login details.
      </p>

      {!user?.email_verified_at && <Card title="Email Verification Required">
          <div>
            <VerifyNotice title="Your email is not verified" copy={verificationStatus === 'unsent' ? `Send a 6-digit verification code to ${user?.email}.` : `Enter the 6-digit verification code sent to ${user?.email}.`} extra={verificationStatus === 'active' ? `Code expires in ${verificationMinutesRemaining} minute${verificationMinutesRemaining === 1 ? '' : 's'}.` : ''} />

            {verifyError ? <DismissibleAlert onClose={() => setVerifyError('')} role="alert">
                {verifyError}
              </DismissibleAlert> : null}
            {verifyMsg ? <DismissibleAlert onClose={() => setVerifyMsg('')}>
                {verifyMsg}
              </DismissibleAlert> : null}

            <form onSubmit={handleVerifyEmail}>
              <Input label="6-Digit Verification Code" type="text" placeholder="Enter code" maxLength={6} value={verificationCode} onChange={event => setVerificationCode(event.target.value)} required />
              <div>
                <Button type="submit" variant="primary" disabled={verifyLoading}>
                  {verifyLoading ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button type="button" variant="outline" onClick={handleResendCode} disabled={verificationSendDisabled}>
                  {verificationSendLabel}
                </Button>
              </div>
            </form>
          </div>
        </Card>}

      {!user?.phone_verified_at && <Card title="Phone Verification Required">
          <div>
            <VerifyNotice title="Your phone is not verified" copy="Enter your country calling code and phone number, then send an SMS code." extra={phoneVerificationStatus === 'active' ? `SMS code expires in ${phoneVerificationMinutesRemaining} minute${phoneVerificationMinutesRemaining === 1 ? '' : 's'}.` : ''} />

            {phoneVerifyError ? <DismissibleAlert onClose={() => setPhoneVerifyError('')} role="alert">
                {phoneVerifyError}
              </DismissibleAlert> : null}
            {phoneVerifyMsg ? <DismissibleAlert onClose={() => setPhoneVerifyMsg('')}>
                {phoneVerifyMsg}
              </DismissibleAlert> : null}

            <form onSubmit={handleVerifyPhone}>
              <div>
                <Input label="Country Code" type="text" placeholder="91" value={countryCode} onChange={event => setCountryCode(event.target.value.replace(/[^\d]/g, ''))} required />
                <Input label="Phone Number" type="tel" placeholder="9876543210" value={phone} onChange={event => setPhone(event.target.value.replace(/[^\d]/g, ''))} required />
              </div>
              <Input label="6-Digit SMS Code" type="text" placeholder="Enter SMS code" maxLength={6} value={phoneVerificationCode} onChange={event => setPhoneVerificationCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))} required />
              <div>
                <Button type="submit" variant="primary" disabled={phoneVerifyLoading}>
                  {phoneVerifyLoading ? 'Verifying...' : 'Verify Phone'}
                </Button>
                <Button type="button" variant="outline" onClick={handleSendPhoneCode} disabled={phoneVerificationSendDisabled}>
                  {phoneVerificationSendLabel}
                </Button>
              </div>
            </form>
          </div>
        </Card>}

      {success ? <DismissibleAlert onClose={() => setSuccess('')}>
          {success}
        </DismissibleAlert> : null}
      {error ? <DismissibleAlert onClose={() => setError('')} role="alert">
          {error}
        </DismissibleAlert> : null}

      <form onSubmit={handleSubmit}>
        <Card title="Basic Information">
          <div>
            <FormSectionTitle>Basic Information</FormSectionTitle>
            <Input label="Contact Person Name *" type="text" placeholder="Enter your name" value={name} onChange={event => setName(event.target.value)} required />
            <Input label="Login Email Address *" type="email" placeholder="Enter email address" value={email} onChange={event => setEmail(event.target.value)} required />
            <div>
              <Input label="Phone Number" type="tel" placeholder="Enter phone number" value={phone} onChange={event => setPhone(event.target.value.replace(/[^\d]/g, ''))} />
              <Input label="Country Code" type="text" placeholder="e.g. 91" value={countryCode} onChange={event => setCountryCode(event.target.value.replace(/[^\d]/g, ''))} />
            </div>
            <Input label="Change Password" type="password" placeholder="Leave blank to keep current password" value={password} onChange={event => setPassword(event.target.value)} />
          </div>
        </Card>

        <Card title="Business & Fulfillment">
          <div>
            <FormSectionTitle>Business & Fulfillment</FormSectionTitle>
            <Input label="Store / Brand Name *" type="text" placeholder="E.g. Acme Tech" value={brandName} onChange={event => setBrandName(event.target.value)} required />
            <Input label={isIndianSeller ? 'GSTIN Number *' : 'Tax Registration Number'} type="text" placeholder={isIndianSeller ? '15-digit GST number' : 'Optional tax registration'} maxLength={15} value={gstNumber} onChange={event => setGstNumber(event.target.value)} required={isIndianSeller} />
            <Input label="Country of Origin *" type="text" placeholder="India" value={country} onChange={event => setCountry(event.target.value)} required />
            <Input label="Fulfillment Channels *" type="text" placeholder="Seller Fulfilled, Local Courier" value={fulfillmentChannels} onChange={event => setFulfillmentChannels(event.target.value)} required />
            <Input label="Default Fulfillment Channel *" type="text" placeholder="Seller Fulfilled" value={defaultFulfillmentChannel} onChange={event => setDefaultFulfillmentChannel(event.target.value)} required />
            <div>
              <Input label="Order Acceptance Time *" type="text" placeholder="2 hours" value={shippingAcceptanceTime} onChange={event => setShippingAcceptanceTime(event.target.value)} required />
              <Input label="Handling Time (Business Days)" type="number" min="0" max="30" value={handlingTimeBusinessDays} onChange={event => setHandlingTimeBusinessDays(event.target.value)} />
            </div>
            <Input label="Pickup & Business Address *" as="textarea" rows={4} placeholder="Enter warehouse or store street address" value={address} onChange={event => setAddress(event.target.value)} required />
          </div>
        </Card>

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving Changes...' : 'Save Settings'}
        </Button>
      </form>
    </RightDrawer>;
};
