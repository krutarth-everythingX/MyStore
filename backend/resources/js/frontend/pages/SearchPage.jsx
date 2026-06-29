import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Search } from 'lucide-react';

export const SearchPage = () => {
  const { url } = usePage();
  const currentUrl = new URL(url || window.location.href, window.location.origin);
  const initialSearch = currentUrl.searchParams.get('search') || '';
  const [query, setQuery] = useState(initialSearch);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set('search', trimmed);
    router.visit(`/search/results${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 py-4 text-neutral-950 sm:px-6 sm:py-8">
      <main className="w-full max-w-4xl">
        <section className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717] sm:p-8">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Search</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">Find a product</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            Search by product name and jump straight into the storefront results page.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center border-2 border-neutral-950 bg-white">
              <span className="inline-flex h-12 w-12 items-center justify-center border-r-2 border-neutral-950 text-neutral-900">
                <Search size={16} />
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type a product name"
                autoFocus
                className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              />
            </div>
            <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-5 text-sm font-medium text-white">
              Search <ArrowRight size={14} />
            </button>
          </form>

          <div className="mt-6 border-t-2 border-neutral-950 pt-5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Quick links</span>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/categories" className="border-2 border-neutral-950 bg-white px-4 py-2 text-sm font-medium text-neutral-950">
                Browse categories
              </Link>
              <Link href="/week-most-wanted" className="border-2 border-neutral-950 bg-white px-4 py-2 text-sm font-medium text-neutral-950">
                Most wanted
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SearchPage;
