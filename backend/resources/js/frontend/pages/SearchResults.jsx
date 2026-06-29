import React, { useEffect, useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { formatMoney, getUserLocalization } from '../utils/localization';
import { getCategoryDisplayName, getCategoryIcon, getRootCategories } from '../utils/categoryPresentation';
import { DEFAULT_BATCH_SIZE, useInfiniteReveal } from '../utils/infiniteScroll';

const SORT_OPTIONS = [
  { value: 'latest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const getProductPrice = (product) => Number(product.sale_price ?? product.regular_price ?? 0);

const productMatchesCategory = (product, categoryId) => {
  if (!categoryId) return true;
  return product.categories?.some((category) => String(category.id) === categoryId || String(category.parent_id) === categoryId);
};

const FilterSection = ({ title, children, open, onToggle, contentClassName = '' }) => (
  <div className="border-2 border-neutral-950 bg-white shadow-[6px_6px_0_#171717]">
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{title}</h2>
      <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className={`space-y-2 px-4 pb-4 ${contentClassName}`}>{children}</div>}
  </div>
);

const FilterButton = ({ active, onClick, children, trailing }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center justify-between gap-3 border-2 px-3 py-3 text-left text-sm transition ${active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-950 hover:text-neutral-950'}`}
  >
    <span className="flex items-center gap-2">{children}</span>
    {trailing}
  </button>
);

export const SearchResults = () => {
  const { props, url } = usePage();
  const localization = getUserLocalization(props);
  const currentUrl = new URL(url || window.location.href, window.location.origin);
  const search = currentUrl.searchParams.get('search') || '';
  const searchMeta = props.searchMeta || {};
  const searchSuggestion = props.searchSuggestion || {};
  const facets = searchMeta.facets || {};

  const [products, setProducts] = useState(props.products || []);
  const [categories, setCategories] = useState(props.categories || []);
  const [brands, setBrands] = useState(props.brands || []);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: false,
    price: false,
    sort: false,
    stock: false,
  });

  const itemsPerPage = DEFAULT_BATCH_SIZE;

  useEffect(() => {
    setProducts(Array.isArray(props.products) ? props.products : []);
    setCategories(Array.isArray(props.categories) ? props.categories : []);
    setBrands(Array.isArray(props.brands) ? props.brands : []);
  }, [props.products, props.categories, props.brands]);

  useEffect(() => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setOnlyInStock(false);
    setSortBy('latest');
    setFiltersOpen(false);
  }, [search]);

  useEffect(() => {
    if (!filtersOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [filtersOpen]);

  const rootCategories = useMemo(() => getRootCategories(categories), [categories]);
  const brandFacetCounts = useMemo(() => new Map((facets.brands || []).map((brand) => [String(brand.id), brand.count])), [facets.brands]);
  const categoryFacetCounts = useMemo(() => new Map((facets.categories || []).map((category) => [String(category.id), category.count])), [facets.categories]);
  const totalResultCount = Number(searchMeta.total ?? products.length);

  const filteredProducts = products
    .filter((product) => {
      const price = getProductPrice(product);
      if (!productMatchesCategory(product, selectedCategory)) return false;
      if (selectedBrand && String(product.brand_id) !== selectedBrand) return false;
      if (minPrice !== '' && price < Number(minPrice)) return false;
      if (maxPrice !== '' && price > Number(maxPrice)) return false;
      if (onlyInStock && product.stock_status !== 'instock') return false;
      return true;
    })
    .sort((a, b) => {
      const priceA = getProductPrice(a);
      const priceB = getProductPrice(b);
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      return b.id - a.id;
    });

  const visibleBrands = brands.filter((brand) => products.some((product) => product.brand_id === brand.id && productMatchesCategory(product, selectedCategory)));
  const localFiltersApplied = Boolean(selectedCategory || selectedBrand || minPrice !== '' || maxPrice !== '' || onlyInStock || sortBy !== 'latest');
  const activeFilterCount = [selectedCategory, selectedBrand, minPrice !== '' ? 'min' : '', maxPrice !== '' ? 'max' : '', onlyInStock ? 'stock' : '', sortBy !== 'latest' ? 'sort' : ''].filter(Boolean).length;
  const filterButtonLabel = activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters';
  const infiniteResetKey = JSON.stringify([search, selectedCategory, selectedBrand, minPrice, maxPrice, onlyInStock, sortBy, filteredProducts.length]);
  const { visibleItems, hasMore, sentinelRef } = useInfiniteReveal(filteredProducts, itemsPerPage, infiniteResetKey);

  const toggleSection = (section) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const resetLocalFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setOnlyInStock(false);
    setSortBy('latest');
  };

  const renderCategoryFilters = () => (
    <div className="space-y-2">
      {rootCategories.map((category) => {
        const active = selectedCategory === String(category.id);
        return (
          <FilterButton
            key={category.id}
            active={active}
              onClick={() => {
                setSelectedCategory(active ? '' : String(category.id));
                setSelectedBrand('');
              }}
            trailing={(
              <span className="flex items-center gap-2">
                {categoryFacetCounts.has(String(category.id)) && <span className="text-xs">{categoryFacetCounts.get(String(category.id))}</span>}
                {active && <Check size={14} />}
              </span>
            )}
          >
            <span>{getCategoryIcon(category.name, 15)}</span>
            <span>{getCategoryDisplayName(category.name)}</span>
          </FilterButton>
        );
      })}
    </div>
  );

  const renderBrandFilters = () => (
    <div className="space-y-2">
      {visibleBrands.length > 0 ? (
        visibleBrands.map((brand) => {
          const active = selectedBrand === String(brand.id);
          return (
            <FilterButton
              key={brand.id}
              active={active}
              onClick={() => {
                setSelectedBrand(active ? '' : String(brand.id));
              }}
              trailing={(
                <span className="flex items-center gap-2">
                  {brandFacetCounts.has(String(brand.id)) && <span className="text-xs">{brandFacetCounts.get(String(brand.id))}</span>}
                  {active && <Check size={14} />}
                </span>
              )}
            >
              <span>{brand.name}</span>
            </FilterButton>
          );
        })
      ) : (
        <p className="text-sm text-neutral-500">No matching brands yet.</p>
      )}
    </div>
  );

  const renderPriceFilters = () => (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-2 text-sm text-neutral-700">
        <span>Min</span>
        <input
          type="number"
          min="0"
          value={minPrice}
          onChange={(event) => {
            setMinPrice(event.target.value);
          }}
          className="h-11 w-full border-2 border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none focus:border-neutral-950"
        />
      </label>
      <label className="space-y-2 text-sm text-neutral-700">
        <span>Max</span>
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(event) => {
            setMaxPrice(event.target.value);
          }}
          className="h-11 w-full border-2 border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none focus:border-neutral-950"
        />
      </label>
    </div>
  );

  const renderSortFilter = () => (
    <div className="space-y-2">
      {SORT_OPTIONS.map((option) => {
        const active = sortBy === option.value;
        return (
          <FilterButton key={option.value} active={active} onClick={() => {
            setSortBy(option.value);
          }} trailing={active ? <Check size={14} /> : null}>
            <span>{option.label}</span>
          </FilterButton>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-950">
      <Navbar opaque />

      <main>
        <section className="border-b-2 border-neutral-950">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="border-2 border-neutral-950 bg-white p-6 shadow-[10px_10px_0_#171717] sm:p-8">
              <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                <Link href="/" className="transition hover:text-neutral-950">Home</Link>
                <span>/</span>
                <Link href="/search" className="transition hover:text-neutral-950">Search</Link>
                <span>/</span>
                <span className="text-neutral-950">Results</span>
              </nav>

              <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Product search</span>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                    {search ? `Results for "${search}"` : 'Search products'}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">
                    {searchSuggestion.is_corrected
                      ? `Showing products for "${searchSuggestion.corrected_search}" instead of "${searchSuggestion.original_search}".`
                      : search
                        ? `${totalResultCount} product result${totalResultCount === 1 ? '' : 's'} found across the store.`
                        : 'Use the top search bar to find products across the store.'}
                  </p>
                </div>

                {localFiltersApplied && (
                  <button type="button" onClick={resetLocalFilters} className="border-2 border-neutral-950 bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 border-2 border-neutral-950 bg-white p-3 shadow-[8px_8px_0_#171717] sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 border-2 border-neutral-950 bg-white px-4 text-sm font-medium text-neutral-950">
                <SlidersHorizontal size={13} />
                {filterButtonLabel}
              </button>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {search && (
                  <span className="inline-flex h-11 items-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-3 text-xs font-medium text-white sm:px-4 sm:text-sm">
                    <span>Search</span>
                    <span className="border-l-2 border-white/20 pl-3 font-semibold">{search}</span>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex h-11 items-center gap-2 border-2 border-neutral-950 bg-white px-3 text-xs font-medium text-neutral-950 sm:px-4 sm:text-sm">
                    Category
                    <span className="border-l-2 border-neutral-200 pl-3">{rootCategories.find((category) => String(category.id) === selectedCategory)?.displayName || 'Selected'}</span>
                  </span>
                )}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="border-2 border-neutral-950 bg-white p-8 shadow-[8px_8px_0_#171717]">
                <div className="max-w-md">
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">No products found</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">Try another product name or reset the filters.</p>
                  <button type="button" onClick={resetLocalFilters} className="mt-5 border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white">
                    Reset filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 border-t-2 border-neutral-950 pt-4 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                  {visibleItems.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {hasMore ? (
                  <div ref={sentinelRef} className="border-2 border-dashed border-neutral-200 bg-white px-4 py-4 text-center text-sm text-neutral-500">
                    Loading more products...
                  </div>
                ) : filteredProducts.length > itemsPerPage ? (
                  <div className="border-2 border-neutral-200 bg-white px-4 py-4 text-center text-sm text-neutral-500">
                    You have reached the end of these results.
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>

      {filtersOpen && (
        <div className="fixed inset-0 z-[70] bg-neutral-950/35 px-3 py-3 sm:px-6 sm:py-8" onClick={() => setFiltersOpen(false)}>
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col border-2 border-neutral-950 bg-neutral-50 shadow-[10px_10px_0_#171717]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b-2 border-neutral-950 px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-base font-semibold text-neutral-950 sm:text-lg">Set filters</h3>
                <p className="mt-1 text-xs text-neutral-500 sm:text-sm">Choose only the filters you need, then apply.</p>
              </div>
              <button type="button" onClick={() => setFiltersOpen(false)} className="inline-flex h-10 w-10 items-center justify-center border-2 border-neutral-950 bg-white sm:h-11 sm:w-11">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                <FilterSection title="Categories" open={openSections.categories} onToggle={() => toggleSection('categories')} contentClassName="max-h-64 overflow-y-auto">
                  {renderCategoryFilters()}
                </FilterSection>

                <FilterSection title="Brands" open={openSections.brands} onToggle={() => toggleSection('brands')} contentClassName="max-h-64 overflow-y-auto">
                  {renderBrandFilters()}
                </FilterSection>

                <FilterSection title="Price" open={openSections.price} onToggle={() => toggleSection('price')}>
                  {renderPriceFilters()}
                </FilterSection>

                <FilterSection title="Sort" open={openSections.sort} onToggle={() => toggleSection('sort')} contentClassName="max-h-64 overflow-y-auto">
                  {renderSortFilter()}
                </FilterSection>

                <FilterSection title="Stock" open={openSections.stock} onToggle={() => toggleSection('stock')}>
                  <label className="flex items-center justify-between gap-3 border-2 border-neutral-200 px-3 py-3 text-sm text-neutral-700">
                    <span>In stock only</span>
                    <input
                      type="checkbox"
                      checked={onlyInStock}
                      onChange={(event) => {
                        setOnlyInStock(event.target.checked);
                      }}
                      className="h-4 w-4 accent-neutral-950"
                    />
                  </label>
                </FilterSection>
              </div>
            </div>

            <div className="border-t-2 border-neutral-950 px-4 py-4 sm:px-6">
              <div className="flex gap-3 sm:justify-end">
                <button type="button" onClick={resetLocalFilters} className="flex-1 border-2 border-neutral-950 bg-white px-4 py-3 text-sm font-medium text-neutral-950 sm:flex-none sm:px-5">
                  Reset
                </button>
                <button type="button" onClick={() => setFiltersOpen(false)} className="flex-1 border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white sm:flex-none sm:px-5">
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default SearchResults;
