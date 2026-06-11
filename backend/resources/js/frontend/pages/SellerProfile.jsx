import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import './Profile.css';

export const SellerProfile = () => {
  const { user, updateProfile, verifyEmailCode, resendVerificationCode } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [brandName, setBrandName] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [shiprocketEmail, setShiprocketEmail] = useState('');
  const [shiprocketPassword, setShiprocketPassword] = useState('');

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Email Verification ──
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBrandName(user.brand_name || '');
      setAddress(user.address || '');
      setGstNumber(user.gst_number || '');
      setShiprocketEmail(user.shiprocket_email || '');
      setShiprocketPassword(user.shiprocket_password || '');
    }
  }, [user?.id]);

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
        brand_name: brandName,
        address,
        gst_number: gstNumber,
        shiprocket_email: shiprocketEmail,
        shiprocket_password: shiprocketPassword,
      };

      if (password) {
        updateData.password = password;
      }

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
      setVerifyMsg(data.message || 'Verification code resent successfully!');
    } catch (err) {
      setVerifyError(err.message || 'Failed to resend code');
    }
  };

  return (
    <div className="seller-dashboard-layout">
      <Sidebar />

      <div className="seller-dashboard-content animate-fade-in">
        <div className="seller-dashboard-container container">
          {/* Header */}
          <div className="seller-page-header">
            <div>
              <h2 className="headline-lg">Store Profile Settings</h2>
              <p className="body-md" style={{ color: 'var(--color-outline)' }}>
                Manage your store/brand details and login credentials.
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
                    <p className="body-sm" style={{ color: 'var(--color-outline)' }}>Please enter the 6-digit verification code sent to {user?.email}.</p>
                  </div>
                </div>
                
                {verifyError && <div className="pv-toast error" style={{ marginTop: 12 }}>{verifyError}</div>}
                {verifyMsg && <div className="pv-toast success" style={{ marginTop: 12 }}>{verifyMsg}</div>}
                
                <form onSubmit={handleVerifyEmail} style={{ marginTop: 16 }}>
                  <Input
                    label="6-Digit Verification Code"
                    type="text"
                    placeholder="Enter code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <Button type="submit" variant="primary" disabled={verifyLoading}>
                      {verifyLoading ? 'Verifying...' : 'Verify Code'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleResendCode}>
                      Resend Code
                    </Button>
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
                  <Input
                    label="Contact Person Name *"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Login Email Address *"
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Input
                    label="Change Password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="profile-form-section">
                  <h4 className="profile-section-title title-lg">Business & Brand details</h4>
                  <Input
                    label="Store / Brand Name *"
                    type="text"
                    placeholder="E.g. Acme Tech"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    required
                  />
                  <Input
                    label="GSTIN Number *"
                    type="text"
                    placeholder="15-digit GST number"
                    maxLength={15}
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Input
                      label="Shiprocket Email"
                      type="email"
                      placeholder="Shiprocket email address"
                      value={shiprocketEmail}
                      onChange={(e) => setShiprocketEmail(e.target.value)}
                    />
                    <Input
                      label="Shiprocket Password"
                      type="password"
                      placeholder="••••••••"
                      value={shiprocketPassword}
                      onChange={(e) => setShiprocketPassword(e.target.value)}
                    />
                  </div>
                  <div className="input-container">
                    <label className="input-label label-md">Pickup & Business Address *</label>
                    <textarea
                      className="input-field profile-textarea"
                      rows="4"
                      placeholder="Enter warehouse or store street address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="profile-save-btn"
                disabled={loading}
              >
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
