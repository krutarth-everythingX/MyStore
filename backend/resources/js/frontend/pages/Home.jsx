import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Layers } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { formatProductMoney } from '../utils/localization';
import { getCategoryDisplayName, getCategoryIcon, getRootCategories } from '../utils/categoryPresentation';

const productPrice = (product) => Number(product.sale_price ?? product.regular_price ?? 0);

const productBelongsToCategory = (product, category) => {
  const categoryIds = [category.id, ...(category.children || []).map((child) => child.id)];
  return product.categories?.some(
    (productCategory) => categoryIds.includes(productCategory.id) || categoryIds.includes(productCategory.parent_id),
  );
};

const SectionHeading = ({ eyebrow, title, description, href, hrefLabel }) => (
  <div className="mb-5 flex flex-col gap-3 border-b-2 border-neutral-950 pb-3 md:mb-6 md:flex-row md:items-end md:justify-between md:gap-4 md:pb-4">
    <div className="max-w-2xl">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">{eyebrow}</span>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
    </div>
    {href && (
      <Link href={href} className="hidden md:inline-flex items-center gap-2 border-2 border-neutral-950 bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-950 hover:text-white">
        {hrefLabel} <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

const MobileViewAllCard = ({ href, label }) => (
  <Link
    href={href}
    className="flex min-h-[13.5rem] items-end border-2 border-neutral-950 bg-neutral-950 p-3 text-white shadow-[6px_6px_0_#171717] transition hover:-translate-y-1 md:hidden"
  >
    <div>
      <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">More</span>
      <span className="mt-2 inline-flex items-center gap-2 text-base font-semibold">
        {label} <ArrowRight size={14} />
      </span>
    </div>
  </Link>
);

const ProductSpotlightGrid = ({ products, pageProps, mobileViewAllHref, mobileViewAllLabel }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
    {products.slice(0, 3).map((product) => (
      <Link
        key={product.id}
        href={`/products/${product.id}`}
        className="group border-2 border-neutral-950 bg-white shadow-[6px_6px_0_#171717] transition hover:-translate-y-1 md:shadow-[8px_8px_0_#171717]"
      >
        <div className="aspect-[4/3.7] border-b-2 border-neutral-950 bg-neutral-100 md:aspect-[4/4.2]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-semibold uppercase text-neutral-300 md:text-4xl">
              {product.name?.charAt(0)}
            </div>
          )}
        </div>
        <div className="space-y-2 p-3 md:space-y-3 md:p-4">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 md:text-xs md:tracking-[0.16em]">
            {product.brand?.name || product.user?.name || 'Featured'}
          </span>
          <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-neutral-950 md:text-lg md:leading-6">{product.name}</h4>
          <div className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-2 md:pt-3">
            <span className="text-sm font-semibold text-neutral-950 md:text-base">{formatProductMoney(product, productPrice(product), pageProps)}</span>
            <span className="hidden text-sm text-neutral-600 transition group-hover:text-neutral-950 md:inline">Discover</span>
          </div>
        </div>
      </Link>
    ))}
    {mobileViewAllHref && mobileViewAllLabel && <MobileViewAllCard href={mobileViewAllHref} label={mobileViewAllLabel} />}
  </div>
);

const CategorySpotlightGrid = ({ categories, products, mobileViewAllHref, mobileViewAllLabel }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
    {categories.slice(0, 3).map((category) => {
      const heroProduct = products.find((product) => productBelongsToCategory(product, category));
      return (
        <Link
          key={category.id}
          href={`/categories/${category.id}`}
          className="group border-2 border-neutral-950 bg-white shadow-[6px_6px_0_#171717] transition hover:-translate-y-1 md:shadow-[8px_8px_0_#171717]"
        >
          <div className="flex aspect-[1/0.92] items-center justify-center border-b-2 border-neutral-950 bg-neutral-100 md:aspect-square">
            {heroProduct?.image_url ? (
              <img src={heroProduct.image_url} alt={getCategoryDisplayName(category.name)} className="h-full w-full object-cover" />
            ) : (
              <div className="scale-75 text-neutral-500 md:scale-100">{getCategoryIcon(category.name, 38)}</div>
            )}
          </div>
          <div className="space-y-2 p-3 md:p-4">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 md:text-xs md:tracking-[0.16em]">
              {category.children?.length || 0} sections
            </span>
            <h4 className="text-sm font-semibold text-neutral-950 md:text-lg">{getCategoryDisplayName(category.name)}</h4>
            <span className="inline-flex items-center gap-2 text-sm text-neutral-600 transition group-hover:text-neutral-950">
              View <ArrowRight size={12} />
            </span>
          </div>
        </Link>
      );
    })}
    {mobileViewAllHref && mobileViewAllLabel && <MobileViewAllCard href={mobileViewAllHref} label={mobileViewAllLabel} />}
  </div>
);

export const Home = () => {
  const { props, url } = usePage();
  const [products, setProducts] = useState(props.products || []);
  const [categories, setCategories] = useState(props.categories || []);
  const [collections, setCollections] = useState(props.collections || []);

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
      router.visit('/categories', { replace: true, preserveScroll: true });
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
    setCollections(Array.isArray(props.collections) ? props.collections : []);
  }, [props.products, props.categories, props.collections]);

  const rootCategories = useMemo(() => getRootCategories(categories), [categories]);
  const categorySections = rootCategories
    .map((category) => ({
      category,
      products: products.filter((product) => productBelongsToCategory(product, category)).slice(0, 3),
    }))
    .filter((section) => section.products.length > 0)
    .slice(0, 3);

  const weeklyProducts = products.slice(0, 3);
  const popularProducts = products.slice(3, 6);

  const handleSearch = (query) => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    router.visit(`/categories${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-950">
      <Navbar onSearch={handleSearch} />

      <section className="border-b-2 border-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="hidden border-2 border-neutral-950 bg-white p-6 shadow-[10px_10px_0_#171717] sm:block sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Storefront</span>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Premium essentials with a straight-edge presentation.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                Browse clean category edits, curated collections, and standout products from verified sellers in one minimal storefront.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/categories" className="border-2 border-neutral-950 bg-neutral-950 px-5 py-3 text-sm font-medium text-white">
                  Explore categories
                </Link>
                <Link href="/week-most-wanted" className="border-2 border-neutral-950 bg-white px-5 py-3 text-sm font-medium text-neutral-950">
                  Most wanted this weekend
                </Link>
              </div>
            </div>

            <div className="border-2 border-neutral-950 bg-white p-4 shadow-[8px_8px_0_#171717] sm:hidden">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Storefront</span>
                  <h1 className="mt-2 text-2xl font-semibold leading-8 tracking-tight text-neutral-950">Premium essentials in a straight-edge storefront.</h1>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Browse categories, collections, and standout products from verified sellers.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                <Link href="/categories" className="shrink-0 border-2 border-neutral-950 bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
                  Categories
                </Link>
                <Link href="/week-most-wanted" className="shrink-0 border-2 border-neutral-950 bg-white px-4 py-2 text-sm font-medium text-neutral-950">
                  Weekend picks
                </Link>
              </div>
            </div>

            <div className="hidden gap-4 sm:grid">
              <div className="border-2 border-neutral-950 bg-[#dbeafe] p-5 shadow-[8px_8px_0_#171717]">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">Popular now</span>
                <p className="mt-3 text-xl font-semibold text-neutral-950">Clean category-first browsing for faster shopping.</p>
              </div>
              <div className="border-2 border-neutral-950 bg-[#f5f5f4] p-5 shadow-[8px_8px_0_#171717]">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">This weekend</span>
                <p className="mt-3 text-xl font-semibold text-neutral-950">Top picks, curated collections, and tighter product edits.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:px-8">
        {rootCategories.length > 0 && (
          <section>
            <SectionHeading
              eyebrow="Categories"
              title="Shop by category"
              description="Choose a department first, then move into the right products with less clutter and clearer entry points."
              href="/categories"
              hrefLabel="View all"
            />
            <CategorySpotlightGrid
              categories={rootCategories}
              products={products}
              mobileViewAllHref="/categories"
              mobileViewAllLabel="View all"
            />
          </section>
        )}

        {collections.length > 0 && (
          <section>
            <SectionHeading
              eyebrow="Collections"
              title="Collection products"
              description="Seller-built groups designed for quick discovery and focused browsing."
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
              {collections.slice(0, 3).map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.handle}`}
                  className="group border-2 border-neutral-950 bg-white shadow-[6px_6px_0_#171717] transition hover:-translate-y-1 md:shadow-[8px_8px_0_#171717]"
                >
                  <div className="flex aspect-[1/0.92] items-center justify-center border-b-2 border-neutral-950 bg-neutral-100 md:aspect-[1/1]">
                    {collection.image ? (
                      <img src={collection.image} alt={collection.title} className="h-full w-full object-cover" />
                    ) : (
                      <Layers size={30} className="text-neutral-500 md:size-[34px]" />
                    )}
                  </div>
                  <div className="space-y-2 p-3 md:space-y-3 md:p-4">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 md:text-xs md:tracking-[0.16em]">
                      {collection.product_count || 0} product{collection.product_count === 1 ? '' : 's'}
                    </span>
                    <h3 className="text-sm font-semibold text-neutral-950 md:text-lg">{collection.title}</h3>
                    <p className="line-clamp-3 text-xs leading-5 text-neutral-600 md:text-sm md:leading-6">{collection.description || 'Explore this curated seller collection.'}</p>
                    <span className="inline-flex items-center gap-2 text-sm text-neutral-600 transition group-hover:text-neutral-950">
                      View collection <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
              <MobileViewAllCard href="/collections" label="View all" />
            </div>
          </section>
        )}

        <section>
          <SectionHeading
            eyebrow="Most Wanted"
            title="Most wanted this weekend"
            description="A tighter hero edit with fewer distractions and more focus on the products themselves."
            href="/week-most-wanted"
            hrefLabel="View all"
          />
          {weeklyProducts.length > 0 ? (
            <ProductSpotlightGrid
              products={weeklyProducts}
              pageProps={props}
              mobileViewAllHref="/week-most-wanted"
              mobileViewAllLabel="View all"
            />
          ) : (
            <div className="border-2 border-neutral-950 bg-white p-6 text-sm text-neutral-600 shadow-[8px_8px_0_#171717]">No items currently available.</div>
          )}
        </section>

        {popularProducts.length > 0 && (
          <section>
            <SectionHeading
              eyebrow="Popular"
              title="Popular right now"
              description="The products customers are likely to check first, presented in a simpler grid."
            />
            <ProductSpotlightGrid
              products={popularProducts}
              pageProps={props}
              mobileViewAllHref="/categories"
              mobileViewAllLabel="View all"
            />
          </section>
        )}

        {categorySections.map(({ category, products: categoryProducts }) => (
          <section key={category.id}>
            <SectionHeading
              eyebrow={getCategoryDisplayName(category.name)}
              title={`${getCategoryDisplayName(category.name)} picks`}
              description="A focused edit from this category, with the full page one click away."
              href={`/categories/${category.id}`}
              hrefLabel="See all"
            />
            <ProductSpotlightGrid
              products={categoryProducts}
              pageProps={props}
              mobileViewAllHref={`/categories/${category.id}`}
              mobileViewAllLabel="View all"
            />
          </section>
        ))}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
