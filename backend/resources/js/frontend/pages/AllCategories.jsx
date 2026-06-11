import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  Car, Baby, Laptop, BookOpen, Gamepad2, Shirt, ShoppingBag,
  Home as HomeIcon, Wrench, Watch, Smile, Briefcase, Music,
  Gift, PenTool, Heart, Hammer, Dumbbell, Code, Compass,
  Plug, Gamepad, Sparkles, FileText, Leaf, Layers, ChevronRight
} from 'lucide-react';
import './AllCategories.css';

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
  const found = ALLOWED_MAIN_CATEGORIES.find(
    (a) => a.match.toLowerCase() === name.toLowerCase()
  );
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

// Color palette cycling for category tiles
const TILE_COLORS = [
  { bg: 'var(--color-primary-fixed)', icon: 'var(--color-primary)', border: 'var(--color-primary)' },
  { bg: 'var(--color-secondary-fixed)', icon: 'var(--color-secondary)', border: 'var(--color-secondary)' },
  { bg: 'var(--color-tertiary-fixed)', icon: 'var(--color-tertiary)', border: 'var(--color-tertiary)' },
  { bg: 'var(--color-surface-container)', icon: 'var(--color-primary)', border: 'var(--color-outline-variant)' },
];

export const AllCategories = () => {
  const { props } = usePage();
  const [categories, setCategories] = useState(props.categories || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCategories(Array.isArray(props.categories) ? props.categories : []);
    setLoading(false);
  }, [props.categories]);

  // Only root (parent) categories, filtered to allowed list
  const rootCategories = categories
    .filter((c) => c.parent_id === null)
    .filter((c) =>
      ALLOWED_MAIN_CATEGORIES.some(
        (a) => a.match.toLowerCase() === c.name.toLowerCase()
      )
    )
    .map((c) => ({
      ...c,
      displayName: getCategoryDisplayName(c.name),
      children: categories.filter((sub) => sub.parent_id === c.id),
    }));

  const handleCategoryClick = (catId) => {
    router.visit(`/?category=${catId}`, {
      preserveScroll: true,
    });
  };

  return (
    <div className="buyer-layout">
      <Navbar />

      <main className="all-categories-main">
        {/* Page Header */}
        <div className="ac-page-header">
          <div className="ac-header-inner container">
            <Breadcrumbs items={[{ label: 'All Categories' }]} />
            <h1 className="ac-page-title">All Categories</h1>
            <p className="ac-page-subtitle body-md">
              Browse all product categories available on MyStore.
            </p>
          </div>
        </div>

        <div className="container ac-content">
          {loading ? (
            <div className="ac-loading body-lg">Loading categories...</div>
          ) : rootCategories.length === 0 ? (
            <div className="ac-empty body-lg">No categories found.</div>
          ) : (
            <div className="ac-categories-grid">
              {rootCategories.map((cat, idx) => {
                const color = TILE_COLORS[idx % TILE_COLORS.length];
                return (
                  <div
                    key={cat.id}
                    className="ac-category-tile"
                    onClick={() => handleCategoryClick(cat.id)}
                    style={{ borderTopColor: color.border }}
                  >
                    {/* Icon */}
                    <div
                      className="ac-tile-icon"
                      style={{ background: color.bg, color: color.icon }}
                    >
                      {getCategoryIcon(cat.name, 32)}
                    </div>

                    {/* Info */}
                    <div className="ac-tile-info">
                      <h3 className="ac-tile-name">{cat.displayName}</h3>

                      {/* Sub-categories preview */}
                      {cat.children && cat.children.length > 0 && (
                        <ul className="ac-tile-subs">
                          {cat.children.slice(0, 3).map((sub) => (
                            <li
                              key={sub.id}
                              className="ac-tile-sub-item body-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryClick(sub.id);
                              }}
                            >
                              <ChevronRight size={12} />
                              {sub.name}
                            </li>
                          ))}
                          {cat.children.length > 3 && (
                            <li className="ac-tile-sub-more body-sm">
                              +{cat.children.length - 3} more
                            </li>
                          )}
                        </ul>
                      )}
                    </div>

                    {/* Footer CTA */}
                    <div className="ac-tile-footer">
                      <span className="ac-tile-cta" style={{ color: color.icon }}>
                        Shop Now →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AllCategories;
