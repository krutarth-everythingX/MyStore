import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import { formatProductMoney } from '../utils/localization';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { props } = usePage();

  const isSale = product.sale_price !== null && product.sale_price !== undefined;
  const outOfStock = product.manage_stock && product.stock_quantity <= 0;
  const price = parseFloat(product.sale_price ?? product.regular_price ?? 0);
  const regularPrice = parseFloat(product.regular_price ?? 0);
  const savings = isSale && regularPrice > price ? Math.round(((regularPrice - price) / regularPrice) * 100) : 0;
  const quickActionLabel =
    product.type === 'variable'
      ? 'View options'
      : product.type === 'grouped'
        ? 'View collection'
        : product.type === 'external'
          ? product.external_button_text || 'View deal'
          : 'Quick add';
  const canQuickAdd = product.type === 'simple' && !outOfStock;

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canQuickAdd) return;
    addToCart(product, 1);
  };

  return (
    <Link href={`/products/${product.id}`} className="group flex h-full flex-col border-2 border-neutral-950 bg-white shadow-[6px_6px_0_#171717] transition hover:-translate-y-1 md:shadow-[8px_8px_0_#171717]">
      <div className="relative border-b-2 border-neutral-950 bg-neutral-100">
        <div className="aspect-[4/4.4] md:aspect-[4/4.2]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-semibold uppercase text-neutral-300 md:text-4xl">
              {product.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="absolute left-2 top-2 flex flex-wrap gap-2 md:left-3 md:top-3">
          {isSale && (
            <span className="border border-neutral-950 bg-[#fef3c7] px-1.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-neutral-950 md:px-2 md:text-[10px] md:tracking-[0.14em]">
              {savings > 0 ? `${savings}% Off` : 'Sale'}
            </span>
          )}
          {outOfStock && (
            <span className="border border-neutral-950 bg-white px-1.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-neutral-950 md:px-2 md:text-[10px] md:tracking-[0.14em]">
              Sold Out
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5 md:p-4">
        <div className="space-y-1.5 md:space-y-2">
          <h4 className="line-clamp-2 text-sm font-semibold leading-4 text-neutral-950 md:text-lg md:leading-6">{product.name}</h4>
          <div className="flex flex-wrap items-center gap-1.5 text-xs md:gap-2 md:text-sm">
            {isSale ? (
              <>
                <span className="text-[11px] text-neutral-400 line-through md:text-sm">{formatProductMoney(product, regularPrice, props)}</span>
                <span className="font-semibold text-neutral-950">{formatProductMoney(product, price, props)}</span>
              </>
            ) : (
              <span className="font-semibold text-neutral-950">{formatProductMoney(product, price, props)}</span>
            )}
          </div>
        </div>

        <div className="mt-3 border-t border-neutral-200 pt-2 md:mt-4 md:pt-3">
          {product.user?.id ? (
            <Link href={`/stores/${product.user.id}`} onClick={(event) => event.stopPropagation()} className="line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 transition hover:text-neutral-950 md:text-xs md:tracking-[0.14em]">
              {product.brand?.name || product.user?.brand_name || product.user?.name}
            </Link>
          ) : (
            <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 md:text-xs md:tracking-[0.14em]">
              {product.brand?.name || product.user?.brand_name || product.user?.name}
            </p>
          )}
        </div>

        <div className="mt-auto pt-3 md:pt-4">
          {!outOfStock &&
          (canQuickAdd ? (
            <button
              onClick={handleAddToCart}
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 border-2 border-neutral-950 bg-neutral-950 px-2 text-xs font-medium text-white transition hover:bg-neutral-800 md:h-10 md:gap-2 md:px-4 md:text-sm"
            >
              <ShoppingCart size={12} className="md:h-[14px] md:w-[14px]" />
              <span className="truncate">{quickActionLabel}</span>
            </button>
          ) : (
            <span className="inline-flex h-8 w-full items-center justify-center border-2 border-neutral-950 bg-white px-2 text-xs font-medium text-neutral-950 md:h-10 md:px-4 md:text-sm">
              <span className="truncate">{quickActionLabel}</span>
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
