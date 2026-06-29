import React, { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ShoppingBag, Globe, Send, Camera, Mail, Phone } from 'lucide-react';
import { getRootCategories } from '../utils/categoryPresentation';

export const Footer = () => {
  const { props } = usePage();
  const featuredCategories = useMemo(
    () => getRootCategories(Array.isArray(props.footerCategories) ? props.footerCategories : (Array.isArray(props.categories) ? props.categories : [])).slice(0, 4),
    [props.footerCategories, props.categories],
  );

  return (
    <footer className="w-dvw border-t-2 border-neutral-950 bg-neutral-50">
      <div className="mx-auto w-dvw px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717]">
            <Link href="/" className="inline-flex items-center gap-3 border-2 border-neutral-950 bg-white px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950">
              <ShoppingBag size={18} />
              <span>MyStore</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-neutral-600">
              Your premium marketplace for verified independent sellers. Manage your orders, warehouses, and checkout seamlessly.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center border-2 border-neutral-950 bg-white text-neutral-900 transition hover:bg-neutral-950 hover:text-white">
                <Globe size={16} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center border-2 border-neutral-950 bg-white text-neutral-900 transition hover:bg-neutral-950 hover:text-white">
                <Send size={16} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center border-2 border-neutral-950 bg-white text-neutral-900 transition hover:bg-neutral-950 hover:text-white">
                <Camera size={16} />
              </a>
            </div>
          </div>

          <div className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717]">
            <h5 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Departments</h5>
            <ul className="mt-4 space-y-3">
              {featuredCategories.map((category) => (
                <li key={category.id}>
                  <Link href={`/categories/${category.id}`} className="text-sm text-neutral-700 transition hover:text-neutral-950">
                    {category.displayName}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className="text-sm font-medium text-neutral-950">
                  All Categories
                </Link>
              </li>
            </ul>
          </div>

          <div className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717]">
            <h5 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Support</h5>
            <ul className="mt-4 space-y-3">
              <li><Link href="/profile" className="text-sm text-neutral-700 transition hover:text-neutral-950">My Account</Link></li>
              <li><Link href="/orders" className="text-sm text-neutral-700 transition hover:text-neutral-950">Order History</Link></li>
              <li><Link href="/cart" className="text-sm text-neutral-700 transition hover:text-neutral-950">Shopping Cart</Link></li>
              <li><a href="#faq" className="text-sm text-neutral-700 transition hover:text-neutral-950">Frequently Asked Questions</a></li>
              <li><a href="#privacy" className="text-sm text-neutral-700 transition hover:text-neutral-950">Privacy & Terms</a></li>
            </ul>
          </div>

          <div className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717]">
            <h5 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Subscribe & Connect</h5>
            <p className="mt-4 text-sm leading-7 text-neutral-600">Sign up for special offers and seller announcements.</p>
            <form onSubmit={(event) => event.preventDefault()} className="mt-4 flex border-2 border-neutral-950 bg-white">
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              />
              <button type="submit" className="border-l-2 border-neutral-950 bg-neutral-950 px-4 text-sm font-medium text-white">
                Join
              </button>
            </form>
            <div className="mt-5 space-y-3 text-sm text-neutral-700">
              <div className="flex items-center gap-3">
                <Phone size={14} />
                <span>+1 (800) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} />
                <span>support@mystore.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-neutral-950 bg-white">
        <div className="mx-auto flex w-dvw items-center justify-between px-4 py-4 text-sm text-neutral-600 sm:px-6 lg:px-8">
          <span>&copy; {new Date().getFullYear()} MyStore Inc. All rights reserved.</span>
          <span className="text-neutral-500">Minimal commerce interface</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
