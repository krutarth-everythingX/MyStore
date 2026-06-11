import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { Link, router, usePage } from '@inertiajs/react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  User, ShoppingBag, Heart, MailCheck, Clock, Settings, MapPin,
  MessageSquare, HelpCircle, LogOut, Package, Calendar,
  CreditCard, Truck, CheckCircle2, Star, AlertTriangle,
  Edit3, ChevronDown, ChevronUp
} from 'lucide-react';
import './Profile.css';

/* ──────────────────────────────────────────────────────────── */
/* Buyer Profile Page — Vertical single-column layout           */
/* ──────────────────────────────────────────────────────────── */
export const Profile = () => {
  const { props } = usePage();
  const { user, logout, updateProfile, verifyEmailCode, resendVerificationCode } = useAuth();
  const { wishlist } = useWishlist();
  const { showToast } = useToast();

  // Which accordion section is open
  const [openSection, setOpenSection] = useState('orders');

  // ── Orders ──
  const [orders, setOrders] = useState(props.buyerOrders || []);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── Recently Viewed ──
  const [recentlyViewed, setRecentlyViewed] = useState(props.recentlyViewed || []);
  const [rvLoading, setRvLoading] = useState(false);

  // ── Edit Profile ──
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Email Verification ──
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // ── Address Details ──
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [addrSuccess, setAddrSuccess] = useState('');
  const [addrLoading, setAddrLoading] = useState(false);

  // ── Verify Email ──
  const [verifyMsg, setVerifyMsg] = useState('');

  // ── Logout confirm ──
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setStateName(user.state || '');
      setCountry(user.country || '');
      setPincode(user.pincode || '');
      setCountryCode(user.country_code || '');
    }
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      setOpenSection(tab);
      // Scroll to verify email section if that's the tab
      setTimeout(() => {
        const element = document.getElementById(tab);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    setOrders(Array.isArray(props.buyerOrders) ? props.buyerOrders : []);
    setRecentlyViewed(Array.isArray(props.recentlyViewed) ? props.recentlyViewed : []);
    setOrdersLoading(false);
    setRvLoading(false);
  }, [props.buyerOrders, props.recentlyViewed]);

  const toggleSection = (id) => setOpenSection((prev) => (prev === id ? '' : id));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess(''); setProfileError(''); setProfileLoading(true);
    try {
      const data = {
        name,
        email,
        phone,
        country_code: countryCode,
        address,
        city,
        state: stateName,
        country,
        pincode
      };
      if (password) data.password = password;
      await updateProfile(data);
      setProfileSuccess('Profile updated successfully!');
      showToast('Profile settings updated successfully!', 'success');
      setPassword('');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddrSuccess(''); setAddrLoading(true);
    try {
      await updateProfile({
        name,
        email,
        phone,
        country_code: countryCode,
        address,
        city,
        state: stateName,
        country,
        pincode
      });
      setAddrSuccess('Address saved!');
      showToast('Delivery address updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save address', 'error');
    }
    finally { setAddrLoading(false); }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setVerifyError('');
    setVerifyMsg('');
    setVerifyLoading(true);
    try {
      await verifyEmailCode(verificationCode);
      setVerifyMsg('Email verified successfully!');
      showToast('Email verified successfully! Welcome to MyStore.', 'success');
      setVerificationCode('');
    } catch (err) {
      setVerifyError(err.message || 'Verification failed');
      showToast(err.message || 'Verification failed', 'error');
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
      showToast(data.message || 'Verification code resent successfully.', 'success');
    } catch (err) {
      setVerifyError(err.message || 'Failed to resend code');
      showToast(err.message || 'Failed to resend code', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.visit('/');
  };

  const getStatusClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  // ─── Seller stays unchanged ───
  if (user?.role === 'seller') {
    return (
      <div className="seller-dashboard-layout">
        <Sidebar />
        <div className="seller-dashboard-content">
          <div className="seller-dashboard-container container">
            <div className="seller-page-header"><h2 className="headline-lg">Settings</h2></div>
            <SellerSettingsForm user={user} updateProfile={updateProfile} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buyer-layout">
      <Navbar />

      <main className="pv-main">
        <div className="pv-container container">
          <Breadcrumbs items={[{ label: 'My Account' }]} />

          {/* ── User Info Card ── */}
          <div className="pv-user-card">
            <div className="pv-avatar">
              <span className="pv-avatar-letter">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="pv-user-details">
              <p className="pv-user-name">{user?.name}</p>
              <p className="pv-user-email body-sm">{user?.email}</p>
              <span className="pv-user-role label-md">Buyer Account</span>
            </div>
          </div>

          {/* ── Accordion Sections ── */}
          <div className="pv-sections">

            {/* ORDERS */}
            <Section id="orders" icon={ShoppingBag} label="My Orders" badge={orders.length} openSection={openSection} toggleSection={toggleSection}>
              {ordersLoading ? (
                <div className="pv-loading">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="pv-empty-state">
                  <Package size={40} className="pv-empty-icon" />
                  <p>No orders placed yet.</p>
                  <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Start Shopping</Link>
                </div>
              ) : (
                <div className="pv-orders-list">
                  {orders.map((order) => (
                    <div key={order.id} className="pv-order-card">
                      <div className="pv-oc-header">
                        <span className="pv-oc-id label-md">Order #{order.id}</span>
                        <span className={`order-status-badge label-md ${getStatusClass(order.status)}`}>{order.status}</span>
                      </div>
                      <div className="pv-oc-meta body-sm">
                        <span><Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()}</span>
                        <span><CreditCard size={12} /> {order.payment_method}</span>
                        {order.shipping_carrier && (
                          <span><Truck size={12} /> {order.shipping_carrier} — {order.tracking_number || 'Awaiting'}</span>
                        )}
                      </div>
                      <div className="pv-oc-items">
                        {order.items?.map((item) => (
                          <div key={item.id} className="pv-oc-item body-sm">
                            <span className="pv-oci-name">{item.product?.name || 'Product removed'}</span>
                            <span className="pv-oci-qty">×{item.quantity}</span>
                            <span className="pv-oci-price">${parseFloat(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pv-oc-footer">
                        <span className="label-md" style={{ color: 'var(--color-outline)' }}>Total</span>
                        <span className="title-lg" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                          ${parseFloat(order.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* WISHLIST */}
            <Section id="wishlist" icon={Heart} label="Wishlist" badge={wishlist.length} openSection={openSection} toggleSection={toggleSection}>
              {wishlist.length === 0 ? (
                <div className="pv-empty-state">
                  <Heart size={40} className="pv-empty-icon" />
                  <p>Your wishlist is empty.</p>
                  <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Browse Products</Link>
                </div>
              ) : (
                <div className="pv-product-grid">
                  {wishlist.map((item) => {
                    const prod = item.product;
                    if (!prod) return null;
                    const price = prod.sale_price ?? prod.regular_price;
                    return (
                      <Link href={`/products/${prod.id}`} key={item.id} className="pv-product-tile">
                        <div className="pv-pt-image flex-center">
                          <span className="pv-pt-letter">{prod.name?.charAt(0)}</span>
                        </div>
                        <div className="pv-pt-info">
                          <p className="pv-pt-name body-sm">{prod.name}</p>
                          <span className="pv-pt-price">${parseFloat(price).toFixed(2)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* VERIFY EMAIL */}
            <Section id="verify-email" icon={MailCheck} label="Verify Email" openSection={openSection} toggleSection={toggleSection}>
              <div className="pv-verify-block">
                {user?.email_verified_at ? (
                  <div className="pv-verify-row success">
                    <CheckCircle2 size={32} />
                    <div>
                      <p className="pv-verify-title">Email Verified</p>
                      <p className="body-sm" style={{ color: 'var(--color-outline)' }}>{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="pv-verify-row warn">
                      <AlertTriangle size={32} />
                      <div>
                        <p className="pv-verify-title">Email not verified</p>
                        <p className="body-sm" style={{ color: 'var(--color-outline)' }}>{user?.email}</p>
                      </div>
                    </div>
                    
                    {verifyError && <div className="pv-toast error" style={{ marginTop: 12 }}>{verifyError}</div>}
                    
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
                  </>
                )}
                {verifyMsg && <div className="pv-toast success" style={{ marginTop: 12 }}>{verifyMsg}</div>}
              </div>
            </Section>

            {/* RECENTLY VIEWED */}
            <Section id="recently-viewed" icon={Clock} label="Recently Viewed" openSection={openSection} toggleSection={toggleSection}>
              {rvLoading ? (
                <div className="pv-loading">Loading...</div>
              ) : recentlyViewed.length === 0 ? (
                <div className="pv-empty-state">
                  <Clock size={40} className="pv-empty-icon" />
                  <p>No recently viewed products.</p>
                  <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Go Shopping</Link>
                </div>
              ) : (
                <div className="pv-product-grid">
                  {recentlyViewed.map((item) => {
                    const prod = item.product;
                    if (!prod) return null;
                    const price = prod.sale_price ?? prod.regular_price;
                    return (
                      <Link href={`/products/${prod.id}`} key={item.id} className="pv-product-tile">
                        <div className="pv-pt-image flex-center">
                          <span className="pv-pt-letter">{prod.name?.charAt(0)}</span>
                        </div>
                        <div className="pv-pt-info">
                          <p className="pv-pt-name body-sm">{prod.name}</p>
                          <span className="pv-pt-price">${parseFloat(price).toFixed(2)}</span>
                          <span className="pv-pt-viewed body-sm">
                            {new Date(item.viewed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* ACCOUNT SETTINGS */}
            <Section id="account-settings" icon={Settings} label="Account Settings" openSection={openSection} toggleSection={toggleSection}>
              {/* Sub-tab row inside section */}
              <AccountSettings
                name={name} setName={setName}
                email={email} setEmail={setEmail}
                phone={phone} setPhone={setPhone}
                countryCode={countryCode} setCountryCode={setCountryCode}
                password={password} setPassword={setPassword}
                profileSuccess={profileSuccess} profileError={profileError}
                profileLoading={profileLoading} handleSaveProfile={handleSaveProfile}
                address={address} setAddress={setAddress}
                city={city} setCity={setCity}
                stateName={stateName} setStateName={setStateName}
                country={country} setCountry={setCountry}
                pincode={pincode} setPincode={setPincode}
                addrSuccess={addrSuccess} addrLoading={addrLoading}
                handleSaveAddress={handleSaveAddress}
              />
            </Section>

            {/* MY ACTIVITY */}
            <Section id="my-activity" icon={Star} label="My Activity" openSection={openSection} toggleSection={toggleSection}>
              <ActivitySection />
            </Section>

            {/* LOGOUT */}
            <div className="pv-section">
              <button
                className="pv-section-header danger"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <span className="pv-section-icon"><LogOut size={18} /></span>
                <span className="pv-section-label">Log Out</span>
              </button>
            </div>

          </div>{/* end pv-sections */}
        </div>{/* end pv-container */}

        {/* ── Logout Confirm Modal ── */}
        {showLogoutConfirm && (
          <div className="pv-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
            <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
              <LogOut size={28} style={{ color: '#d32f2f' }} />
              <h4 className="pv-modal-title">Log out of MyStore?</h4>
              <p className="body-md pv-modal-sub">You will need to sign in again to access your account.</p>
              <div className="pv-modal-actions">
                <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={handleLogout}
                  style={{ background: '#d32f2f', borderColor: '#d32f2f' }}
                >
                  Yes, Log Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

/* ─── Accordion Section Component ─── */
const Section = ({ id, icon: Icon, label, badge, openSection, toggleSection, children }) => {
  const open = openSection === id;
  return (
    <div className={`pv-section ${open ? 'open' : ''}`}>
      <button className="pv-section-header" onClick={() => toggleSection(id)}>
        <span className="pv-section-icon"><Icon size={18} /></span>
        <span className="pv-section-label">{label}</span>
        {badge != null && badge > 0 && (
          <span className="pv-section-badge">{badge}</span>
        )}
        <span className="pv-section-chevron">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && <div className="pv-section-body">{children}</div>}
    </div>
  );
};

/* ── Account Settings inner component with sub-tabs ── */
const AccountSettings = ({
  name, setName, email, setEmail, phone, setPhone, countryCode, setCountryCode,
  password, setPassword, profileSuccess, profileError, profileLoading, handleSaveProfile,
  address, setAddress, city, setCity, stateName, setStateName, country, setCountry,
  pincode, setPincode, addrSuccess, addrLoading, handleSaveAddress,
}) => {
  const [sub, setSub] = useState('edit-profile');
  const isProfileIncomplete = !phone || !address || !city || !stateName || !country || !pincode;

  return (
    <div>
      {isProfileIncomplete && (
        <div className="pv-toast info" style={{ marginBottom: 16, borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-primary)' }} />
            <strong className="body-md">Complete your profile details (Phone, Address, City, State/Region, Country, Pincode) to enable faster one-click checkout.</strong>
          </div>
        </div>
      )}

      <div className="pv-subtab-bar">
        <button className={`pv-subtab-btn ${sub === 'edit-profile' ? 'active' : ''}`} onClick={() => setSub('edit-profile')}>
          <Edit3 size={13} /> Edit Profile
        </button>
        <button className={`pv-subtab-btn ${sub === 'saved-addresses' ? 'active' : ''}`} onClick={() => setSub('saved-addresses')}>
          <MapPin size={13} /> Saved Addresses
        </button>
      </div>

      {sub === 'edit-profile' && (
        <div className="pv-form-block">
          {profileSuccess && <div className="pv-toast success">{profileSuccess}</div>}
          {profileError && <div className="pv-toast error">{profileError}</div>}
          <form onSubmit={handleSaveProfile} className="pv-form">
            <Input label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 2 }}>
                <Input label="Phone Number" type="tel" placeholder="e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <Input label="Phone Country" type="text" placeholder="e.g. India" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} />
              </div>
            </div>

            <Input label="New Password (leave blank to keep current)" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" variant="primary" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
      )}

      {sub === 'saved-addresses' && (
        <div className="pv-form-block">
          {addrSuccess && <div className="pv-toast success">{addrSuccess}</div>}
          <form onSubmit={handleSaveAddress} className="pv-form">
            <div className="input-container">
              <label className="input-label label-md">Street Address</label>
              <textarea
                className="input-field pv-textarea"
                rows={2}
                placeholder="Enter street name, building number, and area"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <Input label="City" type="text" placeholder="e.g. Mumbai" value={city} onChange={(e) => setCity(e.target.value)} required />
              <Input label="State / Region" type="text" placeholder="e.g. Maharashtra" value={stateName} onChange={(e) => setStateName(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Input label="Country" type="text" placeholder="e.g. India" value={country} onChange={(e) => setCountry(e.target.value)} required />
              <Input label="Pincode" type="text" placeholder="e.g. 400001" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
            </div>

            <Button type="submit" variant="primary" disabled={addrLoading}>
              {addrLoading ? 'Saving...' : 'Save Address'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

/* ── My Activity inner component ── */
const ActivitySection = () => {
  const [sub, setSub] = useState('reviews');
  return (
    <div>
      <div className="pv-subtab-bar">
        <button className={`pv-subtab-btn ${sub === 'reviews' ? 'active' : ''}`} onClick={() => setSub('reviews')}>
          <MessageSquare size={13} /> My Reviews
        </button>
        <button className={`pv-subtab-btn ${sub === 'qna' ? 'active' : ''}`} onClick={() => setSub('qna')}>
          <HelpCircle size={13} /> Q&amp;A
        </button>
      </div>
      <div className="pv-form-block">
        {sub === 'reviews' && (
          <div className="pv-empty-state">
            <Star size={36} className="pv-empty-icon" />
            <p>You haven't reviewed any products yet.</p>
          </div>
        )}
        {sub === 'qna' && (
          <div className="pv-empty-state">
            <HelpCircle size={36} className="pv-empty-icon" />
            <p>You haven't asked any questions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Seller Settings Form (unchanged) ── */
const SellerSettingsForm = ({ user, updateProfile }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [brandName, setBrandName] = useState(user?.brand_name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [gstNumber, setGstNumber] = useState(user?.gst_number || '');
  const [shiprocketEmail, setShiprocketEmail] = useState(user?.shiprocket_email || '');
  const [shiprocketPassword, setShiprocketPassword] = useState(user?.shiprocket_password || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(''); setError(''); setLoading(true);
    try {
      const data = { 
        name, 
        email, 
        phone, 
        brand_name: brandName, 
        address,
        gst_number: gstNumber,
        shiprocket_email: shiprocketEmail,
        shiprocket_password: shiprocketPassword
      };
      if (password) data.password = password;
      await updateProfile(data);
      setSuccess('Settings saved!');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pv-form-card card" style={{ maxWidth: 560, padding: 24 }}>
      {success && <div className="pv-toast success">{success}</div>}
      {error && <div className="pv-toast error">{error}</div>}
      <form onSubmit={handleSubmit} className="pv-form">
        <Input label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input label="Store / Brand Name" type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
        <Input label="GSTIN Number *" type="text" maxLength={15} value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} required />
        <div style={{ display: 'flex', gap: 12 }}>
          <Input label="Shiprocket Email" type="email" value={shiprocketEmail} onChange={(e) => setShiprocketEmail(e.target.value)} />
          <Input label="Shiprocket Password" type="password" placeholder="••••••••" value={shiprocketPassword} onChange={(e) => setShiprocketPassword(e.target.value)} />
        </div>
        <div className="input-container">
          <label className="input-label label-md">Business Address</label>
          <textarea className="input-field pv-textarea" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Saving...' : 'Save Settings'}</Button>
      </form>
    </div>
  );
};

export default Profile;
