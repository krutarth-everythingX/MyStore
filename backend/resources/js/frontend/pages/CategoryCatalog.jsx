import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  BookOpen,
  Briefcase,
  Car,
  Check,
  Dumbbell,
  FileText,
  Gamepad,
  Gamepad2,
  Gift,
  Heart,
  Home as HomeIcon,
  Laptop,
  Layers,
  Leaf,
  Music,
  PenTool,
  Plug,
  Search,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Watch,
  Wrench,
  X,
  Code,
} from 'lucide-react';

const ALLOWED_MAIN_CATEGORIES = [
  { name: 'Electronics', match: 'Computers & Electronics' },
  { name: 'Fashion', match: 'Fashion & Apparel' },
  { name: 'Baby Product', match: 'Baby Products' },
  { name: 'Toys', match: 'Entertainment & Toys' },
  { name: 'Home & Kitchen', match: 'Home & Kitchen' },
  { name: 'Tools', match: 'Industrial & Tools' },
  { name: 'Accessories', match: 'Jewelry & Accessories' },
  { name: 'Sports', match: 'Sports & Fitness' },
  { name: 'Books', match: 'Books & Media' },
  { name: 'Furniture', match: 'Furniture & Decor' },
];

const getCategoryDisplayName = (name) => {
  if (!name) return '';
  const allowed = ALLOWED_MAIN_CATEGORIES.find(
    (item) => item.match.toLowerCase() === name.toLowerCase(),
  );
  return allowed ? allowed.name : name;
};

const getCategoryIcon = (name, size = 18) => {
  const norm = (name || '').toLowerCase();
  if (norm.includes('automotive') || norm.includes('car')) return <Car size={size} />;
  if (norm.includes('baby')) return <Baby size={size} />;
  if (norm.includes('computer') || norm.includes('electronic') || norm.includes('laptop') || norm.includes('phone')) return <Laptop size={size} />;
  if (norm.includes('book') || norm.includes('media') || norm.includes('reading')) return <BookOpen size={size} />;
  if (norm.includes('toy') || norm.includes('entertainment')) return <Gamepad2 size={size} />;
  if (norm.includes('fashion') || norm.includes('apparel') || norm.includes('clothing') || norm.includes('shirt')) return <Shirt size={size} />;
  if (norm.includes('grocery') || norm.includes('food') || norm.includes('snack')) return <ShoppingBag size={size} />;
  if (norm.includes('home') || norm.includes('kitchen') || norm.includes('furniture') || norm.includes('lighting')) return <HomeIcon size={size} />;
  if (norm.includes('industrial') || norm.includes('tool') || norm.includes('equipment')) return <Wrench size={size} />;
  if (norm.includes('jewelry') || norm.includes('watch') || norm.includes('accessory')) return <Watch size={size} />;
  if (norm.includes('kid')) return <Smile size={size} />;
  if (norm.includes('luggage') || norm.includes('bag') || norm.includes('backpack')) return <Briefcase size={size} />;
  if (norm.includes('musical') || norm.includes('instrument') || norm.includes('guitar')) return <Music size={size} />;
  if (norm.includes('novelty') || norm.includes('gift')) return <Gift size={size} />;
  if (norm.includes('office') || norm.includes('stationery') || norm.includes('planner')) return <PenTool size={size} />;
  if (norm.includes('pet') || norm.includes('dog') || norm.includes('cat')) return <Heart size={size} />;
  if (norm.includes('recreation') || norm.includes('sport') || norm.includes('fitness') || norm.includes('camp')) return <Dumbbell size={size} />;
  if (norm.includes('software') || norm.includes('app')) return <Code size={size} />;
  if (norm.includes('utility') || norm.includes('hardware') || norm.includes('plug') || norm.includes('bulb')) return <Plug size={size} />;
  if (norm.includes('video game') || norm.includes('console')) return <Gamepad size={size} />;
  if (norm.includes('wellness') || norm.includes('cosmetic') || norm.includes('makeup')) return <Sparkles size={size} />;
  if (norm.includes('paper') || norm.includes('notebook')) return <FileText size={size} />;
  if (norm.includes('yard') || norm.includes('garden') || norm.includes('seed') || norm.includes('eco')) return <Leaf size={size} />;
  return <Layers size={size} />;
};

