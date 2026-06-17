import React, { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, Warehouse, ShoppingCart, LogOut, User, Menu, X, Search, FolderTree } from 'lucide-react';
import { ProfileDrawer } from './ProfileDrawer';
import { CategoryDrawer } from './CategoryDrawer';
import './Sidebar.css';

const normalizePath = (path) => {
  if (!path) {
    return '/';
  }

  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
};

const isActivePath = (pathname, target, end = false) => {
  const current = normalizePath(pathname);
  const expected = normalizePath(target);

  return end
    ? current === expected
    : current === expected || current.startsWith(`${expected}/`);
};

const MOBILE_MENU_ANIMATION_MS = 320;

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { url } = usePage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const mobileMenuCloseTimeout = useRef(null);
  const pathname = normalizePath(new URL(url || window.location.href, window.location.origin).pathname);

  useEffect(() => {
    return () => {
      if (mobileMenuCloseTimeout.current) {
        window.clearTimeout(mobileMenuCloseTimeout.current);
      }
    };
  }, []);

  const openMobileMenu = () => {
    if (mobileMenuCloseTimeout.current) {
      window.clearTimeout(mobileMenuCloseTimeout.current);
      mobileMenuCloseTimeout.current = null;
    }

    setMobileMenuClosing(false);
    setMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    if (mobileMenuCloseTimeout.current) {
      window.clearTimeout(mobileMenuCloseTimeout.current);
    }

    if (!mobileMenuOpen) {
      return;
    }

    setMobileMenuClosing(true);
    mobileMenuCloseTimeout.current = window.setTimeout(() => {
      setMobileMenuOpen(false);
      setMobileMenuClosing(false);
      mobileMenuCloseTimeout.current = null;
    }, MOBILE_MENU_ANIMATION_MS);
  };

  const toggleMobileMenu = () => {
    if (mobileMenuOpen && !mobileMenuClosing) {
      closeMobileMenu();
      return;
    }

    openMobileMenu();
  };

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
  };

  const navItems = [
    {
      href: '/seller',
      label: 'Overview',
      icon: LayoutDashboard,
      end: true,
    },
    {
      href: '/seller/products',
      label: 'Products',
      icon: ShoppingBag,
    },
    {
      href: '/seller/inventory',
      label: 'Inventory',
      icon: Warehouse,
    },
    {
      href: '/seller/orders',
      label: 'Orders',
      icon: ShoppingCart,
    },
  ];

  return (
    <>
      <header className="seller-mobile-navbar">
        <Link href="/seller" className="seller-mobile-brand" onClick={closeMobileMenu}>
          <span className="seller-mobile-brand-title">MyStore Seller</span>
          {user?.brand_name && <span>{user.brand_name}</span>}
        </Link>

        <button
          type="button"
          className="seller-mobile-menu-btn"
          aria-label={mobileMenuOpen && !mobileMenuClosing ? 'Close seller menu' : 'Open seller menu'}
          aria-expanded={mobileMenuOpen && !mobileMenuClosing}
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen && !mobileMenuClosing ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className={`seller-mobile-menu-panel ${mobileMenuClosing ? 'is-closing' : 'is-open'}`} onClick={closeMobileMenu}>
          <div className="seller-mobile-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="seller-mobile-drawer-header">
              <span>Menu</span>
              <button
                type="button"
                className="seller-mobile-drawer-close"
                aria-label="Close seller menu"
                onClick={closeMobileMenu}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="seller-mobile-menu">
              {navItems.map((item) => (
                item.href ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`seller-mobile-nav-item label-md ${isActivePath(pathname, item.href, item.end) ? 'seller-mobile-nav-active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => { closeMobileMenu(); item.onClick(); }}
                    className="seller-mobile-nav-item label-md"
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                  >
                    {item.label}
                  </button>
                )
              ))}
            </nav>

            <div className="seller-mobile-account">
              {user && (
                <div className="seller-mobile-user-card">
                  <div className="seller-mobile-avatar">
                    {(user.name || user.brand_name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div className="seller-mobile-user-text">
                    <span>{user.name || user.brand_name || 'Seller'}</span>
                    <small>{user.email}</small>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="seller-mobile-profile-link label-md"
                onClick={() => { closeMobileMenu(); setIsProfileOpen(true); }}
                style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
              >
                My Profile
              </button>

              <button onClick={handleLogout} className="seller-mobile-logout label-md">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="seller-sidebar">
        <div className="sidebar-brand">
          <Link href="/" className="sidebar-brand-link">
            <span className="sidebar-brand-name title-lg">MyStore Seller</span>
          </Link>
          {user && <span className="sidebar-seller-name label-md">{user.brand_name}</span>}
        </div>

        <nav className="sidebar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return item.href ? (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item label-md ${isActivePath(pathname, item.href, item.end) ? 'sidebar-item-active' : ''}`}
              >
                <Icon size={18} className="sidebar-icon" />
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={`sidebar-item label-md ${item.label === 'Categories' && isCategoryOpen ? 'sidebar-item-active' : ''}`}
                style={{ justifyContent: 'flex-start' }}
              >
                <Icon size={18} className="sidebar-icon" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ padding: '12px', borderTop: 'var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
          <button onClick={() => setIsProfileOpen(true)} className={`sidebar-item label-md ${isProfileOpen ? 'sidebar-item-active' : ''}`}>
            <User size={18} className="sidebar-icon" />
            My Profile
          </button>

          <button onClick={handleLogout} className="sidebar-item sidebar-btn label-md">
            <LogOut size={18} className="sidebar-icon" />
            Logout
          </button>
        </div>
      </aside>
      
      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <CategoryDrawer isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} />
    </>
  );
};
