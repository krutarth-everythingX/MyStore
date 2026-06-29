import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  ClipboardList,
  ChevronDown,
  Folder,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  PanelsTopLeft,
  Ruler,
  ScanBarcode,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Warehouse,
  X,
  User,
  Building2,
} from 'lucide-react';
import { cn } from '../utils/cn';

const normalizePath = (path) => {
  if (!path) return '/';
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
};

const isActivePath = (pathname, target, end = false) => {
  const current = normalizePath(pathname);
  const expected = normalizePath(target);
  return end ? current === expected : current === expected || current.startsWith(`${expected}/`);
};

const MOBILE_MENU_ANIMATION_MS = 320;

const createNavSections = ({ logout }) => [
  {
    heading: 'Home',
    items: [{ href: '/seller/inventory', label: 'Dashboard', icon: LayoutDashboard, end: true, searchSection: 'Home' }],
  },
  {
    heading: 'Master Catalog',
    items: [
      { href: '/seller/products', label: 'Products & Services', icon: ShoppingBag, searchSection: 'Master Catalog' },
      { href: '/seller/categories', label: 'Categories', icon: Folder, searchSection: 'Master Catalog' },
      { href: '/seller/collections', label: 'Collections', icon: PanelsTopLeft, searchSection: 'Master Catalog' },
      { href: '/seller/brands', label: 'Brands', icon: Tag, searchSection: 'Master Catalog' },
      { href: '/seller/attributes', label: 'Variants / Attributes', icon: Boxes, searchSection: 'Master Catalog' },
      { href: '/seller/units', label: 'Units of Measurement', icon: Ruler, searchSection: 'Master Catalog' },
    ],
  },
  {
    heading: 'Stock Control',
    items: [
      { href: '/seller/inventory/stock-entries', label: 'Stock Entries', icon: ClipboardList, searchSection: 'Stock Control' },
      { href: '/seller/inventory/stock-movements', label: 'Stock Movements', icon: Warehouse, searchSection: 'Stock Control' },
      { href: '/seller/inventory/reconciliation', label: 'Reconciliation', icon: Gauge, searchSection: 'Stock Control' },
    ],
  },
  {
    heading: 'Traceability',
    items: [
      { href: '/seller/inventory/batch-tracking', label: 'Batch / Lot Tracking', icon: PackageSearch, searchSection: 'Traceability' },
      { href: '/seller/inventory/serial-tracking', label: 'Serial Tracking', icon: ScanBarcode, searchSection: 'Traceability' },
      { href: '/seller/inventory/expiry-tracking', label: 'Expiry Tracking', icon: ShieldCheck, searchSection: 'Traceability' },
    ],
  },
  {
    heading: 'Procurement & Logistics',
    items: [
      { href: '/seller/procurement', label: 'Vendors & Warehouses', icon: Building2, searchSection: 'Procurement' },
    ],
  },
  {
    heading: 'Business',
    items: [
      { href: '/seller/orders', label: 'Orders', icon: LayoutDashboard, searchSection: 'Business' },
    ],
  },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { url } = usePage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const mobileMenuCloseTimeout = useRef(null);
  const profileMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const pathname = normalizePath(new URL(url || window.location.href, window.location.origin).pathname);

  const handleLogout = async () => {
    closeMobileMenu();
    setProfileMenuOpen(false);
    await logout();
  };

  const navSections = createNavSections({ logout: () => handleLogout() });
  const displayName = user?.brand_name || user?.name || 'Seller';
  const sellerName = user?.name || 'Seller';
  const brandName = 'MY STORE SELLER';
  const avatarLetter = sellerName.charAt(0).toUpperCase();

  const searchItems = useMemo(
    () =>
      navSections.flatMap((section) =>
        section.items
          .filter((item) => item.href)
          .map((item) => ({
            ...item,
            group: item.searchSection || section.heading,
            description: item.searchSection && item.label !== item.searchSection ? `${item.searchSection} / ${item.label}` : item.searchSection || item.label,
          })),
      ),
    [navSections],
  );

  const filteredSearchItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return searchItems;
    return searchItems.filter((item) => `${item.label} ${item.group} ${item.description}`.toLowerCase().includes(query));
  }, [searchItems, searchQuery]);

  useEffect(() => () => {
    if (mobileMenuCloseTimeout.current) {
      window.clearTimeout(mobileMenuCloseTimeout.current);
    }
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    closeMobileMenu();
  }, [pathname]);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const handleClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileMenuOpen]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [searchOpen]);

  useEffect(() => {
    setActiveSearchIndex(0);
  }, [searchQuery]);

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
    if (!mobileMenuOpen) return;
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

  const runMobileAction = (action) => {
    closeMobileMenu();
    action?.();
  };

  const handleMobileLinkClick = () => {
    closeMobileMenu();
  };

  const goToSearchItem = (item) => {
    if (!item?.href) return;
    setSearchOpen(false);
    setSearchQuery('');
    router.visit(item.href, { preserveScroll: true });
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSearchIndex((current) => Math.min(current + 1, filteredSearchItems.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSearchIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      goToSearchItem(filteredSearchItems[activeSearchIndex]);
    }
  };

  const renderDesktopItem = (item) => {
    const Icon = item.icon;
    const itemPath = item.href ? new URL(item.href, window.location.origin).pathname : '';
    const active = item.href ? isActivePath(pathname, itemPath, item.end) : false;
    const itemClassName = cn(
      'group flex h-11 items-center gap-3 border px-3 text-sm font-medium transition',
      active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100',
      item.danger && !active ? 'border-rose-700 text-rose-700 hover:bg-white' : '',
      !desktopExpanded ? 'w-11 justify-center px-0' : 'w-full',
    );

    const content = (
      <>
        <Icon size={16} className="shrink-0" />
        <span className={cn('truncate whitespace-nowrap', desktopExpanded ? 'opacity-100' : 'hidden')}>{item.label}</span>
      </>
    );

    if (item.href) {
      return (
        <Link key={`${item.label}-${item.href}`} href={item.href} className={itemClassName} title={item.label}>
          {content}
        </Link>
      );
    }

    return (
      <button key={item.label} type="button" onClick={item.onClick} className={itemClassName} title={item.label}>
        {content}
      </button>
    );
  };

  const renderMobileItem = (item) => {
    const Icon = item.icon;
    const itemPath = item.href ? new URL(item.href, window.location.origin).pathname : '';
    const active = item.href ? isActivePath(pathname, itemPath, item.end) : false;
    const baseClassName = cn(
      'flex w-full items-center gap-3 border border-neutral-200 bg-white px-3 py-3 text-left text-sm font-medium',
      active ? 'bg-neutral-950 text-white' : 'text-neutral-950',
      item.danger && !active ? 'border-rose-700 text-rose-700' : '',
    );

    if (item.href) {
      return (
        <Link key={`${item.label}-${item.href}`} href={item.href} onClick={handleMobileLinkClick} className={baseClassName}>
          <Icon size={16} />
          <span>{item.label}</span>
        </Link>
      );
    }

    return (
      <button key={item.label} type="button" onClick={() => runMobileAction(item.onClick)} className={baseClassName}>
        <Icon size={16} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200 bg-neutral-50">
        <div className="flex min-h-20 w-dvw items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:min-w-[15rem]">
            <button
              type="button"
              aria-label={mobileMenuOpen && !mobileMenuClosing ? 'Close seller menu' : 'Open seller menu'}
              aria-expanded={mobileMenuOpen && !mobileMenuClosing}
              onClick={toggleMobileMenu}
              className="inline-flex h-12 w-12 items-center justify-center border border-neutral-200 bg-white text-neutral-950 lg:hidden"
            >
              {mobileMenuOpen && !mobileMenuClosing ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/seller/inventory" className="inline-flex min-h-12 items-center border border-neutral-200 bg-white px-4 text-sm font-semibold tracking-[0.2em] text-neutral-950">
              {brandName}
            </Link>
          </div>

          <div className="hidden flex-1 justify-center lg:flex">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex min-h-12 w-full max-w-2xl items-center gap-3 border border-neutral-200 bg-white px-4 text-left text-sm text-neutral-500"
            >
              <Search size={16} className="text-neutral-700" />
              <span className="flex-1 truncate">Search sidebar sections and subsections</span>
              <kbd className="inline-flex border border-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Ctrl + Space
              </kbd>
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link href="/seller/inventory" className="hidden min-h-12 items-center border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-950 lg:inline-flex">
              Dashboard
            </Link>
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((current) => !current)}
                className="inline-flex min-h-12 items-center gap-3 border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center border border-neutral-200 bg-neutral-950 text-xs font-semibold uppercase text-white">
                  {avatarLetter}
                </span>
                <span className="hidden max-w-[10rem] truncate lg:inline">{displayName}</span>
                <ChevronDown size={15} />
              </button>

              {profileMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] w-64 border border-neutral-200 bg-neutral-50 p-3 shadow-sm">
                  <div className="border border-neutral-200 bg-white p-3">
                    <p className="text-sm font-semibold text-neutral-950">{sellerName}</p>
                    <p className="mt-1 text-xs text-neutral-500">{user?.email}</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Link href="/seller/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 border border-neutral-200 bg-white px-3 py-3 text-sm font-medium text-neutral-950">
                      <User size={16} />
                      Profile
                    </Link>
                    <Link href="/seller/inventory" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 border border-neutral-200 bg-white px-3 py-3 text-sm font-medium text-neutral-950">
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 border border-rose-700 bg-white px-3 py-3 text-sm font-medium text-rose-700">
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {searchOpen ? (
        <div className="fixed inset-0 z-[60] bg-neutral-950/35 px-4 py-6" onMouseDown={() => setSearchOpen(false)}>
          <div className="mx-auto mt-10 flex max-h-[calc(100vh-5rem)] w-full max-w-xl flex-col border border-neutral-200 bg-neutral-50 p-4 shadow-sm" onMouseDown={(event) => event.stopPropagation()}>
            <label className="flex min-h-12 items-center gap-3 border border-neutral-200 bg-white px-4">
              <Search size={18} className="text-neutral-700" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search sections and subsections..."
                className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
              />
            </label>

            <div className="mt-4 min-h-0 overflow-hidden border border-neutral-200 bg-white" role="listbox">
              <div className="border-b border-neutral-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Available Pages
              </div>
              {filteredSearchItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-neutral-500">No results found.</div>
              ) : (
                <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
                  {filteredSearchItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = index === activeSearchIndex;
                    return (
                      <button
                        type="button"
                        key={`${item.href}-${item.label}`}
                        onClick={() => goToSearchItem(item)}
                        role="option"
                        aria-selected={active}
                        className={cn(
                          'flex w-full items-center gap-3 border-b border-neutral-200 px-4 py-3 text-left last:border-b-0',
                          active ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950',
                        )}
                      >
                        <span className={cn('inline-flex h-10 w-10 items-center justify-center border', active ? 'border-white/20 bg-white/10 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-950')}>                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-sm font-semibold">{item.label}</strong>
                          <small className={cn('mt-1 block truncate text-xs', active ? 'text-white/70' : 'text-neutral-500')}>{item.description}</small>
                        </span>
                        <em className={cn('text-[10px] font-semibold uppercase tracking-[0.16em] not-italic', active ? 'text-white/70' : 'text-neutral-500')}>{item.group}</em>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[55] bg-neutral-950/35 lg:hidden" onClick={closeMobileMenu}>
          <div className="h-full w-[22rem] max-w-[88vw] border-r border-neutral-200 bg-neutral-50 p-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border border-neutral-200 bg-white px-4 py-3">
              <span className="text-sm font-semibold tracking-[0.18em] text-neutral-950">{brandName}</span>
              <button type="button" aria-label="Close seller menu" onClick={closeMobileMenu} className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-50">
                <X size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mt-4 flex min-h-12 w-full items-center gap-3 border border-neutral-200 bg-white px-4 text-left text-sm text-neutral-500"
            >
              <Search size={16} className="text-neutral-700" />
              <span className="truncate">Search sidebar sections and subsections</span>
            </button>

            <nav className="mt-4 space-y-2 overflow-y-auto pb-4">
              {navSections.map((section) => (
                <div key={section.heading} className="space-y-2">
                  {section.items.map((item) => renderMobileItem(item))}
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden overflow-y-auto border-r border-neutral-200 bg-neutral-50 px-3 pb-6 pt-24 transition-[width] duration-200 lg:block',
          desktopExpanded ? 'w-[18rem]' : 'w-18',
        )}
        onMouseEnter={() => setDesktopExpanded(true)}
        onMouseLeave={() => setDesktopExpanded(false)}
      >
        <nav className="space-y-2">
          {navSections.map((section) => (
            <div key={section.heading} className="space-y-2">
              {section.items.map(renderDesktopItem)}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
