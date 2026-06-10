import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import {
  Filter,
  SlidersHorizontal,
  RefreshCw,
  ChevronDown,
  Car,
  Baby,
  Laptop,
  BookOpen,
  Gamepad2,
  Shirt,
  ShoppingBag,
  Home as HomeIcon,
  Wrench,
  Watch,
  Smile,
  Briefcase,
  Music,
  Gift,
  PenTool,
  Heart,
  Hammer,
  Dumbbell,
  Code,
  Compass,
  Plug,
  Gamepad,
  Sparkles,
  FileText,
  Leaf,
  Layers,
  ArrowLeft
} from 'lucide-react';
import './Home.css';

const ALLOWED_MAIN_CATEGORIES = [
  { name: "Electronics", match: "Computers & Electronics" },
  { name: "Fashion", match: "Fashion & Apparel" },
  { name: "Baby Product", match: "Baby Products" },
  { name: "Toys", match: "Entertainment & Toys" },
  { name: "Home & Kitchen", match: "Home & Kitchen" },
  { name: "Tools", match: "Industrial & Tools" },
  { name: "Accessories", match: "Jewelry & Accessories" },
  { name: "Sports", match: "Sports & Fitness" },
  { name: "Books", match: "Books & Media" },
  { name: "Furniture", match: "Furniture & Decor" }
];

