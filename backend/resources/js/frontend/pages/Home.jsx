import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import {
  ArrowRight,
  Baby,
  BookOpen,
  Briefcase,
  Car,
  ChevronDown,
  Dumbbell,
  FileText,
  Gamepad,
  Gamepad2,
  Gift,
  Hammer,
  Heart,
  Home as HomeIcon,
  Laptop,
  Layers,
  Leaf,
  Music,
  PenTool,
  Plug,
  RefreshCw,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Wrench,
  Watch,
  Code,
} from 'lucide-react';
import './Home.css';

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
  if (!name) {
    return '';
  }

  const allowed = ALLOWED_MAIN_CATEGORIES.find(
    (item) => item.match.toLowerCase() === name.toLowerCase(),
  );

  return allowed ? allowed.name : name;
};

const getCategoryIcon = (name, size = 22) => {
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
  if (norm.includes('tool') || norm.includes('knife') || norm.includes('tape')) return <Hammer size={size} />;
  if (norm.includes('recreation') || norm.includes('sport') || norm.includes('fitness') || norm.includes('camp')) return <Dumbbell size={size} />;
  if (norm.includes('software') || norm.includes('app')) return <Code size={size} />;
  if (norm.includes('travel') || norm.includes('outdoor') || norm.includes('tent')) return <Compass size={size} />;
  if (norm.includes('utility') || norm.includes('hardware') || norm.includes('plug') || norm.includes('bulb')) return <Plug size={size} />;
  if (norm.includes('video game') || norm.includes('console')) return <Gamepad size={size} />;
  if (norm.includes('wellness') || norm.includes('cosmetic') || norm.includes('makeup')) return <Sparkles size={size} />;
  if (norm.includes('paper') || norm.includes('notebook')) return <FileText size={size} />;
  if (norm.includes('yard') || norm.includes('garden') || norm.includes('seed') || norm.includes('eco')) return <Leaf size={size} />;

  return <Layers size={size} />;
};

