import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, Warehouse, ShoppingCart, LogOut, Settings, Menu, X, Search, FolderTree } from 'lucide-react';
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
  const [menuSearch, setMenuSearch] = useState('');
  const pathname = normalizePath(new URL(url || window.location.href, window.location.origin).pathname);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    setMenuSearch('');
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
      href: '/seller/categories',
      label: 'Categories',
      icon: FolderTree,
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

  const visibleMobileNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(menuSearch.trim().toLowerCase())
  );

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMenuSearch('');
  };

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
          aria-label={mobileMenuOpen ? 'Close seller menu' : 'Open seller menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="seller-mobile-menu-panel">
          <div className="seller-mobile-drawer">
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

            <form className="seller-mobile-search" onSubmit={(event) => event.preventDefault()}>
              <input
                type="text"
                placeholder="Search seller tools..."
                value={menuSearch}
                onChange={(event) => setMenuSearch(event.target.value)}
              />
              <button type="submit" aria-label="Search seller tools">
                <Search size={16} />
              </button>
            </form>

            <nav className="seller-mobile-menu">
              {visibleMobileNavItems.length === 0 ? (
                <span className="seller-mobile-empty-search label-md">No matches</span>
              ) : (
                visibleMobileNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`seller-mobile-nav-item label-md ${isActivePath(pathname, item.href, item.end) ? 'seller-mobile-nav-active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))
              )}
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

              <Link
                href="/seller/profile"
                className="seller-mobile-profile-link label-md"
                onClick={closeMobileMenu}
              >
                My Profile
              </Link>

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
