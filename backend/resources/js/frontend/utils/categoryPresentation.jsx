import React from 'react';
import {
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

const CATEGORY_ALIASES = {
  'fashion & apparel': 'Fashion',
  'baby & kids': 'Baby & Kids',
  'gaming & entertainment': 'Gaming',
  'books & stationery': 'Books & Stationery',
  'sports & outdoors': 'Sports & Outdoors',
  'office & business supplies': 'Office Supplies',
  'beauty & personal care': 'Beauty & Personal Care',
  'grocery & gourmet food': 'Grocery & Gourmet',
};

export const getCategoryDisplayName = (name) => {
  if (!name) return '';
  return CATEGORY_ALIASES[name.toLowerCase()] || name;
};

export const getRootCategories = (categories = []) => (
  categories
    .filter((category) => category.parent_id === null)
    .map((category) => ({
      ...category,
      displayName: getCategoryDisplayName(category.name),
      children: categories.filter((child) => child.parent_id === category.id),
    }))
);

export const getCategoryIcon = (name, size = 22) => {
  const norm = (name || '').toLowerCase();
  if (norm.includes('automotive') || norm.includes('car')) return <Car size={size} />;
  if (norm.includes('baby') || norm.includes('kid')) return <Baby size={size} />;
  if (norm.includes('computer') || norm.includes('electronic') || norm.includes('laptop') || norm.includes('phone')) return <Laptop size={size} />;
  if (norm.includes('book') || norm.includes('media') || norm.includes('reading')) return <BookOpen size={size} />;
  if (norm.includes('toy') || norm.includes('entertainment')) return <Gamepad2 size={size} />;
  if (norm.includes('fashion') || norm.includes('apparel') || norm.includes('clothing') || norm.includes('shirt')) return <Shirt size={size} />;
  if (norm.includes('grocery') || norm.includes('food') || norm.includes('snack')) return <ShoppingBag size={size} />;
  if (norm.includes('home') || norm.includes('kitchen') || norm.includes('furniture') || norm.includes('lighting')) return <HomeIcon size={size} />;
  if (norm.includes('industrial') || norm.includes('tool') || norm.includes('equipment')) return <Wrench size={size} />;
  if (norm.includes('jewelry') || norm.includes('watch') || norm.includes('accessory')) return <Watch size={size} />;
  if (norm.includes('luggage') || norm.includes('bag') || norm.includes('backpack')) return <Briefcase size={size} />;
  if (norm.includes('musical') || norm.includes('instrument') || norm.includes('guitar')) return <Music size={size} />;
  if (norm.includes('novelty') || norm.includes('gift')) return <Gift size={size} />;
  if (norm.includes('office') || norm.includes('stationery') || norm.includes('planner')) return <PenTool size={size} />;
  if (norm.includes('pet') || norm.includes('dog') || norm.includes('cat')) return <Heart size={size} />;
  if (norm.includes('recreation') || norm.includes('sport') || norm.includes('fitness') || norm.includes('camp')) return <Dumbbell size={size} />;
  if (norm.includes('software') || norm.includes('app')) return <Code size={size} />;
  if (norm.includes('utility') || norm.includes('hardware') || norm.includes('plug') || norm.includes('bulb')) return <Plug size={size} />;
  if (norm.includes('video game') || norm.includes('console') || norm.includes('gaming')) return <Gamepad size={size} />;
  if (norm.includes('wellness') || norm.includes('cosmetic') || norm.includes('makeup') || norm.includes('beauty')) return <Sparkles size={size} />;
  if (norm.includes('paper') || norm.includes('notebook')) return <FileText size={size} />;
  if (norm.includes('yard') || norm.includes('garden') || norm.includes('seed') || norm.includes('eco')) return <Leaf size={size} />;
  if (norm.includes('smile')) return <Smile size={size} />;
  return <Layers size={size} />;
};