export const Home = () => {
  const { props, url } = usePage();
  const [products, setProducts] = useState(props.products || []);
  const [categories, setCategories] = useState(props.categories || []);
  const [brands, setBrands] = useState(props.brands || []);
  const [loading, setLoading] = useState(false);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [categoryCollapsed, setCategoryCollapsed] = useState(false);
  const [priceCollapsed, setPriceCollapsed] = useState(false);
  const [brandCollapsed, setBrandCollapsed] = useState(false);
  const [availabilityCollapsed, setAvailabilityCollapsed] = useState(false);

  const currentSearchParams = new URL(
    url || window.location.href,
    window.location.origin,
  ).searchParams;

  const search = currentSearchParams.get('search') || '';
  const selectedCategory = currentSearchParams.get('category') || '';
  const exploreMode = currentSearchParams.get('explore') === 'true';
  const showCatalog = selectedCategory !== '' || search !== '' || exploreMode;

  const rootCategories = categories
    .filter((category) => category.parent_id === null)
    .filter((category) =>
      ALLOWED_MAIN_CATEGORIES.some(
        (allowed) => allowed.match.toLowerCase() === category.name.toLowerCase(),
      ),
    )
    .map((category) => ({
      ...category,
      displayName: getCategoryDisplayName(category.name),
    }));

  useEffect(() => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrand('');
    setOnlyInStock(false);
    setBrandSearch('');
  }, [selectedCategory, exploreMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.sort-dropdown-container')) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setProducts(props.products || []);
    setCategories(props.categories || []);
    setBrands(props.brands || []);
    setLoading(false);
  }, [props.products, props.categories, props.brands]);

  const visitWithParams = (params, options = {}) => {
    const query = params.toString();
    const target = query ? `/?${query}` : '/';

    router.get(target, {}, {
      preserveScroll: true,
      preserveState: true,
      only: ['products', 'categories', 'brands'],
      ...options,
    });
  };

  const handleCategorySelect = (id) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    params.delete('explore');

    if (id) {
      params.set('category', id);
    } else {
      params.delete('category');
    }

    setLoading(true);
    visitWithParams(params);
  };

  const handleExploreCatalog = () => {
    const params = new URLSearchParams(currentSearchParams.toString());
    params.delete('category');
    params.set('explore', 'true');
    setLoading(true);
    visitWithParams(params);
  };

  const handleResetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrand('');
    setOnlyInStock(false);
    setSortBy('latest');
    setBrandSearch('');
    setLoading(true);
    visitWithParams(new URLSearchParams());
  };

  const getSearchCategory = () => {
    if (!search || products.length === 0) {
      return null;
    }

    const counts = {};

    products.forEach((product) => {
      product.categories?.forEach((category) => {
        counts[category.id] = (counts[category.id] || 0) + 1;
      });
    });

    const topCategoryId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    return topCategoryId
      ? categories.find((category) => category.id.toString() === topCategoryId.toString())
      : null;
  };

  const searchCategory = getSearchCategory();
  const activeCategory = categories.find(
    (category) => category.id.toString() === selectedCategory,
  ) || searchCategory;

  const activeBreadcrumbs = (() => {
    const crumbs = [];
    let current = activeCategory;

    while (current) {
      crumbs.unshift(current);
      current = current.parent_id
        ? categories.find((category) => category.id === current.parent_id)
        : null;
    }

    return crumbs;
  })();

  const dynamicBrands = brands.filter((brand) =>
    products.some((product) => product.brand_id === brand.id),
  );

  const filteredDynamicBrands = dynamicBrands.filter((brand) =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  const filteredProducts = products
    .filter((product) => {
      const price = product.sale_price !== null ? product.sale_price : product.regular_price;

      if (minPrice !== '' && price < parseFloat(minPrice)) {
        return false;
      }

      if (maxPrice !== '' && price > parseFloat(maxPrice)) {
        return false;
      }

      if (selectedBrand !== '' && product.brand_id?.toString() !== selectedBrand) {
        return false;
      }

      if (onlyInStock && product.stock_status !== 'instock') {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const priceA = a.sale_price !== null ? a.sale_price : a.regular_price;
      const priceB = b.sale_price !== null ? b.sale_price : b.regular_price;

      if (sortBy === 'price-asc') {
        return priceA - priceB;
      }

      if (sortBy === 'price-desc') {
        return priceB - priceA;
      }

      return b.id - a.id;
    });

  const categoryChildren = activeCategory
    ? categories.filter((category) => category.parent_id === activeCategory.id)
    : [];

  const siblingCategories = activeCategory?.parent_id
    ? categories.filter((category) => category.parent_id === activeCategory.parent_id)
    : [];

  const sidebarCategories = categoryChildren.length > 0 ? categoryChildren : siblingCategories;
  const spotlightProducts = filteredProducts.slice(0, 3);
  const arrivalProducts = filteredProducts.slice(0, 8);
  const activeBrandName = brands.find(
    (brand) => brand.id.toString() === selectedBrand,
  )?.name;

  return (
    <div className="buyer-layout">
      <Navbar
        onSearch={(query) => {
          const params = new URLSearchParams(currentSearchParams.toString());
          params.delete('explore');

          if (query) {
            params.set('search', query);
          } else {
            params.delete('search');
          }

          setLoading(true);
          visitWithParams(params);
        }}
      />

      {!showCatalog && (
        <section className="home-hero">
          <div className="container home-hero-grid">
            <div className="home-hero-copy stagger">
              <span className="hero-badge label-md">Modern Chic Editorial</span>
              <h1 className="hero-title display-text">
                Premium essentials, presented with more calm and better rhythm.
              </h1>
              <p className="hero-subtitle body-lg">
                MyStore brings verified sellers, elevated product discovery, and a more spacious
                editorial storefront into one refined shopping experience.
              </p>
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleExploreCatalog}
                >
                  Explore the collection
                </button>
                <Link href="/categories" className="btn btn-secondary btn-lg">
                  View departments
                </Link>
              </div>
            </div>

            <div className="home-hero-panel animate-scale-in">
              <div className="hero-panel-card hero-panel-primary">
                <span className="hero-panel-kicker label-md">Featured direction</span>
                <h2 className="hero-panel-title headline-sm">
                  A slower, more intentional way to shop across every category.
                </h2>
                <p className="hero-panel-copy body-md">
                  Spacious layouts, sharper curation, and cleaner paths into what matters most.
                </p>
                <div className="hero-panel-metrics">
                  <div className="hero-metric">
                    <span className="hero-metric-value">{products.length}+</span>
                    <span className="hero-metric-label">Products</span>
                  </div>
                  <div className="hero-metric">
                    <span className="hero-metric-value">{rootCategories.length}</span>
                    <span className="hero-metric-label">Departments</span>
                  </div>
                  <div className="hero-metric">
                    <span className="hero-metric-value">{brands.length}</span>
                    <span className="hero-metric-label">Brands</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="container home-main">
        {!showCatalog ? (
          <div className="homepage-sections animate-fade-in">
            <section className="home-section category-edit-section">
              <div className="home-section-header home-section-header-inline">
                <div>
                  <span className="badge-sale badge-sale-secondary">Departments</span>
                  <h2 className="headline-md section-title">Shop by editorial world</h2>
                  <p className="body-md section-subtitle">
                    One refined entry point into every department, without repeating the same story
                    across the page.
                  </p>
                </div>
                <Link href="/categories" className="section-link-btn">
                  View all categories
                  <ArrowRight size={16} />
                </Link>
              </div>

              {rootCategories.length > 0 ? (
                <div className="category-edit-grid">
                  {rootCategories.slice(0, 8).map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className="category-edit-card"
                      onClick={() => handleCategorySelect(category.id.toString())}
                    >
                      <span className="category-edit-icon">{getCategoryIcon(category.name, 24)}</span>
                      <span className="category-edit-name">{category.displayName}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="section-empty body-md">Categories loading...</div>
              )}
            </section>

            <section className="home-section featured-window-section">
              <div className="home-section-header home-section-header-inline">
                <div>
                  <span className="badge-sale">Spotlight</span>
                  <h2 className="headline-md section-title">The week&apos;s most wanted</h2>
                  <p className="body-md section-subtitle">
                    A tighter hero edit with fewer distractions and more focus on the products
                    themselves.
                  </p>
                </div>
                <Link href="/?explore=true" className="section-link-btn">
                  Open catalog
                  <ArrowRight size={16} />
                </Link>
              </div>

              {spotlightProducts.length > 0 ? (
                <div className="featured-tiles-grid">
                  <div className="featured-story-card">
                    <span className="featured-story-kicker label-md">Curated now</span>
                    <h3 className="headline-md featured-story-title">
                      Build a more thoughtful basket from the store&apos;s strongest pieces.
                    </h3>
                    <p className="body-md featured-story-copy">
                      Explore hero products first, then move into the full catalog when you want a
                      broader view.
                    </p>
                    <div className="featured-story-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-md"
                        onClick={handleExploreCatalog}
                      >
                        Explore all
                      </button>
                      <Link href="/categories" className="btn btn-secondary btn-md">
                        Browse categories
                      </Link>
                    </div>
                  </div>

                  {spotlightProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="section-empty body-md">No items currently available.</div>
              )}
            </section>

            <section className="home-section home-arrivals-section">
              <div className="home-section-header home-section-header-inline">
                <div>
                  <span className="badge-sale">New in</span>
                  <h2 className="headline-md section-title">Fresh arrivals</h2>
                  <p className="body-md section-subtitle">
                    The newest products from independent sellers, shown in an easier-to-scan,
                    immersive layout.
                  </p>
                </div>
                <button type="button" className="section-link-btn" onClick={handleExploreCatalog}>
                  See everything
                  <ArrowRight size={16} />
                </button>
              </div>

              {arrivalProducts.length > 0 ? (
                <div className="products-grid products-grid-home stagger">
                  {arrivalProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="section-empty body-md">Products are on their way.</div>
              )}
            </section>
          </div>
        ) : (
          <div className="category-catalog-container animate-fade-in">
            <section className="catalog-intro">
              <div className="catalog-intro-copy">
                <div className="category-breadcrumb-nav">
                  <button type="button" className="breadcrumb-link" onClick={handleResetFilters}>
                    Home
                  </button>
                  {activeBreadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                      <span className="breadcrumb-separator">/</span>
                      <button
                        type="button"
                        className={`breadcrumb-link ${
                          index === activeBreadcrumbs.length - 1 ? 'breadcrumb-active' : ''
                        }`}
                        onClick={() => handleCategorySelect(crumb.id.toString())}
                        disabled={index === activeBreadcrumbs.length - 1}
                      >
                        {getCategoryDisplayName(crumb.name)}
                      </button>
                    </React.Fragment>
                  ))}
                  {search && (
                    <>
                      <span className="breadcrumb-separator">/</span>
                      <span className="breadcrumb-link breadcrumb-active">{search}</span>
                    </>
                  )}
                </div>

                <span className="catalog-kicker label-md">
                  {search ? 'Search results' : activeCategory ? 'Category selection' : 'Catalog view'}
                </span>
                <h1 className="catalog-title headline-lg">
                  {search
                    ? `Results for "${search}"`
                    : activeCategory
                      ? getCategoryDisplayName(activeCategory.name)
                      : 'Curated catalog'}
                </h1>
                <p className="catalog-subtitle body-md">
                  {activeCategory
                    ? `Refined pieces, layered subcategories, and elevated brand discovery inside ${getCategoryDisplayName(activeCategory.name)}.`
                    : search
                      ? 'We grouped the best matching products into one cleaner, more flexible view.'
                      : 'Discover everything in one place and refine the collection with filters.'}
                </p>

                <div className="catalog-meta-row">
                  <span className="catalog-meta-pill">
                    {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}
                  </span>
                  {activeBrandName && <span className="catalog-meta-pill">{activeBrandName}</span>}
                  {onlyInStock && <span className="catalog-meta-pill">In stock only</span>}
                </div>
              </div>

              <div className="catalog-header-controls">
                <button
                  type="button"
                  className="hide-filters-toggle-btn"
                  onClick={() => setShowFilters((value) => !value)}
                >
                  <SlidersHorizontal size={14} />
                  {showFilters ? 'Hide filters' : 'Show filters'}
                </button>

                <div className="sort-by-container">
                  <span className="sort-label">Sort by</span>
                  <div className="sort-dropdown-container">
                    <button
                      type="button"
                      className="sort-dropdown-btn"
                      onClick={() => setSortDropdownOpen((value) => !value)}
                    >
                      <span>
                        {sortBy === 'latest'
                          ? 'Newest first'
                          : sortBy === 'price-asc'
                            ? 'Price: Low to High'
                            : 'Price: High to Low'}
                      </span>
                      <ChevronDown size={16} />
                    </button>
                    {sortDropdownOpen && (
                      <div className="sort-dropdown-options shadow-md">
                        <button
                          type="button"
                          className={`sort-option ${sortBy === 'latest' ? 'active' : ''}`}
                          onClick={() => {
                            setSortBy('latest');
                            setSortDropdownOpen(false);
                          }}
                        >
                          Newest first
                        </button>
                        <button
                          type="button"
                          className={`sort-option ${sortBy === 'price-asc' ? 'active' : ''}`}
                          onClick={() => {
                            setSortBy('price-asc');
                            setSortDropdownOpen(false);
                          }}
                        >
                          Price: Low to High
                        </button>
                        <button
                          type="button"
                          className={`sort-option ${sortBy === 'price-desc' ? 'active' : ''}`}
                          onClick={() => {
                            setSortBy('price-desc');
                            setSortDropdownOpen(false);
                          }}
                        >
                          Price: High to Low
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className={`catalog-layout ${showFilters ? 'catalog-layout-with-sidebar' : ''}`}>
              {showFilters && (
                <aside className="home-sidebar animate-fade-in">
                  <div className="filter-card">
                    <div className="filter-card-header">
                      <div className="sidebar-filter-header-row">
                        <SlidersHorizontal size={18} className="sidebar-filter-icon" />
                        <span className="sidebar-filter-main-title">Refine the edit</span>
                      </div>
                    </div>

                    <div className="filter-card-body">
                      <div className="filter-section subcategory-filter-section">
                        <h5
                          className="filter-title label-md accordion-header"
                          onClick={() => setCategoryCollapsed((value) => !value)}
                        >
                          <span>Category</span>
                          <ChevronDown
                            size={14}
                            className={`filter-chevron ${categoryCollapsed ? '' : 'rotated'}`}
                          />
                        </h5>

                        {!categoryCollapsed && (
                          <div className="filter-content animate-fade-in">
                            <div className="sidebar-category-tree">
                              {sidebarCategories.length > 0 ? (
                                <ul className="sidebar-subcat-list">
                                  {sidebarCategories.map((category) => {
                                    const checked = selectedCategory === category.id.toString();
                                    return (
                                      <li key={category.id} className="subcat-li">
                                        <label className="filter-checkbox-label body-md">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              handleCategorySelect(
                                                checked ? activeCategory?.parent_id?.toString() || '' : category.id.toString(),
                                              )
                                            }
                                          />
                                          <span>{getCategoryDisplayName(category.name)}</span>
                                        </label>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <ul className="sidebar-subcat-list">
                                  {rootCategories.map((category) => (
                                    <li key={category.id} className="subcat-li">
                                      <label className="filter-checkbox-label body-md">
                                        <input
                                          type="checkbox"
                                          checked={selectedCategory === category.id.toString()}
                                          onChange={() => handleCategorySelect(category.id.toString())}
                                        />
                                        <span>{category.displayName}</span>
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="filter-section">
                        <h5
                          className="filter-title label-md accordion-header"
                          onClick={() => setPriceCollapsed((value) => !value)}
                        >
                          <span>Price range</span>
                          <ChevronDown
                            size={14}
                            className={`filter-chevron ${priceCollapsed ? '' : 'rotated'}`}
                          />
                        </h5>

                        {!priceCollapsed && (
                          <div className="filter-content animate-fade-in">
                            <div className="price-range-slider-wrapper">
                              <div className="price-range-labels">
                                <span className="price-range-value">${minPrice || 0}</span>
                                <span className="price-range-value">${maxPrice || 5000}</span>
                              </div>

                              <div className="dual-range-track">
                                <div
                                  className="dual-range-fill"
                                  style={{
                                    left: `${((parseFloat(minPrice) || 0) / 5000) * 100}%`,
                                    right: `${100 - ((parseFloat(maxPrice) || 5000) / 5000) * 100}%`,
                                  }}
                                />
                                <input
                                  type="range"
                                  min="0"
                                  max="5000"
                                  step="50"
                                  value={minPrice || 0}
                                  onChange={(event) => {
                                    const value = parseInt(event.target.value, 10);
                                    if (value <= (parseInt(maxPrice || '5000', 10) || 5000)) {
                                      setMinPrice(value === 0 ? '' : String(value));
                                    }
                                  }}
                                  className="dual-range-input dual-range-min"
                                />
                                <input
                                  type="range"
                                  min="0"
                                  max="5000"
                                  step="50"
                                  value={maxPrice || 5000}
                                  onChange={(event) => {
                                    const value = parseInt(event.target.value, 10);
                                    if (value >= (parseInt(minPrice || '0', 10) || 0)) {
                                      setMaxPrice(value === 5000 ? '' : String(value));
                                    }
                                  }}
                                  className="dual-range-input dual-range-max"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {dynamicBrands.length > 0 && (
                        <div className="filter-section">
                          <h5
                            className="filter-title label-md accordion-header"
                            onClick={() => setBrandCollapsed((value) => !value)}
                          >
                            <span>Brand</span>
                            <ChevronDown
                              size={14}
                              className={`filter-chevron ${brandCollapsed ? '' : 'rotated'}`}
                            />
                          </h5>

                          {!brandCollapsed && (
                            <div className="filter-content animate-fade-in">
                              {dynamicBrands.length > 5 && (
                                <div className="brand-search-wrapper">
                                  <input
                                    type="text"
                                    placeholder="Search brand"
                                    className="brand-search-input"
                                    value={brandSearch}
                                    onChange={(event) => setBrandSearch(event.target.value)}
                                  />
                                </div>
                              )}

                              <div className="brand-checklist">
                                {filteredDynamicBrands.map((brand) => (
                                  <label key={brand.id} className="filter-checkbox-label body-md">
                                    <input
                                      type="checkbox"
                                      checked={selectedBrand === brand.id.toString()}
                                      onChange={() =>
                                        setSelectedBrand(
                                          selectedBrand === brand.id.toString() ? '' : brand.id.toString(),
                                        )
                                      }
                                    />
                                    <span>{brand.name}</span>
                                  </label>
                                ))}
                                {filteredDynamicBrands.length === 0 && (
                                  <div className="brand-empty body-sm">No matching brands</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="filter-section">
                        <h5
                          className="filter-title label-md accordion-header"
                          onClick={() => setAvailabilityCollapsed((value) => !value)}
                        >
                          <span>Availability</span>
                          <ChevronDown
                            size={14}
                            className={`filter-chevron ${availabilityCollapsed ? '' : 'rotated'}`}
                          />
                        </h5>

                        {!availabilityCollapsed && (
                          <div className="filter-content animate-fade-in">
                            <label className="filter-checkbox-label body-md">
                              <input
                                type="checkbox"
                                checked={onlyInStock}
                                onChange={(event) => setOnlyInStock(event.target.checked)}
                              />
                              <span>In stock only</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="filter-card-footer">
                      <button
                        type="button"
                        className="apply-filters-btn"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        Apply
                      </button>
                      <button type="button" className="remove-filters-btn" onClick={handleResetFilters}>
                        <RefreshCw size={14} />
                        Reset
                      </button>
                    </div>
                  </div>
                </aside>
              )}

              <div className="home-content">
                {sidebarCategories.length > 0 && (
                  <div className="catalog-subcategory-row">
                    {sidebarCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className={`catalog-subcategory-pill ${
                          selectedCategory === category.id.toString() ? 'active' : ''
                        }`}
                        onClick={() => handleCategorySelect(category.id.toString())}
                      >
                        {getCategoryDisplayName(category.name)}
                      </button>
                    ))}
                  </div>
                )}

                {loading ? (
                  <div className="catalog-state flex-center">
                    <span className="body-lg">Loading products...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="catalog-empty card flex-center animate-fade-in">
                    <div className="catalog-empty-inner">
                      <h3 className="title-lg">Nothing matches this edit yet</h3>
                      <p className="body-md">
                        Try opening the price range, switching brands, or clearing the current
                        selection to reveal more products.
                      </p>
                      <Button variant="primary" onClick={handleResetFilters}>
                        Reset everything
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="products-grid stagger">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