const getProductPrice = (product) => Number(product.sale_price ?? product.regular_price ?? 0);

const SORT_OPTIONS = [
  { value: 'latest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export const CategoryCatalog = () => {
  const { props, url } = usePage();
  const currentUrl = new URL(url || window.location.href, window.location.origin);
  const search = currentUrl.searchParams.get('search') || '';
  const [products, setProducts] = useState(props.products || []);
  const [categories, setCategories] = useState(props.categories || []);
  const [brands, setBrands] = useState(props.brands || []);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [searchDraft, setSearchDraft] = useState(search);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 12;

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
    setSearchDraft(search);
    setCurrentPage(1);
  }, [activeCategoryId, search]);

  const activeCategory = categories.find((category) => String(category.id) === activeCategoryId);
  const parentCategory = activeCategory?.parent_id
    ? categories.find((category) => category.id === activeCategory.parent_id)
    : null;
  const categoryChildren = activeCategory
    ? categories.filter((category) => category.parent_id === activeCategory.id)
    : [];
  const siblingCategories = parentCategory
    ? categories.filter((category) => category.parent_id === parentCategory.id)
    : [];
  const categoryFilterOptions = categoryChildren.length > 0 ? categoryChildren : siblingCategories;

  const breadcrumbs = useMemo(() => {
    const trail = [];
    let current = activeCategory;

    while (current) {
      trail.unshift(current);
      current = current.parent_id
        ? categories.find((category) => category.id === current.parent_id)
        : null;
    }

    return trail;
  }, [activeCategory, categories]);

  const categoryBrands = brands.filter((brand) =>
    products.some((product) => product.brand_id === brand.id),
  );

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

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const catalogTitle = activeCategory ? getCategoryDisplayName(activeCategory.name) : 'Category';
  const localFiltersApplied = Boolean(selectedBrand || minPrice !== '' || maxPrice !== '' || onlyInStock || sortBy !== 'latest');
  const filterButtonLabel = localFiltersApplied ? 'Filter applied' : 'Filters';

  const visitCategory = (categoryId, nextSearch = search) => {
    const params = new URLSearchParams();
    if (nextSearch) params.set('search', nextSearch);
    setLoading(true);
    router.visit(`/categories/${categoryId}${params.toString() ? `?${params.toString()}` : ''}`, {
      preserveScroll: false,
      preserveState: true,
      only: ['products', 'categories', 'brands', 'activeCategoryId', 'searchSuggestion'],
    });
  };

  const handleSearch = (query) => {
    visitCategory(activeCategoryId, query);
  };

  const handleToolbarSearch = (event) => {
    event.preventDefault();
    handleSearch(searchDraft.trim());
  };

  const handleSortSelect = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const resetLocalFilters = () => {
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setOnlyInStock(false);
    setSortBy('latest');
    setCurrentPage(1);
  };

  const renderCategoryFilters = (isMobile = false) => (
    <div className={isMobile ? 'flex flex-col gap-2' : 'grid grid-cols-1 gap-2'}>
      {parentCategory && (
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-left text-xs font-semibold text-neutral-600 transition-all hover:border-neutral-400 hover:text-neutral-900"
          onClick={() => visitCategory(parentCategory.id)}
        >
          <ArrowLeft size={14} />
          <span>Back to {getCategoryDisplayName(parentCategory.name)}</span>
        </button>
      )}

      {categoryFilterOptions.map((category) => {
        const active = String(category.id) === activeCategoryId;

        return (
          <button
            key={category.id}
            type="button"
            className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
              active
                ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:text-neutral-950'
            }`}
            onClick={() => visitCategory(category.id)}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-white/15' : 'bg-neutral-100 text-neutral-700'}`}>
              {getCategoryIcon(category.name, 15)}
            </span>
            <span className="min-w-0 flex-1 text-xs font-bold uppercase tracking-wider">
              {getCategoryDisplayName(category.name)}
            </span>
            {active && <Check size={14} className="shrink-0" />}
          </button>
        );
      })}
    </div>
  );

  const renderBrandFilters = () => (
    <div className="grid grid-cols-1 gap-2">
      {categoryBrands.length > 0 ? (
        categoryBrands.map((brand) => {
          const active = selectedBrand === String(brand.id);

          return (
            <button
              key={brand.id}
              type="button"
              className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                active
                  ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:text-neutral-950'
              }`}
              onClick={() => {
                setSelectedBrand(active ? '' : String(brand.id));
                setCurrentPage(1);
              }}
            >
              <span className="truncate text-xs font-bold uppercase tracking-wider">{brand.name}</span>
              {active && <Check size={14} className="shrink-0" />}
            </button>
          );
        })
      ) : (
        <p className="rounded-xl border border-neutral-100 bg-white px-3 py-3 text-xs text-neutral-400">
          No brands in this category yet.
        </p>
      )}
    </div>
  );

  const renderPriceFilters = () => (
    <div className="grid grid-cols-2 gap-2">
      <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        Min
        <input
          type="number"
          min="0"
          value={minPrice}
          className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-900"
          onChange={(event) => {
            setMinPrice(event.target.value);
            setCurrentPage(1);
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        Max
        <input
          type="number"
          min="0"
          value={maxPrice}
          className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-900"
          onChange={(event) => {
            setMaxPrice(event.target.value);
            setCurrentPage(1);
          }}
        />
      </label>
    </div>
  );

  const renderSortFilter = () => (
    <div className="grid grid-cols-1 gap-2">
      {SORT_OPTIONS.map((option) => {
        const active = sortBy === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
              active
                ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:text-neutral-950'
            }`}
            onClick={() => handleSortSelect(option.value)}
          >
            <span className="text-xs font-bold uppercase tracking-wider">{option.label}</span>
            {active && <Check size={14} className="shrink-0" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Navbar onSearch={handleSearch} opaque />

      <main className="flex-1 min-h-[100dvh]">
        <section className="border-b border-neutral-100 bg-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <nav className="hidden flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 sm:flex">
              <Link href="/" className="hover:text-neutral-800">Home</Link>
              <span>/</span>
              <Link href="/categories" className="hover:text-neutral-800">Categories</Link>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <span>/</span>
                  <Link
                    href={`/categories/${crumb.id}`}
                    className={String(crumb.id) === activeCategoryId ? 'text-neutral-900' : 'hover:text-neutral-800'}
                  >
                    {getCategoryDisplayName(crumb.name)}
                  </Link>
                </React.Fragment>
              ))}
            </nav>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <span className="mb-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Category catalog
                </span>
                <h1 className="font-serif text-3xl font-semibold leading-tight text-neutral-950 sm:text-5xl">
                  {search ? `${catalogTitle}: "${search}"` : catalogTitle}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                  Browse this category only, then refine by subcategory, brand, price, and availability.
                </p>
              </div>

              {localFiltersApplied && (
                <button
                  type="button"
                  className="w-fit rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-950"
                  onClick={resetLocalFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <aside className="hidden">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-950">Subcategories</h2>
                <Link href="/categories" className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900">
                  Directory
                </Link>
              </div>
              {categoryFilterOptions.length > 0 || parentCategory ? (
                renderCategoryFilters()
              ) : (
                <p className="rounded-xl border border-neutral-100 bg-white px-3 py-3 text-xs text-neutral-400">
                  No subcategories yet.
                </p>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-950">Brands</h2>
              {renderBrandFilters()}
            </div>

            <div>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-950">Price</h2>
              {renderPriceFilters()}
            </div>

            <div>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-950">Sort</h2>
              {renderSortFilter()}
            </div>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-xs font-bold uppercase tracking-wider text-neutral-700">
              In stock only
              <input
                type="checkbox"
                checked={onlyInStock}
                className="h-4 w-4 accent-neutral-900"
                onChange={(event) => {
                  setOnlyInStock(event.target.checked);
                  setCurrentPage(1);
                }}
              />
            </label>

            <button
              type="button"
              className="rounded-full border border-neutral-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-widest text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-950"
              onClick={resetLocalFilters}
            >
              Reset filters
            </button>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-neutral-200 pb-4">
              <button
                type="button"
                className={`flex h-11 items-center gap-2 rounded-full border px-4 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  localFiltersApplied
                    ? 'border-neutral-950 bg-neutral-950 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
                onClick={() => setMobileFilterOpen(true)}
              >
                <SlidersHorizontal size={13} />
                {filterButtonLabel}
              </button>

              <form
                className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-neutral-400"
                onSubmit={handleToolbarSearch}
              >
                <Search size={14} />
                <input
                  type="search"
                  value={searchDraft}
                  className="min-w-0 flex-1 bg-transparent text-xs text-neutral-800 outline-none placeholder:text-neutral-400"
                  placeholder="Search within this category"
                  onChange={(event) => setSearchDraft(event.target.value)}
                />
              </form>
            </div>

            {loading ? (
              <div className="flex min-h-72 items-center justify-center text-sm text-neutral-500">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex min-h-72 items-center justify-center rounded-2xl border border-neutral-100 bg-white">
                <div className="flex max-w-sm flex-col items-center gap-4 p-8 text-center">
                  <h3 className="font-serif text-xl font-semibold text-neutral-950">Nothing matches this category edit yet</h3>
                  <p className="text-sm text-neutral-500">Try another subcategory, brand, or price range.</p>
                  <button
                    type="button"
                    className="rounded-full bg-neutral-950 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-neutral-900"
                    onClick={resetLocalFilters}
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12 flex flex-wrap items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-neutral-950 font-bold text-white'
                            : 'text-neutral-500 hover:bg-neutral-100'
                        }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setMobileFilterOpen(false)}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" />
          <div
            className="relative z-50 flex h-full w-[min(92vw,28rem)] flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sm:px-6">
              <h3 className="font-semibold text-neutral-950">Filters</h3>
              <button
                type="button"
                className="rounded-full p-1 text-neutral-400 hover:text-neutral-900"
                onClick={() => setMobileFilterOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-5 sm:px-6">
              <div>
                <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-950">Subcategories</h4>
                {categoryFilterOptions.length > 0 || parentCategory ? renderCategoryFilters(true) : (
                  <p className="text-sm text-neutral-400">No subcategories yet.</p>
                )}
              </div>

              <div>
                <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-950">Brands</h4>
                {renderBrandFilters()}
              </div>

              <div>
                <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-950">Price</h4>
                {renderPriceFilters()}
              </div>

              <div>
                <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-950">Sort</h4>
                {renderSortFilter()}
              </div>

              <label className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-xs font-bold uppercase tracking-wider text-neutral-700">
                In stock only
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  className="h-4 w-4 accent-neutral-900"
                  onChange={(event) => {
                    setOnlyInStock(event.target.checked);
                    setCurrentPage(1);
                  }}
                />
              </label>
            </div>

            <div className="flex gap-2 border-t border-neutral-100 bg-neutral-50 px-5 py-4 sm:px-6">
              <button
                type="button"
                className="flex-1 rounded-full bg-neutral-950 py-3 text-xs font-bold uppercase tracking-widest text-white"
                onClick={() => setMobileFilterOpen(false)}
              >
                Apply
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border border-neutral-200 bg-white py-3 text-xs font-bold uppercase tracking-widest text-neutral-600"
                onClick={resetLocalFilters}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CategoryCatalog;