export const Home = () => {
  const { props, url } = usePage();
  const [products, setProducts] = useState(props.products || []);
  const [categories, setCategories] = useState(props.categories || []);
  const [brands, setBrands] = useState(props.brands || []);
  const [loading, setLoading] = useState(false);

  // Custom dynamic filters states (computed client side)
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Accordion states for sidebar filters
  const [categoryCollapsed, setCategoryCollapsed] = useState(false);
  const [priceCollapsed, setPriceCollapsed] = useState(false);
  const [brandCollapsed, setBrandCollapsed] = useState(false);
  const [availabilityCollapsed, setAvailabilityCollapsed] = useState(false);

  const currentSearchParams = new URL(url || window.location.href, window.location.origin).searchParams;
  const search = currentSearchParams.get('search') || '';
  const selectedCategory = currentSearchParams.get('category') || '';
  const exploreMode = currentSearchParams.get('explore') === 'true';
  const showCatalog = selectedCategory !== '' || search !== '' || exploreMode;

  const getCategoryDisplayName = (name) => {
    if (!name) return '';
    const allowed = ALLOWED_MAIN_CATEGORIES.find(a => a.match.toLowerCase() === name.toLowerCase());
    return allowed ? allowed.name : name;
  };

  // Group categories into tree structure, filtered by allowed main categories
  const rootCategories = categories
    .filter(c => c.parent_id === null)
    .filter(c => ALLOWED_MAIN_CATEGORIES.some(allowed => allowed.match.toLowerCase() === c.name.toLowerCase()))
    .map(c => {
      return {
        ...c,
        displayName: getCategoryDisplayName(c.name)
      };
    });

  const getSubcategoriesTree = (parentId) => {
    const subs = categories.filter(c => c.parent_id === parentId);
    return subs.map(sub => ({
      ...sub,
      children: categories.filter(c => c.parent_id === sub.id)
    }));
  };

  const getCategoryIcon = (name) => {
    const norm = name.toLowerCase();
    if (norm.includes('automotive') || norm.includes('car')) return <Car size={22} />;
    if (norm.includes('baby')) return <Baby size={22} />;
    if (norm.includes('computer') || norm.includes('electronic') || norm.includes('laptop') || norm.includes('phone')) return <Laptop size={22} />;
    if (norm.includes('book') || norm.includes('media') || norm.includes('reading')) return <BookOpen size={22} />;
    if (norm.includes('toy') || norm.includes('entertainment')) return <Gamepad2 size={22} />;
    if (norm.includes('fashion') || norm.includes('apparel') || norm.includes('clothing') || norm.includes('jacket') || norm.includes('shirt')) return <Shirt size={22} />;
    if (norm.includes('grocery') || norm.includes('food') || norm.includes('snack') || norm.includes('beverage')) return <ShoppingBag size={22} />;
    if (norm.includes('home') || norm.includes('kitchen') || norm.includes('furniture') || norm.includes('lighting')) return <HomeIcon size={22} />;
    if (norm.includes('industrial') || norm.includes('tool') || norm.includes('equipment')) return <Wrench size={22} />;
    if (norm.includes('jewelry') || norm.includes('watch') || norm.includes('accessory')) return <Watch size={22} />;
    if (norm.includes('kid')) return <Smile size={22} />;
    if (norm.includes('luggage') || norm.includes('bag') || norm.includes('backpack')) return <Briefcase size={22} />;
    if (norm.includes('musical') || norm.includes('instrument') || norm.includes('guitar')) return <Music size={22} />;
    if (norm.includes('novelty') || norm.includes('gift') || norm.includes('keepsake')) return <Gift size={22} />;
    if (norm.includes('office') || norm.includes('stationery') || norm.includes('planner')) return <PenTool size={22} />;
    if (norm.includes('pet') || norm.includes('dog') || norm.includes('cat')) return <Heart size={22} />;
    if (norm.includes('quick tool') || norm.includes('knife') || norm.includes('tape')) return <Hammer size={22} />;
    if (norm.includes('recreation') || norm.includes('sport') || norm.includes('fitness') || norm.includes('camp')) return <Dumbbell size={22} />;
    if (norm.includes('software') || norm.includes('app') || norm.includes('operating')) return <Code size={22} />;
    if (norm.includes('travel') || norm.includes('outdoor') || norm.includes('tent')) return <Compass size={22} />;
    if (norm.includes('utility') || norm.includes('hardware') || norm.includes('plug') || norm.includes('bulb')) return <Plug size={22} />;
    if (norm.includes('video game') || norm.includes('console')) return <Gamepad size={22} />;
    if (norm.includes('wellness') || norm.includes('cosmetic') || norm.includes('makeup')) return <Sparkles size={22} />;
    if (norm.includes('xerox') || norm.includes('paper') || norm.includes('notebook')) return <FileText size={22} />;
    if (norm.includes('yard') || norm.includes('garden') || norm.includes('seed')) return <Leaf size={22} />;
    if (norm.includes('zero') || norm.includes('eco') || norm.includes('reusable')) return <Leaf size={22} />;
    return <Layers size={22} />;
  };

  useEffect(() => {
    // Reset filters when category or explore changes
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setCategories(props.categories || []);
    setBrands(props.brands || []);
    setProducts(props.products || []);
    setLoading(false);
  }, [props.brands, props.categories, props.products]);

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
    const newParams = new URLSearchParams(currentSearchParams.toString());
    if (id === '') {
      newParams.delete('category');
    } else {
      newParams.set('category', id);
    }
    setLoading(true);
    visitWithParams(newParams);
  };

  const handleResetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrand('');
    setOnlyInStock(false);
    setSortBy('latest');
    setLoading(true);
    visitWithParams(new URLSearchParams());
  };

  // Find the most specific category from the search result products
  const getSearchCategory = () => {
    if (!search || products.length === 0) return null;
    const counts = {};
    products.forEach(p => {
      if (p.categories && p.categories.length > 0) {
        p.categories.forEach(c => {
          counts[c.id] = (counts[c.id] || 0) + 1;
        });
      }
    });
    let maxId = null;
    let maxCount = 0;
    Object.keys(counts).forEach(id => {
      if (counts[id] > maxCount) {
        maxCount = counts[id];
        maxId = id;
      }
    });
    return maxId ? categories.find(c => c.id.toString() === maxId.toString()) : null;
  };

  const searchCategory = getSearchCategory();
  const activeCategory = categories.find(c => c.id.toString() === selectedCategory) || searchCategory;

  // Build breadcrumb items leading up to active category
  const getBreadcrumbs = () => {
    const crumbs = [];
    let current = activeCategory;
    while (current) {
      crumbs.unshift(current);
      if (current.parent_id) {
        current = categories.find(c => c.id === current.parent_id);
      } else {
        current = null;
      }
    }
    return crumbs;
  };
  const activeBreadcrumbs = getBreadcrumbs();

  const activeCategoryName = activeCategory?.name;
  const activeBrandName = brands.find(b => b.id.toString() === selectedBrand)?.name;

  // Find subcategories to show in sidebar
  const sidebarSubcategories = categories.filter(c => c.parent_id?.toString() === activeCategory?.id?.toString());
  const siblings = activeCategory?.parent_id ? categories.filter(c => c.parent_id === activeCategory.parent_id) : [];
  const displaySubcategories = sidebarSubcategories.length > 0 ? sidebarSubcategories : siblings;

  // Dynamic brands from products in current category
  const dynamicBrands = brands.filter(b =>
    products.some(p => p.brand_id === b.id)
  );

  const filteredDynamicBrands = dynamicBrands.filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Client-side filtering & sorting
  const filteredProducts = products.filter(prod => {
    // Price filter
    if (minPrice !== '') {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        const p = prod.sale_price !== null ? prod.sale_price : prod.regular_price;
        if (p < min) return false;
      }
    }
    if (maxPrice !== '') {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        const p = prod.sale_price !== null ? prod.sale_price : prod.regular_price;
        if (p > max) return false;
      }
    }

    // Brand filter
    if (selectedBrand !== '') {
      if (prod.brand_id?.toString() !== selectedBrand) return false;
    }

    // Availability filter
    if (onlyInStock) {
      if (prod.stock_status !== 'instock') return false;
    }

    return true;
  }).sort((a, b) => {
    const priceA = a.sale_price !== null ? a.sale_price : a.regular_price;
    const priceB = b.sale_price !== null ? b.sale_price : b.regular_price;

    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    return b.id - a.id;
  });

  // Custom state for expanding all products on homepage
  const [showAllProducts, setShowAllProducts] = useState(false);

  return (
    <div className="buyer-layout">
      <Navbar onSearch={(query) => {
        const newParams = new URLSearchParams(currentSearchParams.toString());
        if (query) newParams.set('search', query);
        else newParams.delete('search');
        setLoading(true);
        visitWithParams(newParams);
      }} />

      {/* Hero Banner (Shown only on Home page) */}
      {!showCatalog && (
        <div className="home-hero">
          <div className="container hero-container animate-fade-in">
            <span className="hero-badge label-md">Premium Marketplace</span>
            <h1 className="hero-title display-text">Welcome to MyStore</h1>
            <p className="hero-subtitle body-lg">
              Shop directly from verified independent sellers. Manage your warehouses, shipping carriers, and checkout seamlessly.
            </p>
          </div>
        </div>
      )}
      {/* Category Header Row with Icons (Homepage only) */}
      {!showCatalog && (
        <div className="category-header-boxes shadow-sm">
          <div className="container category-boxes-container">
            {rootCategories.map((cat) => (
              <button
                key={cat.id}
                className={`category-header-box ${selectedCategory === cat.id.toString() ? 'active' : ''}`}
                onClick={() => {
                  handleCategorySelect(cat.id.toString());
                  setShowAllProducts(false);
                }}
              >
                <span className="category-box-symbol">{getCategoryIcon(cat.name)}</span>
                <span className="category-box-label">{cat.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}



      <main className="container home-main">
        {!showCatalog ? (
          /* HOMEPAGE VIEW (Full width, no sidebar, customized sections) */
          <div className="homepage-sections animate-fade-in">
            {/* Top 4 Items Grid (3 Products + 1 Explore Tile) */}
            <section className="home-section featured-window-section">
              <div className="home-section-header">
                <span className="badge-sale">Spotlight</span>
                <h3 className="headline-md section-title">Featured Selections</h3>
                <p className="body-md section-subtitle">Our top-rated products displayed side-by-side.</p>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="featured-tiles-grid">
                  {/* First 3 Product Cards */}
                  {filteredProducts.slice(0, 3).map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}

                  {/* 4th Tile: Explore Button Tile */}
                  <Link href="/?explore=true" className="product-card-container shadow-sm explore-tile-card">
                    <div className="explore-tile-content">
                      <div className="explore-icon-wrapper flex-center">
                        <Compass size={32} />
                      </div>
                      <h4 className="title-lg explore-tile-title">Explore More</h4>
                      <p className="body-sm explore-tile-desc">Discover our full collection of premium products</p>
                      <Button variant="primary" className="explore-tile-btn">
                        View Catalog
                      </Button>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="section-empty body-md">No items currently available.</div>
              )}
            </section>

            {/* Explore Products by Category Section */}
            <section className="home-section explore-by-cat-section">
              <div className="home-section-header">
                <span className="badge-sale" style={{ background: 'var(--color-secondary)' }}>Categories</span>
                <h3 className="headline-md section-title">Explore Products by Category</h3>
                <p className="body-md section-subtitle">Browse our top categories and find exactly what you need.</p>
              </div>

              {rootCategories.length > 0 ? (
                <div className="ecb-featured-grid">
                  {/* Big Category Card — first */}
                  {rootCategories[0] && (
                    <div
                      className="ecb-big-card"
                      onClick={() => handleCategorySelect(rootCategories[0].id.toString())}
                    >
                      <div className="ecb-big-icon flex-center">
                        {getCategoryIcon(rootCategories[0].name)}
                      </div>
                      <div className="ecb-big-info">
                        <span className="ecb-badge label-md">Top Category</span>
                        <h4 className="ecb-big-name headline-md">{rootCategories[0].displayName}</h4>
                        <p className="ecb-big-desc body-md">Explore the best in {rootCategories[0].displayName} — from essentials to the latest arrivals.</p>
                        <button className="ecb-explore-btn">
                          Explore {rootCategories[0].displayName} →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Small Category Cards (3 more) */}
                  <div className="ecb-small-column">
                    {rootCategories.slice(1, 4).map(cat => (
                      <div
                        key={cat.id}
                        className="ecb-small-card"
                        onClick={() => handleCategorySelect(cat.id.toString())}
                      >
                        <div className="ecb-small-icon flex-center">
                          {getCategoryIcon(cat.name)}
                        </div>
                        <div className="ecb-small-info">
                          <span className="ecb-small-name title-lg">{cat.displayName}</span>
                          <span className="ecb-small-cta body-sm">Shop Now →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="section-empty body-md">Categories loading...</div>
              )}

              {/* View All Categories CTA */}
              <div className="ecb-view-all-row">
                <Link href="/categories" className="ecb-view-all-btn">
                  View All Categories →
                </Link>
              </div>
            </section>
          </div>
        ) : (
          /* CATEGORY FILTER PAGE VIEW (Sidebar + Grid layout) */
          <div className="category-catalog-container animate-fade-in">
            <div className="catalog-sticky-header">
              {/* Single-row: Breadcrumbs left | Controls right */}
              <div className="catalog-header-single-row">
                {/* Breadcrumbs */}
                <div className="category-breadcrumb-nav">
                  <button className="breadcrumb-link" onClick={() => handleCategorySelect('')}>
                    All Categories
                  </button>
                  {activeBreadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.id}>
                      <span className="breadcrumb-separator"> &rsaquo; </span>
                      <button
                        className={`breadcrumb-link ${idx === activeBreadcrumbs.length - 1 ? 'breadcrumb-active' : ''}`}
                        onClick={() => handleCategorySelect(crumb.id.toString())}
                        disabled={idx === activeBreadcrumbs.length - 1}
                      >
                        {getCategoryDisplayName(crumb.name)}
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                {/* Right-side controls */}
                <div className="catalog-header-controls">
                  <button
                    className="hide-filters-toggle-btn body-md"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal size={14} style={{ marginRight: 6 }} />
                    <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                  </button>

                  <div className="sort-by-container body-md">
                    <span className="sort-label">Sort By:</span>
                    <div className="sort-dropdown-container">
                      <button className="sort-dropdown-btn" onClick={() => setSortDropdownOpen(!sortDropdownOpen)}>
                        <span>{sortBy === 'latest' ? 'Newest' : sortBy === 'price-asc' ? 'Price: Low to High' : 'Price: High to Low'}</span>
                        <ChevronDown size={14} style={{ marginLeft: 4 }} />
                      </button>
                      {sortDropdownOpen && (
                        <div className="sort-dropdown-options shadow-md">
                          <button
                            className={`sort-option ${sortBy === 'latest' ? 'active' : ''}`}
                            onClick={() => { setSortBy('latest'); setSortDropdownOpen(false); }}
                          >
                            Newest
                          </button>
                          <button
                            className={`sort-option ${sortBy === 'price-asc' ? 'active' : ''}`}
                            onClick={() => { setSortBy('price-asc'); setSortDropdownOpen(false); }}
                          >
                            Price: Low to High
                          </button>
                          <button
                            className={`sort-option ${sortBy === 'price-desc' ? 'active' : ''}`}
                            onClick={() => { setSortBy('price-desc'); setSortDropdownOpen(false); }}
                          >
                            Price: High to Low
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`home-grid-layout ${showFilters ? 'show-sidebar' : 'hide-sidebar'}`}>
              {/* Sidebar Filters */}
              {showFilters && (
                <aside className="home-sidebar animate-fade-in">
                  <div className="filter-card">
                    {/* Sticky Filters Header */}
                    <div className="filter-card-header">
                      <SlidersHorizontal size={18} className="sidebar-filter-icon" />
                      <span className="sidebar-filter-main-title">Filters</span>
                    </div>

                    {/* Scrollable Filter Body */}
                    <div className="filter-card-body">
                      {/* Category Tree Navigator */}
                      <div className="filter-section subcategory-filter-section">
                        <h5
                          className="filter-title label-md accordion-header"
                          onClick={() => setCategoryCollapsed(!categoryCollapsed)}
                        >
                          <span>Category</span>
                          <ChevronDown size={14} className={`filter-chevron ${categoryCollapsed ? '' : 'rotated'}`} />
                        </h5>

                        {!categoryCollapsed && (
                          <div className="filter-content animate-fade-in">
                            <div className="sidebar-category-tree">
                              {(() => {
                                const children = categories.filter(c => c.parent_id === activeCategory?.id);
                                if (children.length > 0) {
                                  return (
                                    <ul className="sidebar-subcat-list">
                                      {children.map(child => {
                                        const isChecked = selectedCategory === child.id.toString();
                                        return (
                                          <li key={child.id} className="subcat-li">
                                            <label className="filter-checkbox-label body-md">
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleCategorySelect(isChecked ? (activeCategory ? activeCategory.id.toString() : '') : child.id.toString())}
                                              />
                                              <span>{getCategoryDisplayName(child.name)}</span>
                                            </label>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  );
                                } else {
                                  const siblings = activeCategory?.parent_id
                                    ? categories.filter(c => c.parent_id === activeCategory.parent_id)
                                    : [];
                                  return (
                                    <ul className="sidebar-subcat-list">
                                      {siblings.map(sib => {
                                        const isSibActive = selectedCategory === sib.id.toString();
                                        return (
                                          <li key={sib.id} className="subcat-li">
                                            <label className="filter-checkbox-label body-md">
                                              <input
                                                type="checkbox"
                                                checked={isSibActive}
                                                onChange={() => handleCategorySelect(isSibActive ? (activeCategory?.parent_id ? activeCategory.parent_id.toString() : '') : sib.id.toString())}
                                              />
                                              <span>{getCategoryDisplayName(sib.name)}</span>
                                            </label>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Price Filter */}
                      <div className="filter-section">
                        <h5
                          className="filter-title label-md accordion-header"
                          onClick={() => setPriceCollapsed(!priceCollapsed)}
                        >
                          <span>Price Range</span>
                          <ChevronDown size={14} className={`filter-chevron ${priceCollapsed ? '' : 'rotated'}`} />
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
                                    right: `${100 - ((parseFloat(maxPrice) || 5000) / 5000) * 100}%`
                                  }}
                                />
                                <input
                                  type="range"
                                  min="0" max="5000" step="50"
                                  value={minPrice || 0}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val <= (parseInt(maxPrice) || 5000)) setMinPrice(val === 0 ? '' : String(val));
                                  }}
                                  className="dual-range-input dual-range-min"
                                />
                                <input
                                  type="range"
                                  min="0" max="5000" step="50"
                                  value={maxPrice || 5000}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val >= (parseInt(minPrice) || 0)) setMaxPrice(val === 5000 ? '' : String(val));
                                  }}
                                  className="dual-range-input dual-range-max"
                                />
                              </div>

                              <div className="price-presets" style={{ marginTop: '14px' }}>
                                <label className="filter-radio-label body-md">
                                  <input type="radio" name="price-preset"
                                    checked={minPrice === '' && maxPrice === '500'}
                                    onChange={() => { setMinPrice(''); setMaxPrice('500'); }}
                                  />
                                  <span>Under $500</span>
                                </label>
                                <label className="filter-radio-label body-md">
                                  <input type="radio" name="price-preset"
                                    checked={minPrice === '500' && maxPrice === '1500'}
                                    onChange={() => { setMinPrice('500'); setMaxPrice('1500'); }}
                                  />
                                  <span>$500 – $1500</span>
                                </label>
                                <label className="filter-radio-label body-md">
                                  <input type="radio" name="price-preset"
                                    checked={minPrice === '1500' && maxPrice === ''}
                                    onChange={() => { setMinPrice('1500'); setMaxPrice(''); }}
                                  />
                                  <span>Over $1500</span>
                                </label>
                                <label className="filter-radio-label body-md">
                                  <input type="radio" name="price-preset"
                                    checked={minPrice === '' && maxPrice === ''}
                                    onChange={() => { setMinPrice(''); setMaxPrice(''); }}
                                  />
                                  <span>Any Price</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Brand Filter */}
                      {dynamicBrands.length > 0 && (
                        <div className="filter-section">
                          <h5
                            className="filter-title label-md accordion-header"
                            onClick={() => setBrandCollapsed(!brandCollapsed)}
                          >
                            <span>Brand</span>
                            <ChevronDown size={14} className={`filter-chevron ${brandCollapsed ? '' : 'rotated'}`} />
                          </h5>

                          {!brandCollapsed && (
                            <div className="filter-content animate-fade-in">
                              {dynamicBrands.length > 5 && (
                                <div className="brand-search-wrapper">
                                  <input type="text" placeholder="Search Brand"
                                    className="brand-search-input"
                                    value={brandSearch}
                                    onChange={(e) => setBrandSearch(e.target.value)}
                                  />
                                </div>
                              )}
                              <div className="brand-checklist">
                                {filteredDynamicBrands.map(b => (
                                  <label key={b.id} className="filter-checkbox-label body-md">
                                    <input type="checkbox"
                                      checked={selectedBrand === b.id.toString()}
                                      onChange={() => setSelectedBrand(selectedBrand === b.id.toString() ? '' : b.id.toString())}
                                    />
                                    <span>{b.name}</span>
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

                      {/* Availability Filter */}
                      <div className="filter-section">
                        <h5
                          className="filter-title label-md accordion-header"
                          onClick={() => setAvailabilityCollapsed(!availabilityCollapsed)}
                        >
                          <span>Availability</span>
                          <ChevronDown size={14} className={`filter-chevron ${availabilityCollapsed ? '' : 'rotated'}`} />
                        </h5>

                        {!availabilityCollapsed && (
                          <div className="filter-content animate-fade-in">
                            <label className="filter-checkbox-label body-md">
                              <input type="checkbox"
                                checked={onlyInStock}
                                onChange={(e) => setOnlyInStock(e.target.checked)}
                              />
                              <span>In Stock</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sticky Filter Footer */}
                    <div className="filter-card-footer">
                      <button className="apply-filters-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        Apply
                      </button>
                      {(minPrice !== '' || maxPrice !== '' || selectedBrand !== '' || onlyInStock) && (
                        <button className="remove-filters-btn" onClick={handleResetFilters}>
                          Remove All
                        </button>
                      )}
                    </div>
                  </div>
                </aside>
              )}

              {/* Product Grid Column */}
              <div className="home-content">
                {/* Active filter chips removed - controls now in filter card footer */}

                {loading ? (
                  <div className="catalog-loading flex-center">
                    <span className="body-lg">Loading products...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="catalog-empty card flex-center animate-fade-in">
                    <h4 className="title-lg">No products found</h4>
                    <p className="body-md" style={{ color: 'var(--color-outline)', marginTop: 8 }}>
                      Try adjusting your filters, setting a different price range, or clearing filters.
                    </p>
                    <Button variant="primary" style={{ marginTop: 16 }} onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  </div>
                ) : (
                  <div className="products-grid animate-fade-in">
                    {filteredProducts.map((prod) => (
                      <ProductCard key={prod.id} product={prod} />
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
