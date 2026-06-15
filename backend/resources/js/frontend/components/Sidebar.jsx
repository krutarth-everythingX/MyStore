import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, Warehouse, ShoppingCart, LogOut, Settings, Menu, X } from 'lucide-react';
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

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { url } = usePage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = normalizePath(new URL(url || window.location.href, window.location.origin).pathname);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
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
    {
      href: '/seller/profile',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <>
      <header className="seller-mobile-navbar">
        <Link href="/seller" className="seller-mobile-brand" onClick={() => setMobileMenuOpen(false)}>
          <span className="seller-mobile-brand-title">MyStore Seller</span>
          {user?.brand_name && <span>{user.brand_name}</span>}
        </Link>

        <button
          type="button"
          className="seller-mobile-menu-btn"
          aria-label={mobileMenuOpen ? 'Close seller menu' : 'Open seller menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="seller-mobile-menu-panel">
          <nav className="seller-mobile-menu">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`seller-mobile-nav-item label-md ${isActivePath(pathname, item.href, item.end) ? 'seller-mobile-nav-active' : ''}`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}

            <button onClick={handleLogout} className="seller-mobile-nav-item seller-mobile-logout label-md">
              <LogOut size={18} />
              Logout
            </button>
          </nav>
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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item label-md ${isActivePath(pathname, item.href, item.end) ? 'sidebar-item-active' : ''}`}
              >
                <Icon size={18} className="sidebar-icon" />
                {item.label}
              </Link>
            );
          })}

          <div className="sidebar-divider"></div>

          <button onClick={handleLogout} className="sidebar-item sidebar-btn label-md">
            <LogOut size={18} className="sidebar-icon" />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
};
