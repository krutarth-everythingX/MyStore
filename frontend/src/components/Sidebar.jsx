import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, Warehouse, ShoppingCart, LogOut, ArrowLeft, Settings } from 'lucide-react';
import './Sidebar.css';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="seller-sidebar">
      <div className="sidebar-brand">
        <Link to="/" className="sidebar-brand-link">
          <span className="sidebar-brand-name title-lg">MyStore Seller</span>
        </Link>
        {user && <span className="sidebar-seller-name label-md">{user.brand_name}</span>}
      </div>

      <nav className="sidebar-menu">
        <NavLink
          to="/seller"
          end
          className={({ isActive }) => `sidebar-item label-md ${isActive ? 'sidebar-item-active' : ''}`}
        >
          <LayoutDashboard size={18} className="sidebar-icon" />
          Overview
        </NavLink>

        <NavLink
          to="/seller/products"
          className={({ isActive }) => `sidebar-item label-md ${isActive ? 'sidebar-item-active' : ''}`}
        >
          <ShoppingBag size={18} className="sidebar-icon" />
          Products
        </NavLink>

        <NavLink
          to="/seller/inventory"
          className={({ isActive }) => `sidebar-item label-md ${isActive ? 'sidebar-item-active' : ''}`}
        >
          <Warehouse size={18} className="sidebar-icon" />
          Inventory
        </NavLink>

        <NavLink
          to="/seller/orders"
          className={({ isActive }) => `sidebar-item label-md ${isActive ? 'sidebar-item-active' : ''}`}
        >
          <ShoppingCart size={18} className="sidebar-icon" />
          Orders
        </NavLink>

        <NavLink
          to="/seller/profile"
          className={({ isActive }) => `sidebar-item label-md ${isActive ? 'sidebar-item-active' : ''}`}
        >
          <Settings size={18} className="sidebar-icon" />
          Settings
        </NavLink>

        <div className="sidebar-divider"></div>

        <Link to="/" className="sidebar-item label-md">
          <ArrowLeft size={18} className="sidebar-icon" />
          Back to Store
        </Link>

        <button onClick={handleLogout} className="sidebar-item sidebar-btn label-md">
          <LogOut size={18} className="sidebar-icon" />
          Logout
        </button>
      </nav>
    </aside>
  );
};
