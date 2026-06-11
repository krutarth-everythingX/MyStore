import React from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { Bell, MailCheck, AlertTriangle, CheckCircle2, ArrowRight, Info } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import './Notifications.css';

export const Notifications = () => {
  const { user } = useAuth();
  const isUnverified = user && !user.email_verified_at;

  return (
    <div className="buyer-layout">
      <Navbar />

      <main className="container notifications-main animate-fade-in">
        <Breadcrumbs items={[{ label: 'Notifications' }]} />
        <div className="notifications-header-row">
          <div className="notifications-title-group">
            <Bell size={24} className="notifications-header-icon" />
            <h1 className="headline-lg">Notifications</h1>
          </div>
          <span className="notifications-count body-lg">
            Active Alerts: {isUnverified ? 1 : 0}
          </span>
        </div>

        <div className="notifications-list">
          {isUnverified ? (
            <Card 
              title="Action Required: Verify Your Email" 
              extra={<span className="notification-tag tag-warning label-md">Pending</span>}
              className="notification-item-card warn-border"
            >
              <div className="notification-body-layout">
                <div className="notification-icon-wrapper warn-bg">
                  <AlertTriangle size={24} style={{ color: 'var(--color-secondary)' }} />
                </div>
                <div className="notification-text-content">
                  <p className="body-lg" style={{ fontWeight: 600 }}>
                    Verification Code Sent to your Device!
                  </p>
                  <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginTop: 4 }}>
                    We sent a 6-digit verification code to your registered email address (**{user.email}**). 
                    To verify your email, go to your profile settings, select the **Verify Email** section, and enter your code.
                  </p>
                  
                  <div className="notification-actions" style={{ marginTop: 16 }}>
                    <Link href="/profile?tab=verify-email" className="btn btn-primary flex-center" style={{ gap: 8, textDecoration: 'none' }}>
                      Verify Now on Profile <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {/* General Welcome/Info Notification (always visible or showing verified state) */}
          <Card 
            title="Account Status: Active" 
            extra={<span className="notification-tag tag-success label-md">System</span>}
            className="notification-item-card success-border"
          >
            <div className="notification-body-layout">
              <div className="notification-icon-wrapper success-bg">
                <CheckCircle2 size={24} style={{ color: '#10b981' }} />
              </div>
              <div className="notification-text-content">
                <p className="body-lg" style={{ fontWeight: 600 }}>
                  Welcome to MyStore!
                </p>
                <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginTop: 4 }}>
                  Your MyStore profile is ready. {isUnverified 
                    ? "Verify your email to unlock checkout access and full seller permissions." 
                    : "Your account is fully verified. Enjoy exploring the marketplace!"}
                </p>
                <div className="notification-actions" style={{ marginTop: 16 }}>
                  <Link href="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                    Explore Products
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
