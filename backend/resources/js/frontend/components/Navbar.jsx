import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Layout, Search, Menu, X, Home as HomeIcon, Bell } from 'lucide-react';
import './Navbar.css';

export const Navbar = ({ onSearch, opaque = false }) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { url } = usePage();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const params = new URL(url, window.location.origin).searchParams;
    setSearchQuery(params.get('search') || '');
  }, [url]);

  // Glassmorphic scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hasUnreadNotification = user && !user.email_verified_at;
  const navItems = [
    {
      label: 'Home',
      href: '/',
      active: url === '/',
    },
    {
      label: 'Shop',
      href: '/?explore=true',
      active: url.includes('explore=true') || url.includes('category=') || url.includes('search='),
    },
    {
      label: 'Categories',
      href: '/categories',
      active: url.startsWith('/categories'),
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.avatar-dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.get('/', { search: searchQuery || undefined }, {
        preserveScroll: true,
        preserveState: true,
        only: ['products', 'categories', 'brands'],
      });
    }
  };

  const handleLogoutClick = async () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) await logout();
    setDropdownOpen(false);
  };

  const navClasses = [
    'navbar-header',
    scrolled ? 'scrolled' : '',
    opaque ? 'opaque' : '',
  ].filter(Boolean).join(' ');

  return (
    <header className={navClasses}>
      <div className="navbar-container container">
        <Link href="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
          <span className="navbar-logo-text">MyStore</span>
          <span className="navbar-logo-tag">Editorial commerce</span>
        </Link>

        <div className={`navbar-center ${mobileMenuOpen ? 'navbar-center-mobile-open' : ''}`}>
          <nav className="navbar-nav">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-link ${item.active ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form className="navbar-search navbar-search-mobile" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search the collection"
              className="navbar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="navbar-search-btn">
              <Search size={16} />
            </button>
          </form>

          {!user && (
            <div className="mobile-auth-links">
              <Link href="/login" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
              <Link href="/register" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>

        <div className="navbar-utility">
          <form className="navbar-search navbar-search-desktop" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search the collection"
              className="navbar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="navbar-search-btn">
              <Search size={16} />
            </button>
          </form>

          <div className="navbar-actions">
            {user?.role === 'buyer' ? (
              <Link href="/" className="nav-home-icon-link" title="Home">
                <HomeIcon size={18} />
              </Link>
            ) : (
              <Link href="/seller" className="nav-home-icon-link" title="Seller Panel">
                <Layout size={18} />
              </Link>
            )}

            {(!user || user.role !== 'seller') && (
              <Link href="/cart" className="nav-cart-link" onClick={() => setMobileMenuOpen(false)}>
                <ShoppingCart size={18} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            )}

            {user && (
              <Link
                href="/notifications"
                className="nav-cart-link"
                onClick={() => setMobileMenuOpen(false)}
                title="Notifications"
              >
                <Bell size={18} />
                {hasUnreadNotification && <span className="notification-dot" />}
              </Link>
            )}

            {user ? (
              <div className="avatar-dropdown-container">
                <button className="avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <div className="avatar-circle">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>
                {dropdownOpen && (
                  <div className="avatar-dropdown shadow-lg">
                    <Link href="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      Profile
                    </Link>
                    <Link href="/notifications" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      Notifications
                    </Link>
                    <button className="dropdown-item logout-btn" onClick={handleLogoutClick}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="desktop-auth-links">
                <Link href="/login" className="nav-link">Login</Link>
                <Link href="/register" className="nav-link">Register</Link>
              </div>
            )}
          </div>
        </div>

        <button className="navbar-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
