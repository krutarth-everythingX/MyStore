import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, Warehouse, ShoppingCart, LogOut, Settings } from 'lucide-react';
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
  const pathname = normalizePath(new URL(url || window.location.href, window.location.origin).pathname);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="seller-sidebar">
      <div className="sidebar-brand">
        <Link href="/" className="sidebar-brand-link">
          <span className="sidebar-brand-name title-lg">MyStore Seller</span>
        </Link>
        {user && <span className="sidebar-seller-name label-md">{user.brand_name}</span>}
      </div>

      <nav className="sidebar-menu">
        <Link
          href="/seller"
          className={`sidebar-item label-md ${isActivePath(pathname, '/seller', true) ? 'sidebar-item-active' : ''}`}
        >
          <LayoutDashboard size={18} className="sidebar-icon" />
          Overview
        </Link>

        <Link
          href="/seller/products"
          className={`sidebar-item label-md ${isActivePath(pathname, '/seller/products') ? 'sidebar-item-active' : ''}`}
        >
          <ShoppingBag size={18} className="sidebar-icon" />
          Products
        </Link>

        <Link
          href="/seller/inventory"
          className={`sidebar-item label-md ${isActivePath(pathname, '/seller/inventory') ? 'sidebar-item-active' : ''}`}
        >
          <Warehouse size={18} className="sidebar-icon" />
          Inventory
        </Link>

        <Link
          href="/seller/orders"
          className={`sidebar-item label-md ${isActivePath(pathname, '/seller/orders') ? 'sidebar-item-active' : ''}`}
        >
          <ShoppingCart size={18} className="sidebar-icon" />
          Orders
        </Link>

        <Link
          href="/seller/profile"
          className={`sidebar-item label-md ${isActivePath(pathname, '/seller/profile') ? 'sidebar-item-active' : ''}`}
        >
          <Settings size={18} className="sidebar-icon" />
          Settings
        </Link>

        <div className="sidebar-divider"></div>



        <button onClick={handleLogout} className="sidebar-item sidebar-btn label-md">
          <LogOut size={18} className="sidebar-icon" />
          Logout
        </button>
      </nav>
    </aside>
  );
};
