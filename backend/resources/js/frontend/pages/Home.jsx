import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  ArrowRight,
  Baby,
  BookOpen,
  Briefcase,
  Car,
  Code,
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
  Shirt,
  ShoppingBag,
  Smile,
  Sparkles,
  Watch,
  Wrench,
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
  if (norm.includes('recreation') || norm.includes('sport') || norm.includes('fitness') || norm.includes('camp')) return <Dumbbell size={size} />;
  if (norm.includes('software') || norm.includes('app')) return <Code size={size} />;
  if (norm.includes('utility') || norm.includes('hardware') || norm.includes('plug') || norm.includes('bulb')) return <Plug size={size} />;
  if (norm.includes('video game') || norm.includes('console')) return <Gamepad size={size} />;
  if (norm.includes('wellness') || norm.includes('cosmetic') || norm.includes('makeup')) return <Sparkles size={size} />;
  if (norm.includes('paper') || norm.includes('notebook')) return <FileText size={size} />;
  if (norm.includes('yard') || norm.includes('garden') || norm.includes('seed') || norm.includes('eco')) return <Leaf size={size} />;
  return <Layers size={size} />;
};

const productPrice = (product) => Number(product.sale_price ?? product.regular_price ?? 0);

const productBelongsToCategory = (product, category) => {
  const categoryIds = [category.id, ...(category.children || []).map((child) => child.id)];
  return product.categories?.some((productCategory) =>
    categoryIds.includes(productCategory.id) || categoryIds.includes(productCategory.parent_id),
  );
};

