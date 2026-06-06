import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from './Button';
import { ShoppingCart } from 'lucide-react';
import './ProductCard.css';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const isSale = product.sale_price !== null && product.sale_price !== undefined;
  const price = isSale ? product.sale_price : product.regular_price;
  const outOfStock = product.manage_stock && product.stock_quantity <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card-container shadow-sm">
      <div className="product-card-image-box">
        {/* Placeholder image that looks clean and modern */}
        <div className="product-card-img-placeholder flex-center">
          <span className="product-card-img-letter headline-md">{product.name.charAt(0)}</span>
        </div>
        {isSale && <span className="product-card-sale-badge label-md">Sale</span>}
      </div>

      <div className="product-card-info">
        <span className="product-card-brand label-md">{product.brand?.name || 'Store Item'}</span>
        <h4 className="product-card-title body-lg">{product.name}</h4>
        
        <div className="product-card-meta">
          <span className="product-card-seller body-md">Seller: {product.user?.brand_name || product.user?.name}</span>
        </div>

        <div className="product-card-price-row">
          <div className="product-card-pricing">
            {isSale ? (
              <>
                <span className="product-card-regular-price-old">${parseFloat(product.regular_price).toFixed(2)}</span>
                <span className="product-card-sale-price">${parseFloat(product.sale_price).toFixed(2)}</span>
              </>
            ) : (
              <span className="product-card-price">${parseFloat(product.regular_price).toFixed(2)}</span>
            )}
          </div>

          {outOfStock ? (
            <span className="product-card-stock-badge out-of-stock label-md">Out of Stock</span>
          ) : (
            <Button
              variant="secondary"
              className="product-card-cart-btn"
              onClick={handleAddToCart}
            >
              <ShoppingCart size={14} />
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
};
