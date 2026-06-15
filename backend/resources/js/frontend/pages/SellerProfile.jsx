import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  codeActionLabel,
  codeMinutesLeft,
  codeStatus,
  verificationActionLabel,
  verificationCodeStatus,
  verificationMinutesLeft,
} from '../utils/emailVerification';
import './Profile.css';

export const SellerProfile = () => {
  const {
    user,
    updateProfile,
    verifyEmailCode,
    resendVerificationCode,
    sendPhoneVerification,
    verifyPhoneCode,
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

  const channelOptions = useMemo(() => (
    fulfillmentChannels
      .split(',')
      .map((channel) => channel.trim())
      .filter(Boolean)
  ), [fulfillmentChannels]);

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
  }, [user?.verification_code_sent_at]);

  useEffect(() => {
    if (user?.phone_verification_code_sent_at !== phoneVerificationSentAt) {
      setPhoneVerificationSentAt(user?.phone_verification_code_sent_at || null);
    }
  }, [user?.phone_verification_code_sent_at]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        gst_number: gstNumber,
        fulfillment_channels: channelOptions,
        default_fulfillment_channel: defaultFulfillmentChannel,
        shipping_acceptance_time: shippingAcceptanceTime,
        handling_time_business_days: Number(handlingTimeBusinessDays || 1),
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

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
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

  const handleVerifyPhone = async (event) => {
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

  return (
    <div className="seller-dashboard-layout">
      <Sidebar />

      <div className="seller-dashboard-content animate-fade-in">
        <div className="seller-dashboard-container container">
          <div className="seller-page-header">
            <div>
              <h2 className="headline-lg">Store Profile Settings</h2>
              <p className="body-md" style={{ color: 'var(--color-outline)' }}>
                Manage brand, origin country, fulfillment, and login details.
              </p>
            </div>
          </div>

          {!user?.email_verified_at && (
            <Card title="Email Verification Required" className="profile-form-card" style={{ marginBottom: 24, borderColor: 'var(--color-error)' }}>
              <div className="pv-verify-block" style={{ padding: 0 }}>
                <div className="pv-verify-row warn" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255, 152, 0, 0.1)', border: '1px solid var(--color-error)', borderRadius: '4px' }}>
                  <AlertTriangle size={32} style={{ color: 'var(--color-error)' }} />
                  <div>
                    <p className="pv-verify-title" style={{ fontWeight: 600 }}>Your email is not verified</p>
                    <p className="body-sm" style={{ color: 'var(--color-outline)' }}>
                      {verificationStatus === 'unsent'
                        ? `Send a 6-digit verification code to ${user?.email}.`
                        : `Enter the 6-digit verification code sent to ${user?.email}.`}
                    </p>
                    {verificationStatus === 'active' && (
                      <p className="body-sm" style={{ color: 'var(--color-outline)', marginTop: 4 }}>
                        Code expires in {verificationMinutesRemaining} minute{verificationMinutesRemaining === 1 ? '' : 's'}.
                      </p>
                    )}
                  </div>
                </div>

                {verifyError && <div className="pv-toast error" style={{ marginTop: 12 }}>{verifyError}</div>}
                {verifyMsg && <div className="pv-toast success" style={{ marginTop: 12 }}>{verifyMsg}</div>}

                <form onSubmit={handleVerifyEmail} style={{ marginTop: 16 }}>
                  <Input label="6-Digit Verification Code" type="text" placeholder="Enter code" maxLength={6} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required />
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <Button type="submit" variant="primary" disabled={verifyLoading}>{verifyLoading ? 'Verifying...' : 'Verify Code'}</Button>
                    <Button type="button" variant="outline" onClick={handleResendCode} disabled={verificationSendDisabled}>{verificationSendLabel}</Button>
                  </div>
                </form>
              </div>
            </Card>
          )}

          {!user?.phone_verified_at && (
            <Card title="Phone Verification Required" className="profile-form-card" style={{ marginBottom: 24, borderColor: 'var(--color-error)' }}>
              <div className="pv-verify-block" style={{ padding: 0 }}>
                <div className="pv-verify-row warn" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255, 152, 0, 0.1)', border: '1px solid var(--color-error)', borderRadius: '4px' }}>
                  <AlertTriangle size={32} style={{ color: 'var(--color-error)' }} />
                  <div>
                    <p className="pv-verify-title" style={{ fontWeight: 600 }}>Your phone is not verified</p>
                    <p className="body-sm" style={{ color: 'var(--color-outline)' }}>Enter your country calling code and phone number, then send an SMS code.</p>
                    {phoneVerificationStatus === 'active' && (
                      <p className="body-sm" style={{ color: 'var(--color-outline)', marginTop: 4 }}>
                        SMS code expires in {phoneVerificationMinutesRemaining} minute{phoneVerificationMinutesRemaining === 1 ? '' : 's'}.
                      </p>
                    )}
                  </div>
                </div>

                {phoneVerifyError && <div className="pv-toast error" style={{ marginTop: 12 }}>{phoneVerifyError}</div>}
                {phoneVerifyMsg && <div className="pv-toast success" style={{ marginTop: 12 }}>{phoneVerifyMsg}</div>}

                <form onSubmit={handleVerifyPhone} style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Input label="Country Code" type="text" placeholder="91" value={countryCode} onChange={(event) => setCountryCode(event.target.value.replace(/[^\d]/g, ''))} required />
                    <Input label="Phone Number" type="tel" placeholder="9876543210" value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^\d]/g, ''))} required />
                  </div>
                  <Input label="6-Digit SMS Code" type="text" placeholder="Enter SMS code" maxLength={6} value={phoneVerificationCode} onChange={(event) => setPhoneVerificationCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))} required />
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <Button type="submit" variant="primary" disabled={phoneVerifyLoading}>{phoneVerifyLoading ? 'Verifying...' : 'Verify Phone'}</Button>
                    <Button type="button" variant="outline" onClick={handleSendPhoneCode} disabled={phoneVerificationSendDisabled}>{phoneVerificationSendLabel}</Button>
                  </div>
                </form>
              </div>
            </Card>
          )}

          <Card title="Edit Store Details" className="profile-form-card">
            {success && <div className="profile-alert profile-alert-success body-md">{success}</div>}
            {error && <div className="profile-alert profile-alert-error body-md">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="profile-form-grid">
                <div className="profile-form-section">
                  <h4 className="profile-section-title title-lg">Basic Information</h4>
                  <Input label="Contact Person Name *" type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required />
                  <Input label="Login Email Address *" type="email" placeholder="Enter email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <Input label="Phone Number" type="tel" placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))} />
                  <Input label="Country Code" type="text" placeholder="e.g. 91" value={countryCode} onChange={(e) => setCountryCode(e.target.value.replace(/[^\d]/g, ''))} />
                  <Input label="Change Password" type="password" placeholder="Leave blank to keep current password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                <div className="profile-form-section">
                  <h4 className="profile-section-title title-lg">Business & Fulfillment</h4>
                  <Input label="Store / Brand Name *" type="text" placeholder="E.g. Acme Tech" value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
                  <Input label="GSTIN Number *" type="text" placeholder="15-digit GST number" maxLength={15} value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} required />
                  <Input label="Country of Origin *" type="text" placeholder="India" value={country} onChange={(e) => setCountry(e.target.value)} required />
                  <Input label="Fulfillment Channels *" type="text" placeholder="Seller Fulfilled, Local Courier" value={fulfillmentChannels} onChange={(e) => setFulfillmentChannels(e.target.value)} required />
                  <Input label="Default Fulfillment Channel *" type="text" placeholder="Seller Fulfilled" value={defaultFulfillmentChannel} onChange={(e) => setDefaultFulfillmentChannel(e.target.value)} required />
                  <Input label="Order Acceptance Time *" type="text" placeholder="2 hours" value={shippingAcceptanceTime} onChange={(e) => setShippingAcceptanceTime(e.target.value)} required />
                  <Input label="Handling Time (Business Days)" type="number" min="0" max="30" value={handlingTimeBusinessDays} onChange={(e) => setHandlingTimeBusinessDays(e.target.value)} />
                  <div className="input-container">
                    <label className="input-label label-md">Pickup & Business Address *</label>
                    <textarea className="input-field profile-textarea" rows="4" placeholder="Enter warehouse or store street address" value={address} onChange={(e) => setAddress(e.target.value)} required />
                  </div>
                </div>
              </div>

              <Button type="submit" variant="primary" className="profile-save-btn" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Settings'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
