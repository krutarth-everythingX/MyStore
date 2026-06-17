import React, { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Layout, Search, Menu, X, Home as HomeIcon, Bell, ChevronDown, ArrowUpRight } from 'lucide-react';

export const Navbar = ({ onSearch, opaque = false }) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { props, url } = usePage();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const params = new URL(url, window.location.origin).searchParams;
    setSearchQuery(params.get('search') || '');
  }, [url]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [mobileMenuOpen]);

  const hasUnreadNotification = user && !user.email_verified_at;
  const navItems = [
    { label: 'Home', href: '/', active: url === '/' },
  ];

  const [categories, setCategories] = useState([]);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const categoriesLoadedRef = useRef(false);

  useEffect(() => {
    const pageCategories = Array.isArray(props.categories) ? props.categories : [];

    if (pageCategories.length > 0) {
      setCategories(pageCategories.filter((category) => !category.parent_id).slice(0, 10));
      categoriesLoadedRef.current = true;
    }
  }, [props.categories]);

  const loadNavCategories = async () => {
    if (categoriesLoadedRef.current || categories.length > 0) {
      return;
    }

    const cached = sessionStorage.getItem('mystore.navCategories');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setCategories(parsed);
          categoriesLoadedRef.current = true;
          return;
        }
      } catch (error) {
        sessionStorage.removeItem('mystore.navCategories');
      }
    }

      try {
        const response = await fetch('/api/categories/nav', {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        const data = await response.json();
        const cats = Array.isArray(data) ? data : (data.data || []);
        const nextCategories = cats.filter((category) => !category.parent_id).slice(0, 10);
        sessionStorage.setItem('mystore.navCategories', JSON.stringify(nextCategories));
        setCategories(nextCategories);
        categoriesLoadedRef.current = true;
      } catch (error) {
        console.error('Failed to load categories', error);
      }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.avatar-dropdown-container')) {
        setDropdownOpen(false);
      }
      if (!event.target.closest('.nav-categories-dropdown-container')) {
        setCategoriesDropdownOpen(false);
      }
      if (!event.target.closest('.nav-search-container')) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return undefined;
    }

    setSuggestionsLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/search/suggestions?q=${encodeURIComponent(query)}&limit=6`, {
          signal: controller.signal,
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        const payload = await response.json();
        setSuggestions(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setSuggestionsLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.get('/categories', { search: searchQuery || undefined }, {
        preserveScroll: true,
        preserveState: true,
      });
    }
    setMobileMenuOpen(false);
    setSuggestionsOpen(false);
  };

  const handleLogoutClick = async () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) await logout();
    setDropdownOpen(false);
  };

  const headerClass = `sticky top-0 z-50 w-full bg-white/96 backdrop-blur-md border-b border-neutral-200 shadow-sm transition-all duration-300 ${
    scrolled || opaque ? 'py-2.5' : 'py-3'
  }`;

  return (
    <>
      <header className={headerClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex flex-col items-start" onClick={() => setMobileMenuOpen(false)}>
            <span className="text-xl sm:text-2xl font-semibold tracking-normal text-neutral-900 leading-none">
              MyStore
            </span>
            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-400">
              Refined commerce
            </span>
          </Link>

        {/* Center Nav Link Items (Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`px-3.5 py-2 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] transition-all ${item.active
                ? 'bg-neutral-950 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
                }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="nav-categories-dropdown-container relative">
            <button
              type="button"
              className={`px-3.5 py-2 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] flex items-center gap-1 transition-all ${url.startsWith('/categories')
                ? 'bg-neutral-950 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
                }`}
              onMouseEnter={loadNavCategories}
              onFocus={loadNavCategories}
              onClick={() => {
                loadNavCategories();
                setCategoriesDropdownOpen(!categoriesDropdownOpen);
              }}
            >
              Categories <ChevronDown size={12} />
            </button>
            {categoriesDropdownOpen && (
              <div className="absolute left-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-neutral-100 p-5 z-50 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {categories.length === 0 && (
                  <span className="col-span-2 px-3 py-2 text-xs text-neutral-400">Loading categories...</span>
                )}
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.id}`}
                    className="px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors truncate"
                    onClick={() => setCategoriesDropdownOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
                <div className="col-span-2 border-t border-neutral-100 pt-3 mt-1 flex justify-center">
                  <Link
                    href="/categories"
                    className="w-full text-center py-2 bg-neutral-50 text-neutral-800 hover:bg-neutral-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    onClick={() => setCategoriesDropdownOpen(false)}
                  >
                    See all categories
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
          {/* Desktop Search */}
          <form ref={searchContainerRef} className="nav-search-container hidden lg:flex items-center relative max-w-xs w-full" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search the collection..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full py-2 pl-4 pr-10 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
            />
            <button type="submit" className="absolute right-3 text-neutral-400 hover:text-neutral-900">
              <Search size={14} />
            </button>
            {suggestionsOpen && (suggestions.length > 0 || suggestionsLoading) && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-xl">
                {suggestionsLoading && suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-neutral-400">Searching...</div>
                ) : suggestions.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.url || `/categories?search=${encodeURIComponent(item.label)}`}
                    className="flex items-center gap-3 border-b border-neutral-50 px-4 py-3 last:border-b-0 hover:bg-neutral-50"
                    onClick={() => setSuggestionsOpen(false)}
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[10px] font-bold uppercase text-neutral-500">
                        {item.type?.charAt(0)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-neutral-900">{item.label}</span>
                      <span className="block truncate text-[10px] uppercase tracking-wider text-neutral-400">{item.subtitle || item.type}</span>
                    </span>
                    <ArrowUpRight size={13} className="shrink-0 text-neutral-300" />
                  </Link>
                ))}
              </div>
            )}
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {user?.role === 'seller' ? (
              <Link
                href="/seller"
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
                title="Seller Panel"
              >
                <Layout size={18} />
              </Link>
            ) : (
              <Link
                href="/"
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
                title="Home"
              >
                <HomeIcon size={18} />
              </Link>
            )}

            {(!user || user.role !== 'seller') && (
              <Link
                href="/cart"
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full relative transition-colors"
                title="Shopping Cart"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-neutral-950 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {user && (
              <Link
                href="/notifications"
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full relative transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
                {hasUnreadNotification && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 border-2 border-white rounded-full animate-ping" />
                )}
              </Link>
            )}

            {user ? (
              <div className="avatar-dropdown-container relative">
                <button
                className="h-8 w-8 rounded-full bg-neutral-950 text-white font-semibold flex items-center justify-center hover:bg-neutral-900 transition-colors"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-neutral-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link
                      href="/profile"
                      className="block w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/notifications"
                      className="block w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Notifications
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors border-t border-neutral-50 mt-1"
                      onClick={handleLogoutClick}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 hover:text-neutral-900"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] bg-neutral-950 text-white hover:bg-neutral-900 rounded-full shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full md:hidden transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      </header>

      {/* Mobile Drawer Overlay & Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[1000] overflow-hidden bg-white">
          <div className="flex h-[100svh] min-h-[100svh] flex-col gap-6 overflow-y-auto overscroll-contain bg-white p-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <span className="text-lg font-semibold text-neutral-900">Menu</span>
              <button
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Search */}
            <form className="nav-search-container relative" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search catalog..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-full py-2.5 pl-4 pr-10 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
              />
              <button type="submit" className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-900">
                <Search size={16} />
              </button>
              {suggestionsOpen && suggestions.length > 0 && (
                <div className="mt-2 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
                  {suggestions.slice(0, 5).map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.url || `/categories?search=${encodeURIComponent(item.label)}`}
                      className="flex items-center justify-between gap-3 border-b border-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-800 last:border-b-0"
                      onClick={() => {
                        setSuggestionsOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-neutral-400">{item.type}</span>
                    </Link>
                  ))}
                </div>
              )}
            </form>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${item.active
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/categories"
                className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${url.startsWith('/categories')
                  ? 'bg-neutral-950 text-white'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                All Categories
              </Link>
            </nav>

            {/* Auth / Profile Links inside Drawer */}
            <div className="mt-auto border-t border-neutral-100 pt-4 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-1">
                    <div className="h-9 w-9 rounded-full bg-neutral-950 text-white font-semibold flex items-center justify-center">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-bold text-neutral-900 truncate">{user.name}</span>
                      <span className="text-[10px] text-neutral-400 truncate">{user.email}</span>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="w-full text-center py-2.5 border border-neutral-200 text-neutral-800 hover:bg-neutral-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors mt-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <button
                    className="w-full text-center py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="w-full text-center py-2.5 border border-neutral-200 text-neutral-800 hover:bg-neutral-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="w-full text-center py-2.5 bg-neutral-950 text-white hover:bg-neutral-900 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
