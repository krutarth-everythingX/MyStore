import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { ShoppingCart, ArrowLeft, Archive, CheckCircle, AlertTriangle, Truck, Heart, Star } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import './ProductDetails.css';

const StarSelector = ({ rating, onChange, readonly = false }) => {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={readonly ? 16 : 24}
          style={{ cursor: readonly ? 'default' : 'pointer' }}
          fill={star <= rating ? 'var(--color-primary)' : 'none'}
          color={star <= rating ? 'var(--color-primary)' : 'var(--color-outline)'}
          onClick={() => !readonly && onChange && onChange(star)}
        />
      ))}
    </div>
  );
};

const ProductRecommendations = ({ productId, categoryId, initialRelated = [] }) => {
  const [related, setRelated] = useState(initialRelated);

  useEffect(() => {
    setRelated(initialRelated);
  }, [categoryId, initialRelated, productId]);

  if (related.length === 0) return null;

  return (
    <div style={{ marginTop: 40 }}>
      <h3 className="headline-sm" style={{ marginBottom: 16 }}>Related Products</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 20
      }}>
        {related.map((p) => {
          const price = p.sale_price ?? p.regular_price;
          return (
            <Link href={`/products/${p.id}`} key={p.id} className="card" style={{ textDecoration: 'none', padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{
                height: 140,
                backgroundColor: 'var(--color-surface-container-high)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <span className="display-text" style={{ fontSize: 36 }}>{p.name.charAt(0)}</span>
              </div>
              <strong className="body-md" style={{ color: 'var(--color-on-surface)' }}>{p.name}</strong>
              <span className="label-lg" style={{ color: 'var(--color-primary)', fontWeight: 600, marginTop: 8 }}>
                ${parseFloat(price).toFixed(2)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const ProductDetails = () => {
  const { props, url } = usePage();
  const id = new URL(url || window.location.href, window.location.origin).pathname.split('/').filter(Boolean).pop();
  const [product, setProduct] = useState(props.productDetails || null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(!props.productDetails);
  const [error, setError] = useState('');

  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariation, setSelectedVariation] = useState(null);

  const [reviews, setReviews] = useState(props.productReviews || []);
  const [averageRating, setAverageRating] = useState(props.averageRating || 0.0);
  const [totalReviews, setTotalReviews] = useState(props.totalReviews || 0);

  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const { addToCart } = useCart();
  const { token, user } = useAuth();
  const { isWishlisted, toggleWishlist, loadingIds } = useWishlist();

  useEffect(() => {
    setProduct(props.productDetails || null);
    setReviews(props.productReviews || []);
    setAverageRating(props.averageRating || 0.0);
    setTotalReviews(props.totalReviews || 0);
    setLoading(false);
    setError(props.productDetails ? '' : 'Product not found');
  }, [props.averageRating, props.productDetails, props.productReviews, props.totalReviews]);

  useEffect(() => {
    if (props.productDetails && token && user?.role === 'buyer') {
      // Use native fetch (not Inertia router) — this endpoint returns plain JSON,
      // not an Inertia response, so router.post() would throw a mismatch error.
      fetch(`/recently-viewed/${props.productDetails.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'same-origin',
      }).catch(() => {
        // Silently ignore tracking errors — non-critical
      });
    }
  }, [props.productDetails?.id, token, user?.id]);

  useEffect(() => {
    if (product && product.type === 'variable' && product.variations) {
      const matched = product.variations.find((v) => {
        return Object.entries(selectedOptions).every(([name, val]) => {
          return v.attributes && v.attributes[name] === val;
        });
      });
      setSelectedVariation(matched || null);
    } else {
      setSelectedVariation(null);
    }
  }, [selectedOptions, product]);

  const handleAddToCart = () => {
    if (product.type === 'variable' && !selectedVariation) {
      alert('Please select product options first.');
      return;
    }

    const targetProduct = selectedVariation || product;
    if (targetProduct) {
      addToCart(targetProduct, qty);
      router.visit('/cart');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);

    try {
      await new Promise((resolve, reject) => {
        router.post(`/products/${id}/reviews`, {
          rating: userRating,
          comment: userComment
        }, {
          preserveScroll: true,
          preserveState: false,
          only: ['productDetails', 'productReviews', 'averageRating', 'totalReviews', 'relatedProducts', 'flash'],
          onSuccess: () => resolve(),
          onError: (errors) => reject(new Error(Object.values(errors)[0] || 'Verified customer check failed.')),
          onFinish: () => setSubmittingReview(false),
        });
      });

      setReviewSuccess(true);
      setUserComment('');
      setUserRating(5);
    } catch (err) {
      setReviewError(err.message || 'Error submitting review');
    }
  };

  if (loading) {
    return (
      <div className="buyer-layout">
        <Navbar />
        <div className="container details-loading flex-center">
          <span className="body-lg">Loading product details...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="buyer-layout">
        <Navbar />
        <div className="container details-error flex-center">
          <Card title="Error" className="details-error-card">
            <p className="body-lg">{error || 'Failed to load product.'}</p>
            <Link href="/">
              <Button variant="primary" style={{ marginTop: 16 }}>
                <ArrowLeft size={16} style={{ marginRight: 6 }} />
                Back to Shop
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const currentProduct = selectedVariation || product;
  const hasOptionsSelected = product.type === 'variable'
    ? Object.keys(selectedOptions).length === (product.attributes?.length || 0) && Object.values(selectedOptions).every(Boolean)
    : true;
  const isCombinationValid = product.type === 'variable' ? !!selectedVariation : true;

  const isSale = currentProduct.sale_price !== null && currentProduct.sale_price !== undefined;
  const outOfStock = currentProduct.manage_stock && currentProduct.stock_quantity <= 0;

  // Build breadcrumb items
  const buildBreadcrumbs = () => {
    const crumbs = [];
    if (product.categories && product.categories.length > 0) {
      const cat = product.categories[0];
      crumbs.push({ label: cat.name, url: `/?category=${cat.id}` });
    }
    crumbs.push({ label: product.name });
    return crumbs;
  };

  return (
    <div className="buyer-layout">
      <Navbar />

      <main className="container details-main animate-fade-in">
        <Breadcrumbs items={buildBreadcrumbs()} />
        <Link href="/" className="details-back-link label-md">
          <ArrowLeft size={16} style={{ marginRight: 6 }} />
          Back to Catalog
        </Link>

        <div className="details-grid">
          <div className="details-image-container">
            <div className="details-image-placeholder flex-center">
              <span className="details-image-letter display-text">{product.name.charAt(0)}</span>
            </div>
            {isSale && <span className="details-sale-tag label-md">Sale</span>}
          </div>

          <div className="details-info-container">
            <span className="details-brand label-md">{product.brand?.name || 'Store Item'}</span>
            <h1 className="details-title headline-lg" style={{ marginBottom: 4 }}>{product.name}</h1>

            <div className="flex-center" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 16px 0' }}>
              <StarSelector rating={Math.round(averageRating)} readonly={true} />
              <span className="body-md" style={{ color: 'var(--color-outline)', fontWeight: 600 }}>
                {averageRating > 0 ? `${averageRating.toFixed(1)} / 5.0` : 'No reviews'} ({totalReviews} reviews)
              </span>
            </div>

            <div className="details-seller-row">
              <span className="body-md" style={{ color: 'var(--color-outline)' }}>
                Seller: <strong style={{ color: 'var(--color-on-surface)' }}>{product.user?.brand_name || product.user?.name}</strong>
              </span>
            </div>

            <div className="details-pricing">
              {isSale ? (
                <>
                  <span className="details-price-old">${parseFloat(currentProduct.regular_price).toFixed(2)}</span>
                  <span className="details-price-sale">${parseFloat(currentProduct.sale_price).toFixed(2)}</span>
                </>
              ) : (
                <span className="details-price">${parseFloat(currentProduct.regular_price).toFixed(2)}</span>
              )}
            </div>

            <p className="details-short-desc body-md">{product.short_description || 'No short description provided.'}</p>

            {product.type === 'variable' && product.attributes && (
              <div className="variation-selectors" style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span className="label-md" style={{ fontWeight: 600 }}>Select Product Options:</span>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {product.attributes.map((attr) => (
                    <div key={attr.name} className="input-container" style={{ flex: '1 1 150px' }}>
                      <label className="input-label label-sm" style={{ marginBottom: 4 }}>{attr.name}</label>
                      <select
                        className="input-field"
                        value={selectedOptions[attr.name] || ''}
                        onChange={(e) => setSelectedOptions((prev) => ({
                          ...prev,
                          [attr.name]: e.target.value
                        }))}
                        style={{ padding: '8px 12px' }}
                      >
                        <option value="">-- Choose {attr.name} --</option>
                        {attr.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.type === 'variable' && hasOptionsSelected && !selectedVariation && (
              <div className="stock-alert alert-out body-md" style={{ margin: '12px 0' }}>
                <AlertTriangle size={18} style={{ marginRight: 8 }} />
                This combination is currently unavailable.
              </div>
            )}

            <div className="details-divider"></div>

            <div className="details-stock-status">
              {outOfStock || (product.type === 'variable' && hasOptionsSelected && !isCombinationValid) ? (
                <div className="stock-alert alert-out body-md">
                  <AlertTriangle size={18} style={{ marginRight: 8 }} />
                  {product.type === 'variable' && hasOptionsSelected && !isCombinationValid ? 'Combination Unavailable' : 'Currently Out of Stock'}
                </div>
              ) : (
                <div className="stock-alert alert-in body-md">
                  <CheckCircle size={18} style={{ marginRight: 8 }} />
                  In Stock {currentProduct.manage_stock && `(${currentProduct.stock_quantity} units available)`}
                </div>
              )}
            </div>

            {!outOfStock && (product.type !== 'variable' || isCombinationValid) && (
              <div className="details-actions-row">
                <div className="qty-selector">
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="qty-input"
                    value={qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0) {
                        setQty(currentProduct.manage_stock ? Math.min(currentProduct.stock_quantity, val) : val);
                      }
                    }}
                    min="1"
                    max={currentProduct.manage_stock ? currentProduct.stock_quantity : undefined}
                  />
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => currentProduct.manage_stock ? Math.min(currentProduct.stock_quantity, q + 1) : q + 1)}
                    disabled={currentProduct.manage_stock && qty >= currentProduct.stock_quantity}
                  >
                    +
                  </button>
                </div>

                <Button
                  variant="primary"
                  className="details-cart-btn"
                  onClick={handleAddToCart}
                  disabled={product.type === 'variable' && (!hasOptionsSelected || !isCombinationValid)}
                >
                  <ShoppingCart size={18} style={{ marginRight: 8 }} />
                  Add to Shopping Cart
                </Button>

                {token && user?.role === 'buyer' && (
                  <button
                    className={`details-wishlist-btn ${isWishlisted(product.id) ? 'wishlisted' : ''}`}
                    onClick={() => toggleWishlist(product)}
                    disabled={loadingIds.includes(product.id)}
                    title={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart size={20} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>
            )}

            <div className="details-divider"></div>

            <div className="details-specs">
              <h5 className="specs-title label-md">Specifications</h5>
              <div className="specs-grid">
                <span className="spec-label body-md">SKU:</span>
                <span className="spec-value body-md">{currentProduct.sku || 'N/A'}</span>

                <span className="spec-label body-md">Weight:</span>
                <span className="spec-value body-md">{currentProduct.weight ? `${currentProduct.weight} kg` : 'N/A'}</span>

                <span className="spec-label body-md">Dimensions:</span>
                <span className="spec-value body-md">
                  {currentProduct.length && currentProduct.width && currentProduct.height
                    ? `${currentProduct.length} x ${currentProduct.width} x ${currentProduct.height} cm`
                    : 'N/A'}
                </span>

                <span className="spec-label body-md">Tax Status:</span>
                <span className="spec-value body-md" style={{ textTransform: 'capitalize' }}>{product.tax_status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="details-extended-section grid-12" style={{ marginTop: 40, gap: 24 }}>
          <div className="col-span-8" style={{ gridColumn: 'span 8' }}>
            <Card title="Product Description">
              <p className="body-md" style={{ whiteSpace: 'pre-line', lineHeight: '24px' }}>
                {product.description || 'No detailed description available.'}
              </p>
            </Card>
          </div>

          <div className="col-span-4" style={{ gridColumn: 'span 4' }}>
            <Card title="Warehouse Inventory Location">
              {product.warehouses && product.warehouses.length > 0 ? (
                <div className="warehouse-list">
                  {product.warehouses.map((wh) => (
                    <div key={wh.id} className="wh-item" style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 12, marginBottom: 12 }}>
                      <div className="wh-meta">
                        <span className="wh-name title-lg">{wh.name}</span>
                        <span className="wh-code label-md" style={{ marginLeft: 8, color: 'var(--color-primary)' }}>{wh.code}</span>
                      </div>
                      <div className="wh-details body-md" style={{ marginTop: 6, display: 'flex', alignItems: 'center' }}>
                        <Archive size={14} style={{ marginRight: 6, color: 'var(--color-outline)' }} />
                        <span>Shelf Location: <strong>{wh.pivot?.bin_location || 'Unassigned'}</strong></span>
                      </div>
                      <div className="wh-details body-md" style={{ display: 'flex', alignItems: 'center' }}>
                        <Truck size={14} style={{ marginRight: 6, color: 'var(--color-outline)' }} />
                        <span>Shipping Courier: <strong>{wh.default_carrier || 'Blue Dart'}</strong></span>
                      </div>
                      <div className="wh-qty label-md" style={{ marginTop: 6, fontWeight: 700 }}>
                        Stock Qty: {wh.pivot?.quantity || 0}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="body-md" style={{ color: 'var(--color-outline)' }}>
                  This product is currently not allocated to any warehouse inventory.
                </p>
              )}
            </Card>
          </div>
        </div>

        <div className="details-extended-section grid-12" style={{ marginTop: 30, gap: 24 }}>
          <div className="col-span-8" style={{ gridColumn: 'span 8' }}>
            <Card title={`Verified Customer Reviews (${totalReviews})`}>
              {reviews.length === 0 ? (
                <p className="body-md" style={{ color: 'var(--color-outline)' }}>
                  No customer reviews have been submitted for this product yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {reviews.map((rev) => (
                    <div key={rev.id} style={{ borderBottom: '1px dashed var(--color-outline-variant)', paddingBottom: 16 }}>
                      <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong className="body-md" style={{ color: 'var(--color-on-surface)' }}>{rev.user?.name}</strong>
                        <span className="body-sm" style={{ color: 'var(--color-outline)' }}>
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <StarSelector rating={rev.rating} readonly={true} />
                      </div>
                      <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="col-span-4" style={{ gridColumn: 'span 4' }}>
            {token && user?.role === 'buyer' ? (
              <Card title="Submit a Review">
                {reviewSuccess ? (
                  <div className="stock-alert alert-in body-md animate-fade-in" style={{ backgroundColor: 'rgba(46, 125, 50, 0.1)', border: '1px solid #2e7d32', padding: 12, borderRadius: 8 }}>
                    <CheckCircle size={18} style={{ marginRight: 8, color: '#2e7d32', verticalAlign: 'middle' }} />
                    Review submitted successfully!
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit}>
                    {reviewError && (
                      <div className="checkout-alert checkout-alert-error body-sm" style={{ padding: '8px 12px', marginBottom: 12, borderRadius: 6 }}>
                        <AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {reviewError}
                      </div>
                    )}
                    <div className="input-container" style={{ marginBottom: 16 }}>
                      <label className="input-label label-md" style={{ marginBottom: 8 }}>Your Rating</label>
                      <StarSelector rating={userRating} onChange={setUserRating} />
                    </div>
                    <div className="input-container" style={{ marginBottom: 16 }}>
                      <label className="input-label label-md">Review Comments</label>
                      <textarea
                        className="input-field"
                        rows="3"
                        placeholder="Write your review comments here..."
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        required
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      style={{ width: '100%', padding: '10px !important' }}
                      disabled={submittingReview}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                )}
              </Card>
            ) : (
              <Card title="Feedback & Review">
                <p className="body-md" style={{ color: 'var(--color-outline)', lineHeight: '20px' }}>
                  Please <Link href="/login" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>log in</Link> as a buyer to leave verified customer feedback on items you purchase.
                </p>
              </Card>
            )}
          </div>
        </div>

        {product && (
          <ProductRecommendations productId={product.id} categoryId={product.categories?.[0]?.id} initialRelated={props.relatedProducts || []} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetails;
