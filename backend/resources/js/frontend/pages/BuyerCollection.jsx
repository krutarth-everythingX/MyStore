import React, { useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
const getProductPrice = product => Number(product.sale_price ?? product.regular_price ?? 0);
export const BuyerCollection = () => {
  const {
    props
  } = usePage();
  const collection = props.collection || {};
  const products = Array.isArray(props.products) ? props.products : [];
  const [sortBy, setSortBy] = useState('manual');
  const filteredProducts = useMemo(() => [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return getProductPrice(a) - getProductPrice(b);
    if (sortBy === 'price-desc') return getProductPrice(b) - getProductPrice(a);
    if (sortBy === 'latest') return b.id - a.id;
    return 0;
  }), [products, sortBy]);
  const handleSearch = query => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    router.visit(`/categories${params.toString() ? `?${params.toString()}` : ''}`);
  };
  return <div className="min-h-dvh bg-neutral-50 text-neutral-950">
      <Navbar onSearch={handleSearch} opaque />

      <main>
        <section className="border-b-2 border-neutral-950">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="border-2 border-neutral-950 bg-white p-6 shadow-[10px_10px_0_#171717] sm:p-8">
              <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                <Link href="/" className="transition hover:text-neutral-950">Home</Link>
                <span>/</span>
                <span className="text-neutral-950">{collection.title || 'Collection'}</span>
              </nav>

              <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    {collection.type === 'smart' ? 'Smart collection' : 'Curated collection'}
                  </span>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                    {collection.title || 'Collection'}
                  </h1>
                  {collection.description && <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">
                      {collection.description}
                    </p>}
                </div>

                {collection.image && <div className="hidden h-32 w-32 shrink-0 overflow-hidden border-2 border-neutral-950 bg-neutral-100 shadow-[4px_4px_0_#171717] md:block">
                    <img src={collection.image} alt="" className="h-full w-full object-cover" />
                  </div>}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 border-2 border-neutral-950 bg-white p-3 shadow-[8px_8px_0_#171717] sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <SlidersHorizontal size={16} className="text-neutral-500" />
                <select value={sortBy} onChange={event => setSortBy(event.target.value)} className="h-10 w-full min-w-40 border-2 border-neutral-300 bg-white px-3 text-sm font-semibold uppercase tracking-widest text-neutral-950 outline-none transition focus:border-neutral-950 sm:w-auto">
                  <option value="manual">Featured</option>
                  <option value="latest">Newest</option>
                  <option value="price-asc">Price low</option>
                  <option value="price-desc">Price high</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full justify-start sm:w-auto sm:justify-end">
                <span className="inline-flex h-11 items-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-3 text-xs font-medium text-white sm:px-4 sm:text-sm">
                  <span>Collection</span>
                  <span className="border-l-2 border-white/20 pl-3 font-semibold">{collection.title || 'All'}</span>
                </span>
              </div>
            </div>

            {filteredProducts.length ? <>
                <div className="flex items-center justify-between border-t-2 border-neutral-950 pt-4">
                  <span className="text-sm font-bold uppercase tracking-widest text-neutral-950">{filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} shown</span>
                </div>
                <div className="grid grid-cols-2 gap-3 border-neutral-950 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                  {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
                </div>
              </> : <div className="border-2 border-neutral-950 bg-white p-8 shadow-[8px_8px_0_#171717]">
                <div className="max-w-md">
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">No products in this collection yet</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">Try another collection or check back after the seller adds more products.</p>
                  <Link href="/" className="mt-5 inline-flex items-center justify-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
                    Back home <ArrowRight size={14} />
                  </Link>
                </div>
              </div>}
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};
export default BuyerCollection;
