import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AlertTriangle, ArrowLeft, CheckCircle, Heart, ShoppingCart, Star } from 'lucide-react';

const StarSelector = ({ rating, onChange, readonly = false }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={readonly ? 14 : 22}
        className={`${readonly ? '' : 'cursor-pointer'} transition-colors`}
        fill={star <= rating ? '#111' : 'none'}
        color={star <= rating ? '#111' : '#d4d4d4'}
        onClick={() => !readonly && onChange?.(star)}
      />
    ))}
  </div>
);

const ProductRecommendations = ({ productId, categoryId, initialRelated = [] }) => {
  const [related, setRelated] = useState(initialRelated);

  useEffect(() => {
    setRelated(initialRelated);
  }, [categoryId, initialRelated, productId]);

  if (related.length === 0) return null;

  return (
    <div className="mt-14">
      <h3 className="font-serif text-lg font-semibold text-neutral-900 mb-6">Related Products</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {related.map((p) => {
          const price = p.sale_price ?? p.regular_price;
          const priceLabel = p.type === 'grouped' ? 'From' : p.type === 'external' ? 'See offer' : `$${parseFloat(price ?? 0).toFixed(2)}`;
          return (
            <Link href={`/products/${p.id}`} key={p.id} className="group flex flex-col gap-3 rounded-[26px] bg-white/76 p-4 shadow-[0_18px_38px_rgba(17,24,39,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_rgba(17,24,39,0.1)]">
              <div className="aspect-square rounded-[22px] bg-neutral-100 flex items-center justify-center text-2xl font-semibold text-neutral-400 overflow-hidden">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover rounded-xl" /> : p.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-2">{p.name}</p>
                <span className="text-xs font-semibold text-neutral-900 mt-1 block">{priceLabel}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const InfoPanel = ({ title, children, className = '' }) => (
  <section className={`rounded-[30px] bg-white/78 px-6 py-6 shadow-[0_18px_42px_rgba(17,24,39,0.06)] backdrop-blur-sm sm:px-8 sm:py-8 ${className}`}>
    <h3 className="font-serif text-xl font-semibold text-neutral-900 mb-5">{title}</h3>
    {children}
  </section>
);

const DetailGrid = ({ rows, className = '' }) => (
  <div className={`grid grid-cols-1 gap-x-8 sm:grid-cols-2 ${className}`}>
    {rows.map(([label, value]) => (
      <div key={label} className="border-b border-neutral-200/70 py-3">
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">{label}</span>
        <span className="mt-1.5 block text-sm font-medium leading-6 text-neutral-900">{value}</span>
      </div>
    ))}
  </div>
);

export const ProductDetails = () => {
  const { props, url } = usePage();
  const pageUrl = new URL(url || window.location.href, window.location.origin);
  const id = pageUrl.pathname.split('/').filter(Boolean).pop();
  const isSellerPreview = Boolean(props.sellerPreview);
  const draftPreviewKey = props.previewDraftKey || pageUrl.searchParams.get('key');
  const readDraftPreview = () => {
    if (!isSellerPreview || !draftPreviewKey || typeof window === 'undefined') {
      return null;
    }

    try {
      const rawDraft = localStorage.getItem(draftPreviewKey);
      return rawDraft ? JSON.parse(rawDraft) : null;
    } catch (error) {
      return null;
    }
  };
  const initialDraftPreview = readDraftPreview();
  const initialProduct = props.productDetails || props.product || initialDraftPreview?.product || null;
  const [product, setProduct] = useState(initialProduct);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedImage, setSelectedImage] = useState(initialProduct?.image_url || initialProduct?.featured_image || '');
  const [reviews, setReviews] = useState(props.productReviews || props.reviews || initialDraftPreview?.productReviews || []);
  const [averageRating, setAverageRating] = useState(props.averageRating || initialDraftPreview?.averageRating || 0);
  const [totalReviews, setTotalReviews] = useState(props.totalReviews || initialDraftPreview?.totalReviews || 0);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const { addToCart } = useCart();
  const { token, user } = useAuth();
  const { isWishlisted, toggleWishlist, loadingIds } = useWishlist();
  const reviewEligibility = props.reviewEligibility || {};

  useEffect(() => {
    const draftPreview = readDraftPreview();
    const nextProduct = props.productDetails || props.product || draftPreview?.product || null;
    setProduct(nextProduct);
    setSelectedImage(nextProduct?.image_url || nextProduct?.featured_image || nextProduct?.gallery_images?.[0] || '');
    setReviews(props.productReviews || props.reviews || draftPreview?.productReviews || []);
    setAverageRating(props.averageRating || draftPreview?.averageRating || 0);
    setTotalReviews(props.totalReviews || draftPreview?.totalReviews || 0);
    setLoading(false);
    setError(nextProduct ? '' : 'Product not found');
  }, [draftPreviewKey, isSellerPreview, props.averageRating, props.product, props.productDetails, props.productReviews, props.reviews, props.totalReviews]);

  useEffect(() => {
    const viewedProduct = props.productDetails || props.product;
    if (!isSellerPreview && viewedProduct && token && user?.role === 'buyer') {
      fetch(`/recently-viewed/${viewedProduct.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'same-origin',
      }).catch(() => {});
    }
  }, [isSellerPreview, props.product?.id, props.productDetails?.id, token, user?.id]);

  useEffect(() => {
    if (product?.type === 'variable' && product.variations) {
      const matched = product.variations.find((variation) => (
        Object.entries(selectedOptions).every(([name, val]) => variation.attributes?.[name] === val)
      ));
      setSelectedVariation(matched || null);
      return;
    }

    setSelectedVariation(null);
  }, [selectedOptions, product]);

  const currentProduct = selectedVariation || product;

  const imageGallery = useMemo(() => {
    if (!product) return [];
    return [
      product.image_url || product.featured_image,
      ...(Array.isArray(product.gallery_images) ? product.gallery_images : []),
    ].filter(Boolean);
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#f8f6f1_0%,#fbfaf7_34%,#ffffff_100%)]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-neutral-500 text-sm">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product || !currentProduct) {
    return (
      <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#f8f6f1_0%,#fbfaf7_34%,#ffffff_100%)]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md rounded-[30px] bg-white/82 p-10 text-center shadow-[0_24px_60px_rgba(17,24,39,0.08)] flex flex-col gap-4">
            <p className="text-neutral-600">{error || 'Failed to load product.'}</p>
            <Link href="/" className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 transition-colors inline-flex items-center gap-2 self-center">
              <ArrowLeft size={14} /> Back to Categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExternalProduct = product.type === 'external';
  const isGroupedProduct = product.type === 'grouped';
  const isVariableProduct = product.type === 'variable';
  const hasOptionsSelected = isVariableProduct
    ? Object.keys(selectedOptions).length === (product.attributes?.length || 0) && Object.values(selectedOptions).every(Boolean)
    : true;
  const isCombinationValid = isVariableProduct ? !!selectedVariation : true;
  const isSale = currentProduct.sale_price !== null && currentProduct.sale_price !== undefined;
  const outOfStock = currentProduct.manage_stock && currentProduct.stock_quantity <= 0;
  const bulletPoints = Array.isArray(product.bullet_points) ? product.bullet_points.filter((item) => item?.title || item?.value) : [];
  const whatsInsideBox = Array.isArray(product.whats_inside_box) ? product.whats_inside_box.filter(Boolean) : [];
  const groupedProducts = Array.isArray(product.grouped_products) ? product.grouped_products : [];
  const safetyRows = Object.entries(product.safety_compliance || {})
    .filter(([, value]) => value)
    .map(([key, value]) => [key.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '), value]);
  const sizeChart = product.size_chart || null;
  const hasDisplayValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  };
  const formatDimension = (...values) => (
    values.every(hasDisplayValue)
      ? `${values.map((value) => typeof value === 'string' ? value.trim() : value).join(' x ')} cm`
      : null
  );
  const formatWeight = (value) => (hasDisplayValue(value) ? `${value} kg` : null);
  const formatCondition = (value) => (hasDisplayValue(value) ? String(value).replace(/_/g, ' ') : null);
  const specificationRows = [
    ['Brand', product.brand?.name || product.user?.brand_name],
    ['Manufacturer', product.manufacturer],
    ['Model Number', product.model_number],
    ['Product Type', product.product_type],
    ['Type Keyword', product.product_type_keyword],
    ['Country of Origin', product.country_of_origin],
    ['Condition', formatCondition(product.condition)],
    ['Target Gender', product.target_gender],
    ['Recommended Age', product.recommended_age],
    ['Seller SKU', currentProduct.sku],
    ['Item Weight', formatWeight(currentProduct.weight_kg || currentProduct.weight)],
    ['Item Dimensions', formatDimension(currentProduct.length_cm || currentProduct.length, currentProduct.width_cm || currentProduct.width, currentProduct.height_cm || currentProduct.height)],
    ['Package Weight', formatWeight(product.package_weight_kg)],
    ['Package Dimensions', formatDimension(product.package_length_cm, product.package_width_cm, product.package_height_cm)],
  ].filter(([, value]) => hasDisplayValue(value));
  const hasShortDescription = hasDisplayValue(product.short_description);
  const hasProductDescription = hasDisplayValue(product.description);
  const hasBoxContents = whatsInsideBox.length > 0;
  const hasSafetyDetails = safetyRows.length > 0;
  const hasTechnicalDetails = specificationRows.length > 0;
  const hasSizeChart = Boolean(sizeChart?.image_url || sizeChart?.notes);

  const buildBreadcrumbs = () => {
    const crumbs = [];
    if (product.categories?.length > 0) crumbs.push({ label: product.categories[0].name, url: `/categories/${product.categories[0].id}` });
    crumbs.push({ label: product.name });
    return crumbs;
  };

  const handleAddToCart = () => {
    if (isVariableProduct && !selectedVariation) {
      alert('Please select product options first.');
      return;
    }

    if (isExternalProduct || isGroupedProduct) {
      return;
    }

    addToCart(currentProduct, qty);
    router.visit('/cart');
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

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#f8f6f1_0%,#fbfaf7_34%,#ffffff_100%)]">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 min-h-[100dvh]">
        <nav className="hidden flex-wrap items-center gap-1.5 mb-6 text-[11px] font-bold uppercase tracking-wider text-neutral-400 sm:flex">
          <Link href="/" className="hover:text-neutral-800 transition-colors">Home</Link>
          {buildBreadcrumbs().map((crumb, index) => (
            <React.Fragment key={`${crumb.label}-${index}`}>
              <span>/</span>
              {crumb.url ? (
                <Link href={crumb.url} className="hover:text-neutral-800 transition-colors truncate max-w-[120px]">{crumb.label}</Link>
              ) : (
                <span className="text-neutral-700 truncate max-w-[160px]">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        <Link href="/" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-900 mb-8 transition-colors">
          <ArrowLeft size={13} /> Back to Catalog
        </Link>

        <section className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(246,241,233,0.82))] px-5 py-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(236,225,209,0.55),transparent_30%)]" />
          <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)] gap-8 lg:gap-14 items-start">
          <div className="lg:sticky lg:top-28">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[30px] bg-[linear-gradient(145deg,#f5f2ea,#ece8de)] flex items-center justify-center shadow-[0_24px_50px_rgba(17,24,39,0.12)]">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-semibold text-neutral-300 text-5xl sm:text-6xl select-none">{product.name.charAt(0)}</span>
              )}
              {isSale && (
                <span className="absolute top-4 left-4 rounded-full bg-white/88 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-700 shadow-sm backdrop-blur-sm">Sale</span>
              )}
            </div>
            {imageGallery.length > 1 && (
              <div className="mt-5 grid grid-cols-5 gap-3">
                {imageGallery.slice(0, 8).map((image, index) => (
                  <button key={`${image}-${index}`} type="button" className={`aspect-square overflow-hidden rounded-[18px] bg-white/88 shadow-[0_12px_24px_rgba(17,24,39,0.06)] transition-all ${selectedImage === image ? 'ring-2 ring-neutral-900/80 ring-offset-2 ring-offset-[#f6f2ea]' : 'opacity-80 hover:opacity-100'}`} onClick={() => setSelectedImage(image)}>
                    <img src={image} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-7">
            <div className="max-w-xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700 mb-3 block">{product.brand?.name || 'Store Item'}</span>
              <h1 className="font-serif text-2xl sm:text-4xl font-semibold text-neutral-900 leading-tight mb-4">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <StarSelector rating={Math.round(averageRating)} readonly />
                <span className="text-xs text-neutral-500">
                  {averageRating > 0 ? `${averageRating.toFixed(1)} / 5.0` : 'No reviews'} ({totalReviews} reviews)
                </span>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Seller: <span className="font-semibold text-neutral-700">{product.user?.brand_name || product.user?.name}</span></p>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              {isSale ? (
                <>
                  <span className="text-neutral-400 text-lg line-through">${parseFloat(currentProduct.regular_price).toFixed(2)}</span>
                  <span className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-900">${parseFloat(currentProduct.sale_price).toFixed(2)}</span>
                </>
              ) : (
                <span className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-900">${parseFloat(currentProduct.regular_price).toFixed(2)}</span>
              )}
            </div>

            {hasShortDescription && (
              <p className="max-w-xl text-[15px] leading-7 text-neutral-600">{product.short_description}</p>
            )}

            {bulletPoints.length > 0 && (
              <ul className="grid gap-3 max-w-2xl">
                {bulletPoints.map((bullet, index) => (
                  <li key={`${bullet.title}-${index}`} className="flex gap-3 text-sm leading-6 text-neutral-700">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
                    <span>{bullet.title && <strong className="text-neutral-900">{bullet.title}: </strong>}{bullet.value}</span>
                  </li>
                ))}
              </ul>
            )}

            {isVariableProduct && product.attributes && (
              <div className="flex flex-col gap-4 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">Select Product Options</span>
                <div className="flex gap-4 flex-wrap">
                  {product.attributes.map((attr) => (
                    <div key={attr.name} className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">{attr.name}</label>
                      <select className="input-field !mb-0 !rounded-[20px] !bg-white/88 !shadow-[0_12px_24px_rgba(17,24,39,0.06)]" value={selectedOptions[attr.name] || ''} onChange={(e) => setSelectedOptions((prev) => ({ ...prev, [attr.name]: e.target.value }))}>
                        <option value="">Choose {attr.name}</option>
                        {attr.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isVariableProduct && hasOptionsSelected && !selectedVariation && (
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700">
                <AlertTriangle size={16} /> This combination is currently unavailable.
              </div>
            )}

            {!isExternalProduct && (outOfStock || (isVariableProduct && hasOptionsSelected && !isCombinationValid)) ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
                <AlertTriangle size={14} /> {isVariableProduct && hasOptionsSelected && !isCombinationValid ? 'Combination Unavailable' : 'Currently Out of Stock'}
              </div>
            ) : !isExternalProduct && (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                <CheckCircle size={14} /> In Stock {currentProduct.manage_stock && `(${currentProduct.stock_quantity} units available)`}
              </div>
            )}

            {isSellerPreview ? (
              <div className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white/80 px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 shadow-[0_12px_24px_rgba(17,24,39,0.06)] sm:w-fit">
                Preview mode
              </div>
            ) : isExternalProduct ? (
              <div className="flex w-full items-center gap-3 pt-1">
                <a
                  href={product.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_18px_28px_rgba(17,24,39,0.18)] transition-all hover:-translate-y-0.5 hover:bg-neutral-900 sm:text-xs sm:tracking-widest"
                >
                  {product.external_button_text || 'Buy on partner site'}
                </a>
              </div>
            ) : isGroupedProduct ? (
              <div className="flex flex-col gap-4">
                {groupedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {groupedProducts.map((linkedProduct) => {
                      const linkedPrice = linkedProduct.sale_price ?? linkedProduct.regular_price;
                      return (
                        <Link key={linkedProduct.id} href={`/products/${linkedProduct.id}`} className="rounded-[24px] bg-white/85 px-4 py-4 shadow-[0_12px_24px_rgba(17,24,39,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(17,24,39,0.1)]">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 mb-2">
                            {linkedProduct.brand?.name || linkedProduct.user?.brand_name || linkedProduct.user?.name}
                          </span>
                          <strong className="block text-sm text-neutral-900 mb-1">{linkedProduct.name}</strong>
                          <span className="text-sm font-semibold text-neutral-900">${parseFloat(linkedPrice ?? 0).toFixed(2)}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[24px] bg-white/82 px-4 py-4 text-sm text-neutral-500 shadow-[0_12px_24px_rgba(17,24,39,0.06)]">
                    Linked products will appear here after the seller adds them to this grouped listing.
                  </div>
                )}
              </div>
            ) : !outOfStock && (!isVariableProduct || isCombinationValid) && (
              <div className="flex w-full items-center gap-3 sm:gap-4 pt-1">
                <div className="inline-flex shrink-0 items-center overflow-hidden rounded-full bg-white/88 shadow-[0_12px_24px_rgba(17,24,39,0.07)]">
                  <button className="px-3 py-3 text-base text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 sm:px-4" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>-</button>
                  <input type="number" className="w-10 bg-transparent py-3 text-center text-sm font-semibold text-neutral-900 focus:outline-none sm:w-14" value={qty} onChange={(e) => { const value = parseInt(e.target.value, 10); if (value > 0) setQty(currentProduct.manage_stock ? Math.min(currentProduct.stock_quantity, value) : value); }} min="1" max={currentProduct.manage_stock ? currentProduct.stock_quantity : undefined} />
                  <button className="px-3 py-3 text-base text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 sm:px-4" onClick={() => setQty((q) => (currentProduct.manage_stock ? Math.min(currentProduct.stock_quantity, q + 1) : q + 1))} disabled={currentProduct.manage_stock && qty >= currentProduct.stock_quantity}>+</button>
                </div>
                <button className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-neutral-950 px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_18px_28px_rgba(17,24,39,0.18)] transition-all hover:-translate-y-0.5 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[180px] sm:px-5 sm:text-xs sm:tracking-widest" onClick={handleAddToCart} disabled={isVariableProduct && (!hasOptionsSelected || !isCombinationValid)}>
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                {token && user?.role === 'buyer' && (
                  <button className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all hover:-translate-y-0.5 ${isWishlisted(product.id) ? 'bg-red-50 text-red-500 shadow-[0_10px_20px_rgba(239,68,68,0.12)]' : 'bg-white/88 text-neutral-500 shadow-[0_10px_20px_rgba(17,24,39,0.08)] hover:text-red-500 hover:bg-red-50'}`} onClick={() => toggleWishlist(product)} disabled={loadingIds.includes(product.id)} title={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}>
                    <Heart size={18} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>
            )}

            {hasTechnicalDetails && (
              <div className="pt-3">
              <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">Product Facts</h5>
              <DetailGrid rows={specificationRows.slice(0, 8)} className="gap-y-0" />
              </div>
            )}
          </div>
          </div>
        </section>

        {(hasProductDescription || hasBoxContents) && (
          <div className={`grid grid-cols-1 gap-6 mt-12 ${hasProductDescription && hasBoxContents ? 'lg:grid-cols-[1fr_360px]' : ''}`}>
            {hasProductDescription && (
              <InfoPanel title="Product Description">
                <p className="max-w-3xl text-[15px] leading-8 text-neutral-600 whitespace-pre-line">{product.description}</p>
              </InfoPanel>
            )}

            {hasBoxContents && (
              <InfoPanel title="What's In The Box">
              <ul className="flex flex-col gap-3 text-sm leading-7 text-neutral-600">
                {whatsInsideBox.map((item, index) => <li key={`${item}-${index}`}>- {item}</li>)}
              </ul>
              </InfoPanel>
            )}
          </div>
        )}

        {(hasTechnicalDetails || hasSafetyDetails) && (
          <div className={`grid grid-cols-1 gap-6 mt-6 ${hasTechnicalDetails && hasSafetyDetails ? 'lg:grid-cols-[1fr_360px]' : ''}`}>
            {hasTechnicalDetails && (
              <InfoPanel title="Product Details">
                <DetailGrid rows={specificationRows} />
              </InfoPanel>
            )}

            {hasSafetyDetails && (
              <InfoPanel title="Safety & Compliance">
                <div className="flex flex-col gap-4">
                  {safetyRows.map(([label, val]) => (
                    <div key={label} className="border-b border-neutral-200/70 pb-4 last:border-b-0 last:pb-0">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">{label}</span>
                      <span className="mt-1.5 block text-sm leading-7 text-neutral-700">{val}</span>
                    </div>
                  ))}
                </div>
              </InfoPanel>
            )}
          </div>
        )}

        {hasSizeChart && (
          <div className="mt-6">
            <InfoPanel title="Size Chart">
              {sizeChart.image_url && <img src={sizeChart.image_url} alt={`${product.name} size chart`} className="mb-5 w-full rounded-[24px] shadow-[0_18px_36px_rgba(17,24,39,0.08)]" />}
              {sizeChart.notes && <p className="text-[15px] text-neutral-600 leading-8 whitespace-pre-line">{sizeChart.notes}</p>}
            </InfoPanel>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-6">
          <InfoPanel title={`Verified Customer Reviews (${totalReviews})`}>
            {reviews.length === 0 ? (
              <p className="text-sm leading-7 text-neutral-400">No customer reviews have been submitted for this product yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-neutral-100">
                {reviews.map((rev) => (
                  <div key={rev.id} className="py-5">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <strong className="text-sm text-neutral-900">{rev.user?.name}</strong>
                      <span className="text-xs text-neutral-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mb-2"><StarSelector rating={rev.rating} readonly /></div>
                    <p className="text-sm leading-7 text-neutral-600 italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </InfoPanel>

          <InfoPanel title={isSellerPreview ? 'Feedback & Review' : token && user?.role === 'buyer' ? 'Submit a Review' : 'Feedback & Review'}>
            {isSellerPreview ? (
              <p className="text-sm text-neutral-500 leading-relaxed">
                Reviews are read-only in seller preview.
              </p>
            ) : token && user?.role === 'buyer' && reviewEligibility.can_review ? (
              reviewSuccess ? (
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                  <CheckCircle size={16} /> Review submitted successfully!
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-5">
                  {reviewError && (
                    <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                      <AlertTriangle size={14} /> {reviewError}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Your Rating</label>
                    <StarSelector rating={userRating} onChange={setUserRating} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Review Comments</label>
                    <textarea className="input-field !mb-0 !min-h-[120px] !rounded-[20px] !bg-[#fcfbf8] resize-y" placeholder="Write your review comments here..." value={userComment} onChange={(e) => setUserComment(e.target.value)} required />
                  </div>
                  <button type="submit" disabled={submittingReview} className="w-full rounded-full bg-neutral-950 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-[0_18px_28px_rgba(17,24,39,0.18)] transition-colors hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )
            ) : token && user?.role === 'buyer' ? (
              <p className="text-sm text-neutral-500 leading-relaxed">
                {reviewEligibility.has_reviewed
                  ? 'You have already reviewed this product.'
                  : 'Only buyers who have ordered this product can leave a review.'}
              </p>
            ) : (
              <p className="text-sm text-neutral-500 leading-relaxed">
                Please <Link href="/login" className="text-neutral-900 underline underline-offset-2">log in</Link> as a buyer to leave verified customer feedback on items you purchase.
              </p>
            )}
          </InfoPanel>
        </div>

        {!isSellerPreview && (
          <ProductRecommendations productId={product.id} categoryId={product.categories?.[0]?.id} initialRelated={props.relatedProducts || []} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
