import React, { useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, MapPin, Search, SlidersHorizontal, Store } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';

const getProductPrice = product => Number(product.sale_price ?? product.regular_price ?? 0);
const formatLocation = store => [store?.city, store?.state, store?.country].filter(Boolean).join(', ');

export const BuyerStore = () => {
  const { props } = usePage();
  const store = props.store || {};
  const products = Array.isArray(props.products) ? props.products : [];
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  const filteredProducts = useMemo(() => products.filter(product => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return `${product.name || ''} ${product.sku || ''} ${product.brand?.name || ''} ${product.categories?.map(category => category.name).join(' ') || ''}`.toLowerCase().includes(query);
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return getProductPrice(a) - getProductPrice(b);
    if (sortBy === 'price-desc') return getProductPrice(b) - getProductPrice(a);
    if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
    return b.id - a.id;
  }), [products, search, sortBy]);

  const handleSearch = query => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    router.visit(`/categories${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const location = formatLocation(store);

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50 selection:bg-neutral-950 selection:text-white text-neutral-950">
      <Navbar onSearch={handleSearch} opaque />

      <main className="flex-grow">
        <section className="border-b-2 border-neutral-950">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              <Link href="/" className="transition hover:text-neutral-950">Home</Link>
              <span className="text-neutral-300">/</span>
              <span className="text-neutral-950">{store.name || 'Store'}</span>
            </nav>

            <div className="border-2 border-neutral-950 bg-white p-6 shadow-[10px_10px_0_#171717] sm:p-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    <Store size={12} />
                    Seller Storefront
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:leading-[1.1] text-neutral-950">
                  {store.name || 'Store'}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-neutral-600">
                  <span className="border-r-2 border-neutral-300 pr-4">
                    <strong className="text-neutral-950">{products.length}</strong> Item{products.length === 1 ? '' : 's'}
                  </span>
                  {location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-neutral-500" />
                      {location}
                    </span>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-neutral-700 sm:grid-cols-4 border-t-2 border-neutral-100 pt-6">
                  {store.owner && (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-widest text-neutral-500">Owner</span>
                      <span className="mt-1 block font-medium">{store.owner}</span>
                    </div>
                  )}

                  {store.default_fulfillment_channel && (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-widest text-neutral-500">Fulfillment</span>
                      <span className="mt-1 block font-medium">
                        {String(store.default_fulfillment_channel).replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}

                  {store.shipping_acceptance_time && (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-widest text-neutral-500">Acceptance Time</span>
                      <span className="mt-1 block font-medium">{store.shipping_acceptance_time}</span>
                    </div>
                  )}

                  {store.handling_time_business_days && (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-widest text-neutral-500">Handling Time</span>
                      <span className="mt-1 block font-medium">
                        {store.handling_time_business_days} business day{Number(store.handling_time_business_days) === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-72 shrink-0 border-2 border-neutral-950 bg-neutral-50 p-5 shadow-[4px_4px_0_#171717]">
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-950">Store Overview</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-700">
                  Scroll the full catalog and shop directly from this seller.
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">
                  Browse every published item in one place, search within the store, and sort products the way you want.
                </p>
                {store.gst_number && (
                  <div className="mt-4 border-t-2 border-neutral-200 pt-4">
                    <span className="block text-xs font-semibold uppercase tracking-widest text-neutral-500">GST Number</span>
                    <span className="mt-1 block text-sm font-bold">{store.gst_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 border-2 border-neutral-950 bg-white p-3 shadow-[8px_8px_0_#171717] sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <form onSubmit={event => event.preventDefault()} className="relative flex w-full max-w-sm items-center sm:w-80">
                <div className="absolute left-3 text-neutral-500">
                  <Search size={16} />
                </div>
                <input 
                  type="search" 
                  value={search} 
                  placeholder="Search this store" 
                  onChange={event => setSearch(event.target.value)} 
                  className="h-10 w-full border-2 border-neutral-300 bg-white pl-10 pr-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-neutral-950" 
                />
              </form>

              <div className="flex items-center gap-3">
                <SlidersHorizontal size={16} className="hidden text-neutral-500 sm:block" />
                <select 
                  value={sortBy} 
                  onChange={event => setSortBy(event.target.value)}
                  className="h-10 w-full min-w-40 border-2 border-neutral-300 bg-white px-3 text-sm font-semibold uppercase tracking-widest text-neutral-950 outline-none transition focus:border-neutral-950 sm:w-auto"
                >
                  <option value="latest">Newest</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-asc">Price low</option>
                  <option value="price-desc">Price high</option>
                </select>
              </div>
            </div>

            {filteredProducts.length ? (
              <>
                <div className="flex items-center justify-between border-t-2 border-neutral-950 pt-4">
                  <span className="text-sm font-bold uppercase tracking-widest text-neutral-950">
                    {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} shown
                  </span>
                  {search && (
                    <button type="button" onClick={() => setSearch('')} className="text-sm font-bold uppercase tracking-widest text-neutral-500 hover:text-neutral-950 transition">
                      Clear search
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                  {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
                </div>
              </>
            ) : (
              <div className="border-2 border-neutral-950 bg-white p-8 shadow-[8px_8px_0_#171717]">
                <div className="max-w-md">
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">No products matched this store search</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">
                    Try another keyword or explore more products from the main catalog.
                  </p>
                  <Link href="/" className="mt-5 inline-flex items-center justify-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
                    Back home <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
export default BuyerStore;
