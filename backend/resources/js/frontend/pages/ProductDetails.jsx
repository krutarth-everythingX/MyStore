import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShoppingCart, ArrowLeft, Archive, CheckCircle, AlertTriangle, Truck, Heart, Star } from 'lucide-react';

const StarSelector = ({ rating, onChange, readonly = false }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={readonly ? 14 : 22}
        className={`${readonly ? '' : 'cursor-pointer'} transition-colors`}
        fill={star <= rating ? '#111' : 'none'}
        color={star <= rating ? '#111' : '#d4d4d4'}
        onClick={() => !readonly && onChange && onChange(star)}
      />
    ))}
  </div>
);

const ProductRecommendations = ({ productId, categoryId, initialRelated = [] }) => {
  const [related, setRelated] = useState(initialRelated);
  useEffect(() => { setRelated(initialRelated); }, [categoryId, initialRelated, productId]);
  if (related.length === 0) return null;

  return (
    <div className="mt-14">
      <h3 className="font-serif text-xl font-semibold text-neutral-900 mb-6">Related Products</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {related.map((p) => {
          const price = p.sale_price ?? p.regular_price;
          return (
            <Link href={`/products/${p.id}`} key={p.id} className="group bg-white rounded-2xl border border-neutral-100 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="aspect-square rounded-xl bg-neutral-100 flex items-center justify-center font-serif italic text-3xl text-neutral-400">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover rounded-xl" /> : p.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-2">{p.name}</p>
                <span className="text-xs font-semibold text-neutral-900 mt-1 block">${parseFloat(price).toFixed(2)}</span>
              </div>
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
      fetch(`/recently-viewed/${props.productDetails.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
        credentials: 'same-origin',
      }).catch(() => {});
    }
  }, [props.productDetails?.id, token, user?.id]);

  useEffect(() => {
    if (product && product.type === 'variable' && product.variations) {
      const matched = product.variations.find((v) => Object.entries(selectedOptions).every(([name, val]) => v.attributes && v.attributes[name] === val));
      setSelectedVariation(matched || null);
    } else {
      setSelectedVariation(null);
    }
  }, [selectedOptions, product]);

  const handleAddToCart = () => {
    if (product.type === 'variable' && !selectedVariation) { alert('Please select product options first.'); return; }
    const targetProduct = selectedVariation || product;
    if (targetProduct) { addToCart(targetProduct, qty); router.visit('/cart'); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);
    try {
      await new Promise((resolve, reject) => {
        router.post(`/products/${id}/reviews`, { rating: userRating, comment: userComment }, {
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
      <div className="min-h-screen flex flex-col bg-neutral-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-neutral-500 text-sm">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-3xl border border-neutral-100 p-10 max-w-md text-center flex flex-col gap-4">
            <p className="text-neutral-600">{error || 'Failed to load product.'}</p>
            <Link href="/" className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 transition-colors inline-flex items-center gap-2 self-center">
              <ArrowLeft size={14} /> Back to Categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentProduct = selectedVariation || product;
  const hasOptionsSelected = product.type === 'variable' ? Object.keys(selectedOptions).length === (product.attributes?.length || 0) && Object.values(selectedOptions).every(Boolean) : true;
  const isCombinationValid = product.type === 'variable' ? !!selectedVariation : true;
  const isSale = currentProduct.sale_price !== null && currentProduct.sale_price !== undefined;
  const outOfStock = currentProduct.manage_stock && currentProduct.stock_quantity <= 0;

  const buildBreadcrumbs = () => {
    const crumbs = [];
    if (product.categories?.length > 0) crumbs.push({ label: product.categories[0].name, url: `/categories/${product.categories[0].id}` });
    crumbs.push({ label: product.name });
    return crumbs;
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 min-h-[100dvh]">
        {/* Breadcrumb */}
        <nav className="hidden flex-wrap items-center gap-1.5 mb-6 text-[11px] font-bold uppercase tracking-wider text-neutral-400 sm:flex">
          <Link href="/" className="hover:text-neutral-800 transition-colors">Home</Link>
          {buildBreadcrumbs().map((crumb, i) => (
            <React.Fragment key={i}>
              <span>/</span>
              {crumb.url ? (
                <Link href={crumb.url} className="hover:text-neutral-800 transition-colors truncate max-w-[120px]">{crumb.label}</Link>
              ) : (
                <span className="text-neutral-700 truncate max-w-[160px]">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        <Link href="/" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 mb-8 transition-colors px-3 py-1.5 rounded-full hover:bg-neutral-100">
          <ArrowLeft size={13} /> Back to Catalog
        </Link>

        {/* Main product grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* Image */}
          <div className="lg:sticky lg:top-28">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center shadow-lg border border-neutral-100">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-serif italic text-neutral-300 text-9xl select-none">{product.name.charAt(0)}</span>
              )}
              {isSale && (
                <span className="absolute top-4 left-4 bg-red-50/90 backdrop-blur-sm text-red-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-100">Sale</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2 block">{product.brand?.name || 'Store Item'}</span>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-900 leading-tight mb-3">{product.name}</h1>

              {/* Stars */}
              <div className="flex items-center gap-3 mb-4">
                <StarSelector rating={Math.round(averageRating)} readonly />
                <span className="text-xs text-neutral-500">
                  {averageRating > 0 ? `${averageRating.toFixed(1)} / 5.0` : 'No reviews'} ({totalReviews} reviews)
                </span>
              </div>

              <p className="text-xs text-neutral-500">Seller: <span className="font-semibold text-neutral-800">{product.user?.brand_name || product.user?.name}</span></p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              {isSale ? (
                <>
                  <span className="text-neutral-400 text-base line-through">${parseFloat(currentProduct.regular_price).toFixed(2)}</span>
                  <span className="font-serif text-4xl font-semibold text-red-600">${parseFloat(currentProduct.sale_price).toFixed(2)}</span>
                </>
              ) : (
                <span className="font-serif text-4xl font-semibold text-neutral-900">${parseFloat(currentProduct.regular_price).toFixed(2)}</span>
              )}
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed">{product.short_description || 'No short description provided.'}</p>

            {/* Variation selectors */}
            {product.type === 'variable' && product.attributes && (
              <div className="flex flex-col gap-4 py-4 border-t border-neutral-100">
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-700">Select Product Options:</span>
                <div className="flex gap-4 flex-wrap">
                  {product.attributes.map((attr) => (
                    <div key={attr.name} className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{attr.name}</label>
                      <select
                        className="border border-neutral-200 rounded-xl py-2.5 px-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                        value={selectedOptions[attr.name] || ''}
                        onChange={(e) => setSelectedOptions((prev) => ({ ...prev, [attr.name]: e.target.value }))}
                      >
                        <option value="">-- Choose {attr.name} --</option>
                        {attr.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.type === 'variable' && hasOptionsSelected && !selectedVariation && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-4 py-3 rounded-xl">
                <AlertTriangle size={16} /> This combination is currently unavailable.
              </div>
            )}

            <div className="h-px bg-neutral-100" />

            {/* Stock status */}
            <div>
              {outOfStock || (product.type === 'variable' && hasOptionsSelected && !isCombinationValid) ? (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 px-4 py-2.5 rounded-full">
                  <AlertTriangle size={14} /> {product.type === 'variable' && hasOptionsSelected && !isCombinationValid ? 'Combination Unavailable' : 'Currently Out of Stock'}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-4 py-2.5 rounded-full">
                  <CheckCircle size={14} /> In Stock {currentProduct.manage_stock && `(${currentProduct.stock_quantity} units available)`}
                </div>
              )}
            </div>

            {/* Add to cart actions */}
            {!outOfStock && (product.type !== 'variable' || isCombinationValid) && (
              <div className="flex w-full items-center gap-2 sm:gap-3">
                {/* Qty selector */}
                <div className="inline-flex shrink-0 items-center overflow-hidden rounded-full border border-neutral-200 bg-white">
                  <button className="px-3 py-3 text-base text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 sm:px-4" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
                  <input
                    type="number"
                    className="w-10 border-x border-neutral-200 bg-transparent py-3 text-center text-sm font-semibold text-neutral-900 focus:outline-none sm:w-14"
                    value={qty}
                    onChange={(e) => { const v = parseInt(e.target.value); if (v > 0) setQty(currentProduct.manage_stock ? Math.min(currentProduct.stock_quantity, v) : v); }}
                    min="1"
                    max={currentProduct.manage_stock ? currentProduct.stock_quantity : undefined}
                  />
                  <button className="px-3 py-3 text-base text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 sm:px-4" onClick={() => setQty((q) => currentProduct.manage_stock ? Math.min(currentProduct.stock_quantity, q + 1) : q + 1)} disabled={currentProduct.manage_stock && qty >= currentProduct.stock_quantity}>+</button>
                </div>

                <button
                  className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-neutral-950 px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[180px] sm:px-5 sm:text-xs sm:tracking-widest"
                  onClick={handleAddToCart}
                  disabled={product.type === 'variable' && (!hasOptionsSelected || !isCombinationValid)}
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>

                {token && user?.role === 'buyer' && (
                  <button
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 ${isWishlisted(product.id) ? 'border-red-200 bg-red-50 text-red-500' : 'border-neutral-200 bg-white text-neutral-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50'}`}
                    onClick={() => toggleWishlist(product)}
                    disabled={loadingIds.includes(product.id)}
                    title={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart size={18} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>
            )}

            <div className="h-px bg-neutral-100" />

            {/* Specifications */}
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Specifications</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['SKU', currentProduct.sku || 'N/A'],
                  ['Weight', currentProduct.weight ? `${currentProduct.weight} kg` : 'N/A'],
                  ['Dimensions', currentProduct.length && currentProduct.width && currentProduct.height ? `${currentProduct.length} × ${currentProduct.width} × ${currentProduct.height} cm` : 'N/A'],
                  ['Tax Status', product.tax_status],
                ].map(([label, val]) => (
                  <div key={label} className="bg-neutral-100/60 rounded-xl px-4 py-3 border border-neutral-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-0.5">{label}</span>
                    <span className="text-sm font-medium text-neutral-800 capitalize">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Extended: Description + Warehouse */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-12">
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-xs p-6 sm:p-8">
            <h3 className="font-semibold text-base text-neutral-900 mb-5 pb-4 border-b border-neutral-100">Product Description</h3>
            <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{product.description || 'No detailed description available.'}</p>
          </div>

          <div className="bg-white rounded-3xl border border-neutral-100 shadow-xs p-6 sm:p-8">
            <h3 className="font-semibold text-base text-neutral-900 mb-5 pb-4 border-b border-neutral-100">Warehouse Inventory</h3>
            {product.warehouses?.length > 0 ? (
              <div className="flex flex-col gap-4">
                {product.warehouses.map((wh) => (
                  <div key={wh.id} className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm text-neutral-900">{wh.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-950 text-white px-2 py-0.5 rounded-full">{wh.code}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1"><Archive size={12} /> Shelf: <strong>{wh.pivot?.bin_location || 'Unassigned'}</strong></div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1"><Truck size={12} /> Carrier: <strong>{wh.default_carrier || 'Blue Dart'}</strong></div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 mt-2">Stock Qty: {wh.pivot?.quantity || 0}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">This product is not allocated to any warehouse inventory.</p>
            )}
          </div>
        </div>

        {/* Reviews section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-6">
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-xs p-6 sm:p-8">
            <h3 className="font-semibold text-base text-neutral-900 mb-5 pb-4 border-b border-neutral-100">Verified Customer Reviews ({totalReviews})</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-neutral-400">No customer reviews have been submitted for this product yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-neutral-100">
                {reviews.map((rev) => (
                  <div key={rev.id} className="py-5">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <strong className="text-sm text-neutral-900">{rev.user?.name}</strong>
                      <span className="text-xs text-neutral-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mb-2"><StarSelector rating={rev.rating} readonly /></div>
                    <p className="text-sm text-neutral-600 italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-neutral-100 shadow-xs p-6 sm:p-8">
            <h3 className="font-semibold text-base text-neutral-900 mb-5 pb-4 border-b border-neutral-100">
              {token && user?.role === 'buyer' ? 'Submit a Review' : 'Feedback & Review'}
            </h3>
            {token && user?.role === 'buyer' ? (
              reviewSuccess ? (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 px-4 py-3 rounded-xl">
                  <CheckCircle size={16} /> Review submitted successfully!
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-5">
                  {reviewError && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                      <AlertTriangle size={14} /> {reviewError}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Your Rating</label>
                    <StarSelector rating={userRating} onChange={setUserRating} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Review Comments</label>
                    <textarea
                      className="border border-neutral-200 rounded-2xl py-3 px-4 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all resize-y min-h-[100px]"
                      placeholder="Write your review comments here..."
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-3 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )
            ) : (
              <p className="text-sm text-neutral-500 leading-relaxed">
                Please <Link href="/login" className="text-neutral-900 underline underline-offset-2">log in</Link> as a buyer to leave verified customer feedback on items you purchase.
              </p>
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
