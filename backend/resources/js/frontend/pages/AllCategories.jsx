import React, { useState, useEffect } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getCategoryIcon, getRootCategories } from '../utils/categoryPresentation';

export const AllCategories = () => {
  const { props, url } = usePage();
  const [categories, setCategories] = useState(props.categories || []);
  const [loading, setLoading] = useState(false);

  const search = new URL(url || window.location.href, window.location.origin).searchParams.get('search') || '';

  useEffect(() => {
    setCategories(Array.isArray(props.categories) ? props.categories : []);
    setLoading(false);
  }, [props.categories]);

  const rootCategories = getRootCategories(categories).filter((category) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      category.name.toLowerCase().includes(query)
      || category.displayName.toLowerCase().includes(query)
      || category.children.some((sub) => sub.name.toLowerCase().includes(query))
    );
  });

  const handleCategoryClick = (catId) => {
    router.visit(`/categories/${catId}`, { preserveScroll: true });
  };

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-950">
      <Navbar />

      <div className="border-b-2 border-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="border-2 border-neutral-950 bg-white p-6 shadow-[10px_10px_0_#171717] sm:p-8">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <button onClick={() => router.visit('/')} className="transition hover:text-neutral-950">Home</button>
              <span>/</span>
              <span className="text-neutral-950">All Categories</span>
            </nav>
            <span className="mt-4 block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Store directory</span>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              {search ? `Categories for "${search}"` : 'All Categories'}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">
              Choose a department first, then refine through subcategories, price, stock, and brand filters.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="border-2 border-neutral-950 bg-white p-6 text-sm text-neutral-600 shadow-[8px_8px_0_#171717]">Loading categories...</div>
        ) : rootCategories.length === 0 ? (
          <div className="border-2 border-neutral-950 bg-white p-6 text-sm text-neutral-600 shadow-[8px_8px_0_#171717]">No categories found.</div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b-2 border-neutral-950 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Category overview</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">{rootCategories.length} active departments</h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-neutral-600">
                Every department opens into a full catalog view with filters and seller-backed product listings.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rootCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="group cursor-pointer border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717] transition hover:-translate-y-1"
                >
                  <div className="mb-5 inline-flex h-14 w-14 items-center justify-center border-2 border-neutral-950 bg-neutral-100 text-neutral-700">
                    {getCategoryIcon(cat.name, 24)}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{cat.displayName}</h3>

                    {cat.children?.length > 0 && (
                      <ul className="space-y-2 border-t border-neutral-200 pt-4">
                        {cat.children.slice(0, 3).map((sub) => (
                          <li
                            key={sub.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCategoryClick(sub.id);
                            }}
                            className="flex items-center gap-2 text-sm text-neutral-600 transition hover:text-neutral-950"
                          >
                            <ChevronRight size={12} />
                            <span>{sub.name}</span>
                          </li>
                        ))}
                        {cat.children.length > 3 && <li className="text-sm text-neutral-500">+{cat.children.length - 3} more</li>}
                      </ul>
                    )}
                  </div>

                  <span className="mt-5 inline-flex items-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
                    View Category <ChevronRight size={12} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AllCategories;
