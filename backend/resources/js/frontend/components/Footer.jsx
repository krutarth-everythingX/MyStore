import React from 'react';
import { Link } from '@inertiajs/react';
import { ShoppingBag, Globe, Send, Camera, Mail, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-neutral-900 bg-neutral-950 text-neutral-300">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
        {/* Brand Column */}
        <div className="flex flex-col items-start lg:col-span-4">
          <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-semibold text-white">
            <ShoppingBag size={21} className="text-neutral-400" />
            <span>MyStore</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
            Your premium marketplace for verified independent sellers. Manage your orders, warehouses, and checkout seamlessly.
          </p>
          <div className="mt-6 flex gap-2">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:border-white/30 hover:bg-white hover:text-neutral-950"><Globe size={16} /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:border-white/30 hover:bg-white hover:text-neutral-950"><Send size={16} /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:border-white/30 hover:bg-white hover:text-neutral-950"><Camera size={16} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col lg:col-span-2">
          <h5 className="relative mb-4 pb-2 text-xs font-bold uppercase tracking-widest text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-7 after:bg-neutral-600 after:content-['']">
            Departments
          </h5>
          <ul className="flex flex-col gap-2.5 text-sm text-neutral-400">
            <li><Link href="/categories/1" className="hover:text-white transition-colors">Electronics</Link></li>
            <li><Link href="/categories/2" className="hover:text-white transition-colors">Fashion</Link></li>
            <li><Link href="/categories/3" className="hover:text-white transition-colors">Baby Products</Link></li>
            <li><Link href="/categories/4" className="hover:text-white transition-colors">Toys & Games</Link></li>
            <li><Link href="/categories" className="hover:text-white transition-colors">All Categories</Link></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div className="flex flex-col lg:col-span-2">
          <h5 className="relative mb-4 pb-2 text-xs font-bold uppercase tracking-widest text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-7 after:bg-neutral-600 after:content-['']">
            Support
          </h5>
          <ul className="flex flex-col gap-2.5 text-sm text-neutral-400">
            <li><Link href="/profile" className="hover:text-white transition-colors">My Account</Link></li>
            <li><Link href="/orders" className="hover:text-white transition-colors">Order History</Link></li>
            <li><Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
            <li><a href="#faq" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
            <li><a href="#privacy" className="hover:text-white transition-colors">Privacy & Terms</a></li>
          </ul>
        </div>

        {/* Contact info / Newsletter */}
        <div className="flex flex-col lg:col-span-4">
          <h5 className="relative mb-4 pb-2 text-xs font-bold uppercase tracking-widest text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-7 after:bg-neutral-600 after:content-['']">
            Subscribe & Connect
          </h5>
          <p className="mb-4 max-w-sm text-sm leading-relaxed text-neutral-400">Sign up for special offers and seller announcements.</p>
          <form className="flex h-12 w-full max-w-sm items-center rounded-full border border-white/10 bg-white/5 p-1 transition-colors focus-within:border-white/30" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="min-w-0 flex-1 border-none bg-transparent px-4 text-sm text-white placeholder-neutral-500 focus:outline-none" required />
            <button type="submit" className="h-10 rounded-full bg-white px-5 text-[11px] font-bold uppercase tracking-wider text-neutral-950 transition-colors hover:bg-neutral-200 shrink-0">Join</button>
          </form>
          <div className="mt-6 flex flex-col gap-2 text-sm text-neutral-400">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-neutral-500" /> <span>+1 (800) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-neutral-500" /> <span>support@mystore.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-900 bg-neutral-950 py-5">
        <div className="mx-auto flex w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-medium text-neutral-500">&copy; {new Date().getFullYear()} MyStore Inc. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
