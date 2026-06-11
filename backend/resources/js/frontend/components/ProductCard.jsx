import React from 'react';
import { Link } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { ArrowUpRight, ShoppingCart } from 'lucide-react';
import './ProductCard.css';

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
    <Link href={`/products/${product.id}`} className="product-card-container">
      <div className="product-card-image-box">
        <div className="product-card-image-glow" />
        <div className="product-card-img-placeholder">
          <span className="product-card-img-letter">{product.name.charAt(0)}</span>
        </div>

        <div className="product-card-topline">
          <span className="product-card-brand">{product.brand?.name || 'MyStore'}</span>
          <span className="product-card-link-icon">
            <ArrowUpRight size={16} />
          </span>
        </div>

        {isSale && <span className="product-card-sale-badge">{savings > 0 ? `${savings}% Off` : 'Sale'}</span>}

        {!outOfStock && (
          <div className="product-card-quick-add">
            <button
              className="product-card-quick-add-btn"
              onClick={handleAddToCart}
              title="Add to cart"
            >
              <ShoppingCart size={13} />
              Quick Add
            </button>
          </div>
        )}
      </div>

      <div className="product-card-info">
        <h4 className="product-card-title">{product.name}</h4>
        <p className="product-card-seller">by {product.user?.brand_name || product.user?.name}</p>

        <div className="product-card-price-row">
          <div className="product-card-pricing">
            {isSale ? (
              <>
                <span className="product-card-regular-price-old">${regularPrice.toFixed(2)}</span>
                <span className="product-card-sale-price">${price.toFixed(2)}</span>
              </>
            ) : (
              <span className="product-card-price">${price.toFixed(2)}</span>
            )}
          </div>

          {outOfStock && (
            <span className="product-card-stock-badge out-of-stock">Sold Out</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
