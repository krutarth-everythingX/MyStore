import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { formatMoney, getUserLocalization } from '../utils/localization';
import { getCategoryDisplayName, getCategoryIcon } from '../utils/categoryPresentation';
import { DEFAULT_BATCH_SIZE, useInfiniteReveal } from '../utils/infiniteScroll';

const getProductPrice = (product) => Number(product.sale_price ?? product.regular_price ?? 0);

const SORT_OPTIONS = [
  { value: 'latest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

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

export const CategoryCatalog = () => {
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
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState({
    subcategories: true,
    brands: false,
    price: false,
    sort: false,
    stock: false,
  });

  const itemsPerPage = DEFAULT_BATCH_SIZE;
  const activeCategoryId = String(props.activeCategoryId || currentUrl.pathname.split('/').filter(Boolean).pop() || '');

  useEffect(() => {
    setProducts(Array.isArray(props.products) ? props.products : []);
    setCategories(Array.isArray(props.categories) ? props.categories : []);
    setBrands(Array.isArray(props.brands) ? props.brands : []);
    setLoading(false);
  }, [props.products, props.categories, props.brands]);

  useEffect(() => {
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setOnlyInStock(false);
    setSortBy('latest');
    setFiltersOpen(false);
  }, [activeCategoryId, search]);

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

  const activeCategory = categories.find((category) => String(category.id) === activeCategoryId);
  const parentCategory = activeCategory?.parent_id ? categories.find((category) => category.id === activeCategory.parent_id) : null;
  const categoryChildren = activeCategory ? categories.filter((category) => category.parent_id === activeCategory.id) : [];
  const siblingCategories = parentCategory ? categories.filter((category) => category.parent_id === parentCategory.id) : [];
  const categoryFilterOptions = categoryChildren.length > 0 ? categoryChildren : siblingCategories;

  const breadcrumbs = useMemo(() => {
    const trail = [];
    let current = activeCategory;
    while (current) {
      trail.unshift(current);
      current = current.parent_id ? categories.find((category) => category.id === current.parent_id) : null;
    }
    return trail;
  }, [activeCategory, categories]);

  const categoryBrands = brands.filter((brand) => products.some((product) => product.brand_id === brand.id));
  const brandFacetCounts = useMemo(() => new Map((facets.brands || []).map((brand) => [String(brand.id), brand.count])), [facets.brands]);
  const totalResultCount = Number(searchMeta.total ?? products.length);

  const filteredProducts = products
    .filter((product) => {
      const price = getProductPrice(product);
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

  const catalogTitle = activeCategory ? getCategoryDisplayName(activeCategory.name) : 'Category';
  const localFiltersApplied = Boolean(selectedBrand || minPrice !== '' || maxPrice !== '' || onlyInStock || sortBy !== 'latest');
  const activeFilterCount = [selectedBrand, minPrice !== '' ? 'min' : '', maxPrice !== '' ? 'max' : '', onlyInStock ? 'stock' : '', sortBy !== 'latest' ? 'sort' : ''].filter(Boolean).length;
  const filterButtonLabel = activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters';
  const infiniteResetKey = JSON.stringify([activeCategoryId, search, selectedBrand, minPrice, maxPrice, onlyInStock, sortBy, filteredProducts.length]);
  const { visibleItems, hasMore, sentinelRef } = useInfiniteReveal(filteredProducts, itemsPerPage, infiniteResetKey);

  const visitCategory = (categoryId, nextSearch = search) => {
    const params = new URLSearchParams();
    if (nextSearch) params.set('search', nextSearch);
    setLoading(true);
    router.visit(`/categories/${categoryId}${params.toString() ? `?${params.toString()}` : ''}`, {
      preserveScroll: false,
      preserveState: true,
      only: ['products', 'categories', 'brands', 'activeCategoryId', 'searchMeta', 'searchSuggestion'],
    });
  };

  const handleSearch = (query) => {
    visitCategory(activeCategoryId, query);
  };

  const toggleSection = (section) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const resetLocalFilters = () => {
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setOnlyInStock(false);
    setSortBy('latest');
  };

  const renderCategoryFilters = () => (
    <div className="space-y-2">
      {parentCategory && (
        <button type="button" onClick={() => visitCategory(parentCategory.id)} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 transition hover:text-neutral-950">
          <ArrowLeft size={14} />
          <span>Back to {getCategoryDisplayName(parentCategory.name)}</span>
        </button>
      )}

      {categoryFilterOptions.map((category) => {
        const active = String(category.id) === activeCategoryId;
        return (
          <FilterButton
            key={category.id}
            active={active}
            onClick={() => visitCategory(category.id)}
            trailing={active ? <Check size={14} /> : null}
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
      {categoryBrands.length > 0 ? (
        categoryBrands.map((brand) => {
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
        <p className="text-sm text-neutral-500">No brands in this category yet.</p>
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
      <Navbar onSearch={handleSearch} opaque />

      <main>
        <section className="border-b-2 border-neutral-950">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="border-2 border-neutral-950 bg-white p-6 shadow-[10px_10px_0_#171717] sm:p-8">
              <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                <Link href="/" className="transition hover:text-neutral-950">Home</Link>
                <span>/</span>
                <Link href="/categories" className="transition hover:text-neutral-950">Categories</Link>
                {breadcrumbs.map((crumb) => (
                  <React.Fragment key={crumb.id}>
                    <span>/</span>
                    <Link href={`/categories/${crumb.id}`} className="transition hover:text-neutral-950">
                      {getCategoryDisplayName(crumb.name)}
                    </Link>
                  </React.Fragment>
                ))}
              </nav>

              <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Category catalog</span>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                    {search ? `${catalogTitle}: "${search}"` : catalogTitle}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">
                    {searchSuggestion.is_corrected
                      ? `Showing results for "${searchSuggestion.corrected_search}" instead of "${searchSuggestion.original_search}".`
                      : `${totalResultCount} result${totalResultCount === 1 ? '' : 's'} available in this view.`}
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
                <span className="inline-flex h-11 items-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-3 text-xs font-medium text-white sm:px-4 sm:text-sm">
                  <span>Category</span>
                  <span className="border-l-2 border-white/20 pl-3 font-semibold">{catalogTitle}</span>
                </span>
                {selectedBrand && (
                  <span className="inline-flex h-11 items-center gap-2 border-2 border-neutral-950 bg-white px-3 text-xs font-medium text-neutral-950 sm:px-4 sm:text-sm">
                    Brand
                    <span className="border-l-2 border-neutral-200 pl-3">{brands.find((brand) => String(brand.id) === selectedBrand)?.name}</span>
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="border-2 border-neutral-950 bg-white p-6 text-sm text-neutral-600 shadow-[8px_8px_0_#171717]">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="border-2 border-neutral-950 bg-white p-8 shadow-[8px_8px_0_#171717]">
                <div className="max-w-md">
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Nothing matches this category yet</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">Try another subcategory, brand, or price range.</p>
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
                    You have reached the end of this catalog.
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
                <p className="mt-1 text-xs text-neutral-500 sm:text-sm">Refine this category without leaving the products grid.</p>
              </div>
              <button type="button" onClick={() => setFiltersOpen(false)} className="inline-flex h-10 w-10 items-center justify-center border-2 border-neutral-950 bg-white sm:h-11 sm:w-11">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                <FilterSection title="Subcategories" open={openSections.subcategories} onToggle={() => toggleSection('subcategories')} contentClassName="max-h-64 overflow-y-auto">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Browse deeper</span>
                    <Link href="/categories" className="text-sm font-medium text-neutral-950">Directory</Link>
                  </div>
                  {categoryFilterOptions.length > 0 || parentCategory ? renderCategoryFilters() : <p className="text-sm text-neutral-500">No subcategories yet.</p>}
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

export default CategoryCatalog;
