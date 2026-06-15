import React from 'react';
import { Link } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const isSale = product.sale_price !== null && product.sale_price !== undefined;
  const outOfStock = product.manage_stock && product.stock_quantity <= 0;
  const price = parseFloat(product.sale_price ?? product.regular_price ?? 0);
  const regularPrice = parseFloat(product.regular_price ?? 0);
  const savings = isSale && regularPrice > price ? Math.round(((regularPrice - price) / regularPrice) * 100) : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <Link href={`/products/${product.id}`} className="group relative flex h-full flex-col overflow-hidden bg-transparent rounded-lg transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-neutral-100 shadow-sm border border-neutral-200/50">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-200 text-neutral-400 font-serif italic text-4xl select-none">
            {product.name.charAt(0)}
          </div>
        )}

        {isSale && (
          <span className="absolute top-3 left-3 bg-red-50/90 backdrop-blur-xs text-red-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs border border-red-100">
            {savings > 0 ? `${savings}% Off` : 'Sale'}
          </span>
        )}
        
        {outOfStock && (
          <span className="absolute top-3 left-3 bg-neutral-950/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
            Sold Out
          </span>
        )}

        {!outOfStock && (
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hidden sm:block">
            <button
              className="w-full flex items-center justify-center gap-1.5 bg-neutral-950 hover:bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 px-4 rounded-full shadow-md transition-colors"
              onClick={handleAddToCart}
              title="Add to cart"
            >
              <ShoppingCart size={13} />
              Quick Add
            </button>
          </div>
        )}
      </div>

      <div className="pt-3 pb-2 flex flex-1 flex-col gap-1">
        <div className="flex min-h-[56px] flex-col gap-1">
          <h4 className="font-serif text-sm font-semibold text-neutral-900 group-hover:text-neutral-700 line-clamp-1 leading-snug sm:text-base">
            {product.name}
          </h4>
          <div className="flex min-h-[30px] flex-wrap items-baseline gap-x-2 gap-y-1">
            {isSale ? (
              <>
                <span className="text-[10px] text-neutral-400 line-through leading-none">${regularPrice.toFixed(2)}</span>
                <span className="text-xs font-semibold text-red-600 leading-none sm:text-sm">${price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-xs font-semibold text-neutral-900 leading-none sm:text-sm">${price.toFixed(2)}</span>
            )}
          </div>
        </div>
        <p className="min-h-[12px] text-[10px] font-semibold text-neutral-400 uppercase tracking-widest leading-none mt-0.5">
          {product.brand?.name || product.user?.brand_name || product.user?.name}
        </p>
        
        {/* On mobile devices, make the quick-add button visible under the info block instead of hover-overlay */}
        {!outOfStock && (
          <button
            className="sm:hidden mt-auto w-full flex items-center justify-center gap-1.5 bg-neutral-950 hover:bg-neutral-900 active:scale-98 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 px-4 rounded-full shadow-sm transition-all"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={12} />
            Quick Add
          </button>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
