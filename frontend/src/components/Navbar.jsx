import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Layout, Search, Menu, X, Home as HomeIcon } from 'lucide-react';
import './Navbar.css';

export const Navbar = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.avatar-dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogoutClick = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out of your account?");
    if (confirmLogout) {
      logout();
      navigate('/login');
    }
    setDropdownOpen(false);
  };

  return (
    <header className="navbar-header shadow-sm">
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-text title-lg">MyStore</span>
        </Link>

        {/* Navigation Tabs */}
        <nav className={`navbar-nav ${mobileMenuOpen ? 'navbar-nav-mobile-open' : ''}`}>
          {/* Mobile search bar inside menu */}
          <form className="navbar-search show-on-mobile" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search products..."
              className="navbar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="navbar-search-btn">
              <Search size={18} />
            </button>
          </form>

          {/* Fallback links in mobile menu if guest */}
          {!user && mobileMenuOpen && (
            <div className="mobile-auth-links" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '12px' }}>
              <Link to="/login" className="nav-link label-md" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="nav-link label-md" onClick={() => setMobileMenuOpen(false)}>Register</Link>
            </div>
          )}
        </nav>
        {/* Desktop search bar */}
        <form className="navbar-search hide-on-mobile" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search products..."
            className="navbar-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="navbar-search-btn">
            <Search size={18} />
          </button>
        </form>
        {/* Right actions section */}
        <div className="navbar-actions">
          {/* Home Icon close to search bar */}
          {/* if user === "buyer" then Home icon and if user === "seller" then Layout icon and also link take to the "/seller" */}
          {
            user?.role === "buyer" ? (
              <Link to="/" className="nav-home-icon-link" title="Home">
                <HomeIcon size={20} />
              </Link>
            ) : (
              <Link to="/seller" className="nav-home-icon-link" title="Seller Panel">
                <Layout size={20} />
              </Link>
            )
          }



          {/* Cart link placed before profile avatar */}
          {(!user || user.role !== 'seller') && (
            <Link to="/cart" className="nav-cart-link" onClick={() => setMobileMenuOpen(false)}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}

          {/* User profile avatar dropdown */}
          {user ? (
            <div className="avatar-dropdown-container">
              <button className="avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="avatar-circle">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>
              {dropdownOpen && (
                <div className="avatar-dropdown shadow-md">
                  <Link to="/profile" className="dropdown-item body-md" onClick={() => setDropdownOpen(false)}>
                    Profile Settings
                  </Link>
                  <button className="dropdown-item body-md logout-btn" onClick={handleLogoutClick}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="desktop-auth-links flex-center" style={{ gap: '12px' }}>
              <Link to="/login" className="nav-link label-md">Login</Link>
              <Link to="/register" className="nav-link label-md">Register</Link>
            </div>
          )}
        </div>

        <button className="navbar-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