const ProductSpotlightGrid = ({ products }) => (
  <div className="grid h-auto grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:h-[70vh]">
    {products.slice(0, 3).map((product, index) => (
      <Link
        key={product.id}
        href={`/products/${product.id}`}
        className={`group relative min-h-56 overflow-hidden bg-neutral-200 ${
          index === 0 ? 'sm:col-span-2 md:col-span-2 md:row-span-2 md:h-full' : 'h-56 sm:h-64 md:h-auto'
        }`}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-4xl font-semibold text-neutral-400">
            {product.name?.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <span className="mb-1 block text-[10px] uppercase tracking-widest opacity-75">
            {product.brand?.name || product.user?.name || 'Featured'}
          </span>
          <h4 className={`mb-3 font-semibold leading-tight ${index === 0 ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}`}>
            {product.name}
          </h4>
          <div className="flex items-center justify-between gap-3">
            <span className="text-base font-semibold">${productPrice(product).toFixed(2)}</span>
            <span className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-900 transition-transform group-hover:-translate-y-0.5">
              Discover
            </span>
          </div>
        </div>
      </Link>
    ))}
  </div>
);

const CategorySpotlightGrid = ({ categories, products }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
    {categories.slice(0, 4).map((category) => {
      const heroProduct = products.find((product) => productBelongsToCategory(product, category));

      return (
        <Link
          key={category.id}
          href={`/categories/${category.id}`}
          className="group relative min-h-36 overflow-hidden bg-neutral-200 sm:min-h-52"
        >
          {heroProduct?.image_url ? (
            <img
              src={heroProduct.image_url}
              alt={getCategoryDisplayName(category.name)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-300 text-neutral-500">
              {getCategoryIcon(category.name, 38)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <span className="mb-1 block text-[9px] uppercase tracking-widest opacity-75">
              {category.children?.length || 0} edits
            </span>
            <h4 className="mb-3 text-base font-semibold leading-tight sm:text-lg">
              {getCategoryDisplayName(category.name)}
            </h4>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-900 transition-transform group-hover:-translate-y-0.5">
              View <ArrowRight size={11} />
            </span>
          </div>
        </Link>
      );
    })}
  </div>
);

export const Home = () => {
  const { props, url } = usePage();
  const [products, setProducts] = useState(props.products || []);
  const [categories, setCategories] = useState(props.categories || []);

  const currentUrl = new URL(url || window.location.href, window.location.origin);
  const legacyCategory = currentUrl.searchParams.get('category') || currentUrl.searchParams.get('category_id');
  const legacySearch = currentUrl.searchParams.get('search') || '';
  const legacyExplore = currentUrl.searchParams.get('explore') === 'true';

  useEffect(() => {
    if (legacyCategory) {
      const params = new URLSearchParams();
      if (legacySearch) params.set('search', legacySearch);
      router.visit(`/categories/${legacyCategory}${params.toString() ? `?${params.toString()}` : ''}`, {
        replace: true,
        preserveScroll: true,
      });
    } else if (legacyExplore) {
      router.visit('/categories', {
        replace: true,
        preserveScroll: true,
      });
    } else if (legacySearch) {
      router.visit(`/categories?search=${encodeURIComponent(legacySearch)}`, {
        replace: true,
        preserveScroll: true,
      });
    }
  }, [legacyCategory, legacyExplore, legacySearch]);

  useEffect(() => {
    setProducts(Array.isArray(props.products) ? props.products : []);
    setCategories(Array.isArray(props.categories) ? props.categories : []);
  }, [props.products, props.categories]);

  const rootCategories = useMemo(() => (
    categories
      .filter((category) => category.parent_id === null)
      .filter((category) => ALLOWED_MAIN_CATEGORIES.some((allowed) => (
        allowed.match.toLowerCase() === category.name.toLowerCase()
      )))
      .map((category) => ({
        ...category,
        displayName: getCategoryDisplayName(category.name),
        children: categories.filter((child) => child.parent_id === category.id),
      }))
  ), [categories]);

  const categorySections = rootCategories
    .map((category) => ({
      category,
      products: products.filter((product) => productBelongsToCategory(product, category)).slice(0, 3),
    }))
    .filter((section) => section.products.length > 0)
    .slice(0, 3);

  const weeklyProducts = products.slice(0, 3);

  const handleSearch = (query) => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    router.visit(`/categories${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Navbar onSearch={handleSearch} />

      <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-neutral-50 to-rose-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_8%_20%,rgba(239,224,205,0.85),transparent_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_90%_10%,rgba(255,218,218,0.5),transparent_36%)]" />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-10 bg-amber-600/60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Modern Chic Editorial</span>
            <span className="h-px w-10 bg-amber-600/60" />
          </div>

          <h1 className="mb-6 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl md:text-5xl">
            Premium essentials, presented with calm and rhythm.
          </h1>
          <p className="mb-10 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-base">
            MyStore brings verified sellers, elevated discovery, and category-first browsing into one refined shopping experience.
          </p>
          <Link
            href="/categories"
            className="flex items-center gap-2 rounded-full bg-neutral-950 px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-neutral-900"
          >
            Explore categories <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        {rootCategories.length > 0 && (
          <section>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="mb-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Category edit
                </span>
                <h2 className="mb-1 text-xl font-semibold text-neutral-900 sm:text-2xl">
                  Shop by category
                </h2>
                <p className="max-w-2xl text-sm text-neutral-500">
                  Choose a department first, then refine with subcategories and brands inside that category.
                </p>
              </div>
              <Link
                href="/categories"
                className="flex items-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-neutral-700 transition-all hover:gap-3"
              >
                View directory <ArrowRight size={14} />
              </Link>
            </div>

            <CategorySpotlightGrid categories={rootCategories} products={products} />
          </section>
        )}

        {categorySections.map(({ category, products: categoryProducts }) => (
          <section key={category.id}>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="mb-2 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  {getCategoryDisplayName(category.name)}
                </span>
                <h2 className="mb-1 text-xl font-semibold text-neutral-900 sm:text-2xl">
                  {getCategoryDisplayName(category.name)} picks
                </h2>
                <p className="max-w-2xl text-sm text-neutral-500">
                  A focused edit from this category, with the full page one click away.
                </p>
              </div>
              <Link
                href={`/categories/${category.id}`}
                className="flex items-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-neutral-700 transition-all hover:gap-3"
              >
                See everything <ArrowRight size={14} />
              </Link>
            </div>

            <ProductSpotlightGrid products={categoryProducts} />
          </section>
        ))}

        <section>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="mb-2 inline-flex rounded-full bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Spotlight
              </span>
              <h2 className="mb-1 text-xl font-semibold text-neutral-900 sm:text-2xl">
                The week's most wanted
              </h2>
              <p className="max-w-2xl text-sm text-neutral-500">
                A tighter hero edit with fewer distractions and more focus on the products themselves.
              </p>
            </div>
            <Link
              href="/week-most-wanted"
              className="flex items-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-neutral-700 transition-all hover:gap-3"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {weeklyProducts.length > 0 ? (
            <ProductSpotlightGrid products={weeklyProducts} />
          ) : (
            <div className="py-5 text-sm text-neutral-400">No items currently available.</div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
