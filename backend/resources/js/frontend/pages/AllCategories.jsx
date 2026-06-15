import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Car, Baby, Laptop, BookOpen, Gamepad2, Shirt, ShoppingBag,
  Home as HomeIcon, Wrench, Watch, Smile, Briefcase, Music,
  Gift, PenTool, Heart, Dumbbell, Code, Compass,
  Plug, Gamepad, Sparkles, Leaf, Layers, ChevronRight
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
  const found = ALLOWED_MAIN_CATEGORIES.find((a) => a.match.toLowerCase() === name.toLowerCase());
  return found ? found.name : name;
};

const getCategoryIcon = (name, size = 28) => {
  const n = (name || '').toLowerCase();
  if (n.includes('automotive') || n.includes('car')) return <Car size={size} />;
  if (n.includes('baby')) return <Baby size={size} />;
  if (n.includes('computer') || n.includes('electronic') || n.includes('laptop')) return <Laptop size={size} />;
  if (n.includes('book') || n.includes('media') || n.includes('reading')) return <BookOpen size={size} />;
  if (n.includes('toy') || n.includes('entertainment')) return <Gamepad2 size={size} />;
  if (n.includes('fashion') || n.includes('apparel') || n.includes('clothing')) return <Shirt size={size} />;
  if (n.includes('grocery') || n.includes('food') || n.includes('snack')) return <ShoppingBag size={size} />;
  if (n.includes('home') || n.includes('kitchen') || n.includes('lighting')) return <HomeIcon size={size} />;
  if (n.includes('industrial') || n.includes('tool') || n.includes('equipment')) return <Wrench size={size} />;
  if (n.includes('jewelry') || n.includes('watch') || n.includes('accessory')) return <Watch size={size} />;
  if (n.includes('kid')) return <Smile size={size} />;
  if (n.includes('luggage') || n.includes('bag') || n.includes('backpack')) return <Briefcase size={size} />;
  if (n.includes('musical') || n.includes('instrument') || n.includes('guitar')) return <Music size={size} />;
  if (n.includes('novelty') || n.includes('gift') || n.includes('keepsake')) return <Gift size={size} />;
  if (n.includes('office') || n.includes('stationery') || n.includes('planner')) return <PenTool size={size} />;
  if (n.includes('pet') || n.includes('dog') || n.includes('cat')) return <Heart size={size} />;
  if (n.includes('recreation') || n.includes('sport') || n.includes('fitness') || n.includes('camp')) return <Dumbbell size={size} />;
  if (n.includes('software') || n.includes('app') || n.includes('operating')) return <Code size={size} />;
  if (n.includes('travel') || n.includes('outdoor') || n.includes('tent')) return <Compass size={size} />;
  if (n.includes('utility') || n.includes('hardware') || n.includes('plug') || n.includes('bulb')) return <Plug size={size} />;
  if (n.includes('video game') || n.includes('console')) return <Gamepad size={size} />;
  if (n.includes('wellness') || n.includes('cosmetic') || n.includes('makeup')) return <Sparkles size={size} />;
  if (n.includes('yard') || n.includes('garden') || n.includes('seed')) return <Leaf size={size} />;
  if (n.includes('furniture') || n.includes('decor')) return <HomeIcon size={size} />;
  return <Layers size={size} />;
};

const TILE_ACCENT = Array(10).fill('group-hover:bg-neutral-50');
const ICON_COLORS = Array(10).fill('text-neutral-700 bg-neutral-100');

export const AllCategories = () => {
  const { props, url } = usePage();
  const [categories, setCategories] = useState(props.categories || []);
  const [loading, setLoading] = useState(false);
  const search = new URL(url || window.location.href, window.location.origin).searchParams.get('search') || '';

  useEffect(() => {
    setCategories(Array.isArray(props.categories) ? props.categories : []);
    setLoading(false);
  }, [props.categories]);

  const rootCategories = categories
    .filter((c) => c.parent_id === null)
    .filter((c) => ALLOWED_MAIN_CATEGORIES.some((a) => a.match.toLowerCase() === c.name.toLowerCase()))
    .map((c) => ({ ...c, displayName: getCategoryDisplayName(c.name), children: categories.filter((sub) => sub.parent_id === c.id) }))
    .filter((c) => {
      if (!search) return true;
      const query = search.toLowerCase();
      return c.name.toLowerCase().includes(query)
        || c.displayName.toLowerCase().includes(query)
        || c.children.some((sub) => sub.name.toLowerCase().includes(query));
    });

  const handleCategoryClick = (catId) => {
    router.visit(`/categories/${catId}`, { preserveScroll: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />

      {/* Page Header */}
      <div className="relative bg-gradient-to-br from-amber-50 via-neutral-50 to-rose-50 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <nav className="hidden items-center gap-2 mb-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400 sm:flex">
            <button className="hover:text-neutral-800 transition-colors" onClick={() => router.visit('/')}>Home</button>
            <span>/</span>
            <span className="text-neutral-800">All Categories</span>
          </nav>
          <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-700">Store directory</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-900 mb-2">
            {search ? `Categories for "${search}"` : 'All Categories'}
          </h1>
          <p className="text-sm text-neutral-500 max-w-xl">Choose a category first, then browse its products with subcategory and brand filters.</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-1 min-h-[100dvh]">
        {loading ? (
          <div className="text-sm text-neutral-400 py-10 text-center">Loading categories...</div>
        ) : rootCategories.length === 0 ? (
          <div className="text-sm text-neutral-400 py-10 text-center">No categories found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {rootCategories.map((cat, idx) => {
              const tileAccent = TILE_ACCENT[idx % TILE_ACCENT.length];
              const iconColor = ICON_COLORS[idx % ICON_COLORS.length];
              return (
                <div
                  key={cat.id}
                  className={`group bg-white rounded-2xl border border-neutral-100 ${tileAccent} p-4 flex flex-col gap-3 cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 select-none`}
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconColor}`}>
                    {getCategoryIcon(cat.name, 24)}
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <h3 className="font-semibold text-sm text-neutral-900">{cat.displayName}</h3>

                    {cat.children?.length > 0 && (
                      <ul className="flex flex-col gap-1 mt-auto">
                        {cat.children.slice(0, 3).map((sub) => (
                          <li
                            key={sub.id}
                            className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleCategoryClick(sub.id); }}
                          >
                            <ChevronRight size={10} className="shrink-0" />
                            <span className="truncate">{sub.name}</span>
                          </li>
                        ))}
                        {cat.children.length > 3 && (
                          <li className="text-[11px] text-neutral-400 mt-0.5">+{cat.children.length - 3} more</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 group-hover:text-neutral-900 transition-colors flex items-center gap-1">
                    View Category <ChevronRight size={10} />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AllCategories;
