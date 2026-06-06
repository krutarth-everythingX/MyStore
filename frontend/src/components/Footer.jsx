import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Globe, Send, Camera, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="store-footer">
      <div className="container footer-grid">
        {/* Brand Column */}
        <div className="footer-col brand-col">
          <Link to="/" className="footer-logo">
            <ShoppingBag size={24} className="footer-logo-icon" />
            <span className="footer-logo-text">MyStore</span>
          </Link>
          <p className="footer-desc body-md">
            Your premium marketplace for verified independent sellers. Manage your orders, warehouses, and checkout seamlessly.
          </p>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn"><Globe size={18} /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn"><Send size={18} /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn"><Camera size={18} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h5 className="footer-title label-md">Shop Department</h5>
          <ul className="footer-links">
            <li><Link to="/?category=1">Electronics</Link></li>
            <li><Link to="/?category=2">Fashion</Link></li>
            <li><Link to="/?category=3">Baby Products</Link></li>
            <li><Link to="/?category=4">Toys & Games</Link></li>
            <li><Link to="/categories">All Categories</Link></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div className="footer-col">
          <h5 className="footer-title label-md">Support</h5>
          <ul className="footer-links">
            <li><Link to="/profile">My Account</Link></li>
            <li><Link to="/orders">Order History</Link></li>
            <li><Link to="/cart">Shopping Cart</Link></li>
            <li><a href="#faq">Frequently Asked Questions</a></li>
            <li><a href="#privacy">Privacy & Terms</a></li>
          </ul>
        </div>

        {/* Contact info / Newsletter */}
        <div className="footer-col newsletter-col">
          <h5 className="footer-title label-md">Subscribe & Connect</h5>
          <p className="body-md footer-newsletter-desc">Sign up for special offers and seller announcements.</p>
          <form className="footer-newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="footer-newsletter-input" required />
            <button type="submit" className="footer-newsletter-btn">Join</button>
          </form>
          <div className="contact-details" style={{ marginTop: '20px' }}>
            <div className="contact-item body-md">
              <Phone size={14} /> <span>+1 (800) 123-4567</span>
            </div>
            <div className="contact-item body-md">
              <Mail size={14} /> <span>support@mystore.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <span className="copyright body-sm">&copy; {new Date().getFullYear()} MyStore Inc. All rights reserved.</span>
          <div className="payment-badges">
            <span className="payment-badge">Visa</span>
            <span className="payment-badge">Mastercard</span>
            <span className="payment-badge">Amex</span>
            <span className="payment-badge">PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
