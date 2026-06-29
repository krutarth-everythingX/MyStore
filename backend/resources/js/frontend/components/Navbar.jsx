import React, { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Layout, Search, Menu, X, Bell, ChevronDown, ArrowUpRight, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getCategoryDisplayName } from '../utils/categoryPresentation';

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
  const [categories, setCategories] = useState([]);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const categoriesLoadedRef = useRef(false);

  useEffect(() => {
    const params = new URL(url, window.location.origin).searchParams;
    setSearchQuery(params.get('search') || '');
  }, [url]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const pageCategories = Array.isArray(props.categories) ? props.categories : [];
    if (pageCategories.length > 0) {
      const nextCategories = pageCategories.filter((category) => !category.parent_id).slice(0, 10);
      setCategories(nextCategories);
      categoriesLoadedRef.current = true;
      sessionStorage.setItem('mystore.navCategories', JSON.stringify(nextCategories));
      return;
    }

    const cached = sessionStorage.getItem('mystore.navCategories');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          categoriesLoadedRef.current = true;
        }
      } catch (error) {
        sessionStorage.removeItem('mystore.navCategories');
      }
    }
  }, [props.categories]);

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
      if (!event.target.closest('.nav-notifications-dropdown-container')) {
        setNotificationsOpen(false);
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

  const hasUnreadNotification = user && !user.email_verified_at;
  const notifications = user
    ? [
      ...(hasUnreadNotification
        ? [{
          id: 'verify-email',
          title: 'Verify your email',
          description: `Complete verification for ${user.email} to unlock checkout access.`,
          href: '/profile?tab=verify-email',
          tone: 'warning',
          icon: AlertTriangle,
        }]
        : []),
      {
        id: 'account-status',
        title: hasUnreadNotification ? 'Account setup in progress' : 'Account active',
        description: hasUnreadNotification
          ? 'Finish verification to enable the full buyer flow.'
          : 'Your account is verified and ready to shop.',
        href: hasUnreadNotification ? '/profile?tab=verify-email' : '/',
        tone: hasUnreadNotification ? 'neutral' : 'success',
        icon: hasUnreadNotification ? ShieldCheck : CheckCircle2,
      },
    ]
    : [];
  const navItems = [{ label: 'Home', href: '/', active: url === '/' }];

  const loadNavCategories = async () => {
    if (categoriesLoadedRef.current || categories.length > 0) return;

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
      const cats = Array.isArray(data) ? data : data.data || [];
      const nextCategories = cats.filter((category) => !category.parent_id).slice(0, 10);
      sessionStorage.setItem('mystore.navCategories', JSON.stringify(nextCategories));
      setCategories(nextCategories);
      categoriesLoadedRef.current = true;
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set('search', trimmed);
    if (onSearch) {
      onSearch(trimmed);
    } else {
      router.visit(`/search/results${params.toString() ? `?${params.toString()}` : ''}`, {
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

  const openSearchPage = () => {
    const query = searchQuery.trim();
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    router.visit(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const headerClass = `sticky top-0 z-50 border-b-2 border-neutral-950 bg-neutral-50 transition-all ${scrolled || opaque ? 'shadow-[0_6px_0_#171717]' : ''}`;

  return (
    <>
      <header className={headerClass}>
        <div className="mx-auto flex w-dvw items-center gap-3 px-4 py-3 sm:px-6 lg:grid lg:grid-cols-[1fr_minmax(28rem,34rem)_1fr] lg:items-center lg:gap-6 lg:px-8">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="inline-flex shrink-0 border-2 border-neutral-950 bg-white px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950 lg:hidden">
            MyStore
          </Link>

          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hidden shrink-0 justify-self-start border-2 border-neutral-950 bg-white px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950 lg:inline-flex">
            MyStore
          </Link>

          <div className="nav-search-container relative hidden min-w-0 w-full lg:block">
            <form ref={searchContainerRef} onSubmit={handleSearchSubmit} className="flex items-center border-2 border-neutral-950 bg-white">
              <input
                type="text"
                placeholder="Search products"
                value={searchQuery}
                onClick={openSearchPage}
                onFocus={(event) => {
                  event.target.blur();
                  openSearchPage();
                }}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSuggestionsOpen(true);
                }}
                readOnly
                className="h-11 min-w-0 flex-1 cursor-text bg-transparent px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              />
              <button type="submit" className="inline-flex h-11 w-11 items-center justify-center border-l-2 border-neutral-950 text-neutral-900">
                <Search size={16} />
              </button>
            </form>

            {suggestionsOpen && (suggestions.length > 0 || suggestionsLoading) && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] border-2 border-neutral-950 bg-white p-2 shadow-[8px_8px_0_#171717]">
                {suggestionsLoading && suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-neutral-500">Searching...</div>
                ) : (
                  suggestions.map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.url || `/search/results?search=${encodeURIComponent(item.label)}`}
                      onClick={() => setSuggestionsOpen(false)}
                      className="flex items-center gap-3 border-b border-neutral-200 px-3 py-3 text-sm text-neutral-700 transition last:border-b-0 hover:bg-neutral-100 hover:text-neutral-950"
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-10 w-10 border border-neutral-200 object-cover" />
                      ) : (
                        <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-100 text-xs font-semibold uppercase">
                          {item.type?.charAt(0)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.label}</span>
                        <span className="block truncate text-xs text-neutral-500">{item.subtitle || item.type}</span>
                      </span>
                      <ArrowUpRight size={14} />
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="hidden items-center justify-self-end gap-2 lg:flex">
            <nav className="flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`border-2 px-3 py-2 text-sm font-medium transition ${item.active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-950 hover:text-neutral-950'}`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="nav-categories-dropdown-container relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 border-2 border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
                  onMouseEnter={loadNavCategories}
                  onFocus={loadNavCategories}
                  onClick={() => {
                    loadNavCategories();
                    setCategoriesDropdownOpen(!categoriesDropdownOpen);
                  }}
                >
                  Categories <ChevronDown size={14} />
                </button>

                {categoriesDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+0.5rem)] w-64 border-2 border-neutral-950 bg-white p-2 shadow-[8px_8px_0_#171717]">
                    {categories.length === 0 && <span className="block px-3 py-2 text-sm text-neutral-500">Loading categories...</span>}
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.id}`}
                        onClick={() => setCategoriesDropdownOpen(false)}
                        className="block border-b border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition last:border-b-0 hover:bg-neutral-100 hover:text-neutral-950"
                      >
                        {getCategoryDisplayName(cat.name)}
                      </Link>
                    ))}
                    <div className="mt-2 border-t border-neutral-200 pt-2">
                      <Link href="/categories" onClick={() => setCategoriesDropdownOpen(false)} className="block px-3 py-2 text-sm font-medium text-neutral-950">
                        See all categories
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {user?.role === 'seller' ? (
              <Link href="/seller-inventory" title="Seller Panel" className="inline-flex h-11 w-11 items-center justify-center border-2 border-neutral-200 bg-white text-neutral-900 transition hover:border-neutral-950">
                <Layout size={18} />
              </Link>
            ) : null}

            {(!user || user.role !== 'seller') && (
              <Link href="/cart" title="Shopping Cart" className="relative inline-flex h-10 items-center justify-center border-2 border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:border-neutral-950">
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex min-w-6 items-center justify-center border-2 border-neutral-950 bg-neutral-950 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {user && (
              <div className="nav-notifications-dropdown-container relative">
                <button
                  type="button"
                  title="Notifications"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative inline-flex h-11 w-11 items-center justify-center border-2 border-neutral-200 bg-white text-neutral-900 transition hover:border-neutral-950"
                >
                  <Bell size={18} />
                  {hasUnreadNotification && <span className="absolute right-2 top-2 h-2.5 w-2.5 bg-rose-500" />}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] w-[22rem] border-2 border-neutral-950 bg-white p-3 shadow-[8px_8px_0_#171717]">
                    <div className="flex items-center justify-between border-b-2 border-neutral-950 pb-3">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Notifications</span>
                        <p className="mt-1 text-sm font-medium text-neutral-950">{notifications.length} update{notifications.length === 1 ? '' : 's'}</p>
                      </div>
                      {hasUnreadNotification && (
                        <span className="border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-3">
                      {notifications.length > 0 ? (
                        notifications.map((item) => {
                          const Icon = item.icon;
                          const toneClass = item.tone === 'warning'
                            ? 'bg-[#fff7ed]'
                            : item.tone === 'success'
                              ? 'bg-[#ecfdf5]'
                              : 'bg-white';

                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => setNotificationsOpen(false)}
                              className={`block border-2 border-neutral-950 p-3 transition hover:-translate-y-0.5 ${toneClass}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-neutral-950 bg-white text-neutral-950">
                                  <Icon size={16} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold text-neutral-950">{item.title}</span>
                                  <span className="mt-1 block text-xs leading-5 text-neutral-600">{item.description}</span>
                                </span>
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="border-2 border-neutral-950 bg-white p-4 text-sm text-neutral-600">
                          No new notifications.
                        </div>
                      )}
                    </div>

                    <div className="mt-3 border-t-2 border-neutral-950 pt-3">
                      <Link href="/notifications" onClick={() => setNotificationsOpen(false)} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950">
                        Open notification page
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="avatar-dropdown-container relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} aria-label="Open account menu" className="inline-flex h-11 min-w-11 items-center justify-center border-2 border-neutral-950 bg-neutral-950 px-3 text-sm font-semibold uppercase text-white">
                  {user.name.charAt(0).toUpperCase()}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] min-w-44 border-2 border-neutral-950 bg-white p-2 shadow-[8px_8px_0_#171717]">
                    <Link href={user?.role === 'buyer' ? '/orders' : '/profile'} onClick={() => setDropdownOpen(false)} className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950">
                      {user?.role === 'buyer' ? 'My Orders' : 'Profile'}
                    </Link>
                    <Link href="/profile" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950">
                      Profile
                    </Link>
                    <button onClick={handleLogoutClick} className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="border-2 border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-neutral-950">
                  Login
                </Link>
                <Link href="/register" className="border-2 border-neutral-950 bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
                  Register
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => router.visit('/search')}
            aria-label="Open search"
            className="ml-auto inline-flex h-11 w-11 items-center justify-center border-2 border-neutral-950 bg-white text-neutral-950 lg:hidden"
          >
            <Search size={18} />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="inline-flex h-11 w-11 items-center justify-center border-2 border-neutral-950 bg-white text-neutral-950 lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="fixed inset-0 z-50 bg-neutral-950/30 lg:hidden">
          <div className="ml-auto flex h-full w-full max-w-sm flex-col border-l-2 border-neutral-950 bg-neutral-50 shadow-[-8px_0_0_#171717]">
            <div className="flex items-center justify-between border-b-2 border-neutral-950 px-4 py-4">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="inline-flex h-10 w-10 items-center justify-center border-2 border-neutral-950 bg-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <form onSubmit={handleSearchSubmit} className="flex items-center border-2 border-neutral-950 bg-white">
                <input
                  type="text"
                  placeholder="Search catalog"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  className="h-11 flex-1 bg-transparent px-4 text-sm text-neutral-900 outline-none"
                />
                <button type="submit" className="inline-flex h-11 w-11 items-center justify-center border-l-2 border-neutral-950">
                  <Search size={16} />
                </button>
              </form>

              {suggestionsOpen && suggestions.length > 0 && (
                <div className="mt-2 border-2 border-neutral-950 bg-white">
                  {suggestions.slice(0, 5).map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.url || `/search/results?search=${encodeURIComponent(item.label)}`}
                      onClick={() => {
                        setSuggestionsOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className="block border-b border-neutral-200 px-4 py-3 text-sm text-neutral-700 last:border-b-0"
                    >
                      <span className="block font-medium text-neutral-950">{item.label}</span>
                      <span className="block text-xs text-neutral-500">{item.type}</span>
                    </Link>
                  ))}
                </div>
              )}

              <nav className="mt-6 space-y-2">
                {navItems.map((item) => (
                  <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block border-2 border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900">
                    {item.label}
                  </Link>
                ))}
                <Link href="/categories" onClick={() => setMobileMenuOpen(false)} className="block border-2 border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900">
                  All Categories
                </Link>
              </nav>

              {categories.length > 0 && (
                <section className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">Popular departments</h3>
                    <Link href="/categories" onClick={() => setMobileMenuOpen(false)} className="text-sm text-neutral-700">
                      View all
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {categories.slice(0, 5).map((category) => (
                      <Link key={category.id} href={`/categories/${category.id}`} onClick={() => setMobileMenuOpen(false)} className="block border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
                        {getCategoryDisplayName(category.name)}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <div className="mt-6 space-y-2">
                {user ? (
                  <>
                    <div className="border-2 border-neutral-950 bg-white px-4 py-4">
                      <div className="text-sm font-semibold text-neutral-950">{user.name}</div>
                      <div className="mt-1 text-xs text-neutral-500">{user.email}</div>
                    </div>
                    {user.role === 'buyer' ? (
                      <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="block border-2 border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900">
                        My Orders
                      </Link>
                    ) : null}
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block border-2 border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900">
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-left text-sm font-medium text-white"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block border-2 border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900">
                      Login
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white">
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
