import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AlertTriangle, ArrowLeft, CheckCircle, Heart, ShoppingCart, Star } from 'lucide-react';
import { formatDateTime, formatProductMoney } from '../utils/localization';
const StarSelector = ({
  rating,
  onChange,
  readonly = false
}) => <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(star => <Star key={star} size={readonly ? 14 : 22} fill={star <= rating ? '#0a0a0a' : 'none'} color={star <= rating ? '#0a0a0a' : '#d4d4d4'} className={readonly ? '' : 'cursor-pointer transition hover:scale-110'} onClick={() => !readonly && onChange?.(star)} />)}
  </div>;
const ProductRecommendations = ({
  productId,
  initialRelated = [],
  pageProps
}) => {
  const [related, setRelated] = useState(initialRelated);
  useEffect(() => {
    setRelated(initialRelated);
  }, [initialRelated]);
  useEffect(() => {
    if (!productId) {
      return undefined;
    }
    const controller = new AbortController();
    fetch(`/products/${productId}/recommendations?limit=4`, {
      signal: controller.signal,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).then(response => response.ok ? response.json() : null).then(payload => {
      if (Array.isArray(payload?.data)) {
        setRelated(payload.data);
      }
    }).catch(error => {
      if (error.name !== 'AbortError') {
        setRelated(initialRelated);
      }
    });
    return () => controller.abort();
  }, [initialRelated, productId]);
  if (related.length === 0) return null;
  return <div className="mt-16 border-t-2 border-neutral-950 pt-12">
      <h3 className="text-2xl font-bold tracking-tight text-neutral-950">Customers Also Bought</h3>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
        {related.map(p => {
        const price = p.sale_price ?? p.regular_price;
        const priceLabel = p.type === 'grouped' ? 'From' : p.type === 'external' ? 'See offer' : formatProductMoney(p, parseFloat(price ?? 0), pageProps);
        return <Link href={`/products/${p.id}`} key={p.id} className="group relative block">
              <div className="aspect-[4/5] w-full overflow-hidden border-2 border-neutral-950 bg-neutral-100 group-hover:opacity-75">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover object-center" /> : <div className="flex h-full items-center justify-center text-4xl font-bold text-neutral-300">{p.name.charAt(0)}</div>}
              </div>
              <div className="mt-4 flex flex-col justify-between">
                <h3 className="text-sm font-bold text-neutral-950">{p.name}</h3>
                <p className="mt-1 text-sm font-medium text-neutral-500">{priceLabel}</p>
              </div>
            </Link>;
      })}
      </div>
    </div>;
};
const InfoPanel = ({
  title,
  children,
  className = ''
}) => <section className={`border-2 border-neutral-950 bg-white p-6 shadow-[8px_8px_0_#171717] ${className}`}>
    <h3 className="mb-6 border-b-2 border-neutral-950 pb-4 text-xl font-bold text-neutral-950">{title}</h3>
    <div className="text-neutral-700">{children}</div>
  </section>;
const DetailGrid = ({
  rows,
  className = ''
}) => <div className={`grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 ${className}`}>
    {rows.map(([label, value]) => <div key={label} className="flex flex-col justify-between border-b border-neutral-200 pb-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
        <span className="mt-1 text-sm font-medium text-neutral-950">{value}</span>
      </div>)}
  </div>;
export const ProductDetails = () => {
  const {
    props,
    url
  } = usePage();
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
  const {
    addToCart
  } = useCart();
  const {
    token,
    user
  } = useAuth();
  const {
    isWishlisted,
    toggleWishlist,
    loadingIds
  } = useWishlist();
  const reviewEligibility = props.reviewEligibility || {};
  useEffect(() => {
    const draftPreview = readDraftPreview();
    const nextProduct = props.productDetails || props.product || draftPreview?.product || null;
    setProduct(nextProduct);
    
    if (nextProduct?.type === 'variable' && nextProduct.variations?.length > 0 && nextProduct.variations[0].attributes) {
      setSelectedOptions(nextProduct.variations[0].attributes);
    } else {
      setSelectedOptions({});
    }

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
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      }).catch(() => {});
    }
  }, [isSellerPreview, props.product?.id, props.productDetails?.id, token, user?.id]);
  useEffect(() => {
    if (product?.type === 'variable' && product.variations) {
      const matched = product.variations.find(variation => Object.entries(selectedOptions).every(([name, val]) => variation.attributes?.[name] === val));
      setSelectedVariation(matched || null);
      return;
    }
    setSelectedVariation(null);
  }, [selectedOptions, product]);
  const currentProduct = selectedVariation || product;
  const imageGallery = useMemo(() => {
    if (!product) return [];
    return [product.image_url || product.featured_image, ...(Array.isArray(product.gallery_images) ? product.gallery_images : [])].filter(Boolean);
  }, [product]);
  if (loading) {
    return <div>
        <Navbar />
        <div>
          <p>Loading product details...</p>
        </div>
      </div>;
  }
  if (error || !product || !currentProduct) {
    return <div>
        <Navbar />
        <div>
          <div>
            <p>{error || 'Failed to load product.'}</p>
            <Link href="/">
              <ArrowLeft size={14} /> Back to Categories
            </Link>
          </div>
        </div>
      </div>;
  }
  const isExternalProduct = product.type === 'external';
  const isGroupedProduct = product.type === 'grouped';
  const isVariableProduct = product.type === 'variable';
  const hasOptionsSelected = isVariableProduct ? Object.keys(selectedOptions).length === (product.attributes?.length || 0) && Object.values(selectedOptions).every(Boolean) : true;
  const isCombinationValid = isVariableProduct ? !!selectedVariation : true;
  const isSale = currentProduct.sale_price !== null && currentProduct.sale_price !== undefined;
  const outOfStock = currentProduct.manage_stock && currentProduct.stock_quantity <= 0;
  const bulletPoints = Array.isArray(product.bullet_points) ? product.bullet_points.filter(item => item?.title || item?.value) : [];
  const whatsInsideBox = Array.isArray(product.whats_inside_box) ? product.whats_inside_box.filter(Boolean) : [];
  const groupedProducts = Array.isArray(product.grouped_products) ? product.grouped_products : [];
  const safetyRows = Object.entries(product.safety_compliance || {}).filter(([, value]) => value).map(([key, value]) => [key.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '), value]);
  const sizeChart = product.size_chart || null;
  const hasDisplayValue = value => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  };
  const formatDimension = (...values) => values.every(hasDisplayValue) ? `${values.map(value => typeof value === 'string' ? value.trim() : value).join(' x ')} cm` : null;
  const formatWeight = value => hasDisplayValue(value) ? `${value} kg` : null;
  const formatCondition = value => hasDisplayValue(value) ? String(value).replace(/_/g, ' ') : null;
  const specificationRows = [['Brand', product.brand?.name || product.user?.brand_name], ['Manufacturer', product.manufacturer], ['Model Number', product.model_number], ['Product Type', product.product_type], ['Type Keyword', product.product_type_keyword], ['Country of Origin', product.country_of_origin], ['Condition', formatCondition(product.condition)], ['Target Gender', product.target_gender], ['Recommended Age', product.recommended_age], ['Seller SKU', currentProduct.sku], ['Item Weight', formatWeight(currentProduct.weight_kg || currentProduct.weight)], ['Item Dimensions', formatDimension(currentProduct.length_cm || currentProduct.length, currentProduct.width_cm || currentProduct.width, currentProduct.height_cm || currentProduct.height)], ['Package Weight', formatWeight(product.package_weight_kg)], ['Package Dimensions', formatDimension(product.package_length_cm, product.package_width_cm, product.package_height_cm)]].filter(([, value]) => hasDisplayValue(value));
  const hasShortDescription = hasDisplayValue(product.short_description);
  const hasProductDescription = hasDisplayValue(product.description);
  const hasBoxContents = whatsInsideBox.length > 0;
  const hasSafetyDetails = safetyRows.length > 0;
  const hasTechnicalDetails = specificationRows.length > 0;
  const hasSizeChart = Boolean(sizeChart?.image_url || sizeChart?.notes);
  const buildBreadcrumbs = () => {
    const crumbs = [];
    if (product.categories?.length > 0) crumbs.push({
      label: product.categories[0].name,
      url: `/categories/${product.categories[0].id}`
    });
    crumbs.push({
      label: product.name
    });
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
  const handleReviewSubmit = async e => {
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
          onError: errors => reject(new Error(Object.values(errors)[0] || 'Verified customer check failed.')),
          onFinish: () => setSubmittingReview(false)
        });
      });
      setReviewSuccess(true);
      setUserComment('');
      setUserRating(5);
    } catch (err) {
      setReviewError(err.message || 'Error submitting review');
    }
  };
  return <div className="flex min-h-screen flex-col bg-neutral-50 selection:bg-neutral-950 selection:text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          <Link href="/" className="transition hover:text-neutral-950">Home</Link>
          {buildBreadcrumbs().map((crumb, index) => <React.Fragment key={`${crumb.label}-${index}`}>
              <span className="text-neutral-300">/</span>
              {crumb.url ? <Link href={crumb.url} className="transition hover:text-neutral-950">{crumb.label}</Link> : <span className="text-neutral-950">{crumb.label}</span>}
            </React.Fragment>)}
        </nav>

        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-500 transition hover:text-neutral-950">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        <section className="mb-16">
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12 xl:gap-x-16">
          {/* Image gallery */}
          <div className="flex flex-col-reverse lg:sticky lg:top-8">
            {imageGallery.length > 1 && <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                <div className="grid grid-cols-4 gap-4">
                  {imageGallery.slice(0, 8).map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(image)} className={`relative flex h-24 cursor-pointer items-center justify-center border-2 bg-white text-sm font-medium uppercase transition hover:bg-neutral-50 ${selectedImage === image ? 'border-neutral-950' : 'border-transparent'}`}>
                      <img src={image} alt={`${product.name} view ${index + 1}`} className="absolute inset-0 h-full w-full object-contain object-center p-2" />
                    </button>)}
                </div>
              </div>}
            
            <div className="aspect-[4/5] w-full border-2 border-neutral-950 bg-neutral-100 relative shadow-[10px_10px_0_#171717]">
              {selectedImage ? <img src={selectedImage} alt={product.name} className="h-full w-full object-contain object-center p-4" /> : <div className="flex h-full items-center justify-center text-6xl font-bold text-neutral-300">{product.name.charAt(0)}</div>}
              {isSale && <span className="absolute left-4 top-4 border-2 border-neutral-950 bg-rose-500 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-[4px_4px_0_#171717]">Sale</span>}
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 lg:mt-0">
            <div className="mb-6">
              <span className="inline-block border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">{product.brand?.name || 'Store Item'}</span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-5xl lg:leading-[1.1]">{product.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <StarSelector rating={Math.round(averageRating)} readonly />
                <span className="text-sm font-medium text-neutral-500">
                  {averageRating > 0 ? `${averageRating.toFixed(1)} / 5.0` : 'No reviews'} ({totalReviews} reviews)
                </span>
              </div>
              <p className="mt-3 text-sm text-neutral-500">
                Seller:{' '}
                {product.user?.id ? <Link href={`/stores/${product.user.id}`} className="font-bold text-neutral-950 underline decoration-2 underline-offset-2 transition hover:text-blue-600 hover:decoration-blue-600">
                    {product.user?.brand_name || product.user?.name}
                  </Link> : <span className="font-bold text-neutral-950">{product.user?.brand_name || product.user?.name}</span>}
              </p>
            </div>

            <div className="mb-6 flex items-end gap-4 border-y-2 border-neutral-950 py-6">
              {isSale ? <>
                  <span className="text-xl font-bold text-neutral-400 line-through decoration-rose-500/50 decoration-4">{formatProductMoney(currentProduct, parseFloat(currentProduct.regular_price), props)}</span>
                  <span className="text-4xl font-extrabold text-neutral-950">{formatProductMoney(currentProduct, parseFloat(currentProduct.sale_price), props)}</span>
                </> : <span className="text-4xl font-extrabold text-neutral-950">{formatProductMoney(currentProduct, parseFloat(currentProduct.regular_price), props)}</span>}
            </div>

            {hasShortDescription && <p className="mb-6 text-base leading-relaxed text-neutral-700">{product.short_description}</p>}

            {bulletPoints.length > 0 && <ul className="mb-8 space-y-3">
                {bulletPoints.map((bullet, index) => <li key={`${bullet.title}-${index}`} className="flex items-start">
                    <span className="mr-3 mt-2 h-2 w-2 shrink-0 border-2 border-neutral-950 bg-white" />
                    <span className="text-base text-neutral-700">{bullet.title && <strong className="font-bold text-neutral-950">{bullet.title}: </strong>}{bullet.value}</span>
                  </li>)}
              </ul>}

            {isVariableProduct && product.attributes && <div className="mb-8 space-y-5 border-2 border-neutral-950 bg-white p-6 shadow-[6px_6px_0_#171717]">
                <span className="block text-sm font-bold uppercase tracking-widest text-neutral-950">Select Product Options</span>
                <div className="grid gap-4 sm:grid-cols-2">
                  {product.attributes.map(attr => <div key={attr.name}>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{attr.name}</label>
                      <select className="h-12 w-full appearance-none rounded-none border-2 border-neutral-950 bg-neutral-50 px-4 text-sm font-bold text-neutral-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20" value={selectedOptions[attr.name] || ''} onChange={e => setSelectedOptions(prev => ({
                    ...prev,
                    [attr.name]: e.target.value
                  }))}>
                        <option value="">Choose {attr.name}</option>
                        {attr.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>)}
                </div>
              </div>}

            {isVariableProduct && hasOptionsSelected && !selectedVariation && <div className="mb-6 flex items-center gap-2 border-l-4 border-rose-500 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                <AlertTriangle size={18} /> This combination is currently unavailable.
              </div>}

            {!isExternalProduct && (outOfStock || isVariableProduct && hasOptionsSelected && !isCombinationValid) ? <div className="mb-6 flex items-center gap-2 border-l-4 border-rose-500 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                <AlertTriangle size={18} /> {isVariableProduct && hasOptionsSelected && !isCombinationValid ? 'Combination Unavailable' : 'Currently Out of Stock'}
              </div> : !isExternalProduct && <div className="mb-6 flex items-center gap-2 border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                <CheckCircle size={18} /> In Stock {currentProduct.manage_stock && <span className="font-medium text-emerald-800">({currentProduct.stock_quantity} units available)</span>}
              </div>}

            {isSellerPreview ? <div className="mb-8 border-2 border-dashed border-neutral-400 bg-neutral-100 p-6 text-center text-sm font-bold uppercase tracking-widest text-neutral-600">
                Preview mode: Purchasing actions are disabled.
              </div> : isExternalProduct ? <div className="mb-8">
                <a href={product.external_url} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center border-2 border-neutral-950 bg-neutral-950 px-8 py-4 text-base font-bold uppercase tracking-wider text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-4 focus:ring-neutral-950/20">
                  {product.external_button_text || 'Buy on partner site'}
                </a>
              </div> : isGroupedProduct ? <div className="mb-8 border-2 border-neutral-950 bg-white p-6 shadow-[6px_6px_0_#171717]">
                {groupedProducts.length > 0 ? <div className="space-y-4">
                    {groupedProducts.map(linkedProduct => {
                  const linkedPrice = linkedProduct.sale_price ?? linkedProduct.regular_price;
                  return <Link key={linkedProduct.id} href={`/products/${linkedProduct.id}`} className="group flex items-center justify-between border-b-2 border-neutral-100 pb-4 last:border-0 last:pb-0">
                          <div className="min-w-0 flex-1">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                              {linkedProduct.brand?.name || linkedProduct.user?.brand_name || linkedProduct.user?.name}
                            </span>
                            <strong className="mt-1 block truncate text-base font-bold text-neutral-950 transition group-hover:text-blue-600">{linkedProduct.name}</strong>
                          </div>
                          <span className="ml-4 shrink-0 text-lg font-extrabold text-neutral-950">{formatProductMoney(linkedProduct, parseFloat(linkedPrice ?? 0), props)}</span>
                        </Link>;
                })}
                  </div> : <div className="text-sm font-medium text-neutral-500">
                    Linked products will appear here after the seller adds them to this grouped listing.
                  </div>}
              </div> : !outOfStock && (!isVariableProduct || isCombinationValid) && <div className="mb-8 flex flex-wrap gap-4">
                <div className="flex h-14 w-36 items-center border-2 border-neutral-950 bg-white shadow-[4px_4px_0_#171717]">
                  <button type="button" className="flex h-full w-12 items-center justify-center text-xl font-bold text-neutral-950 hover:bg-neutral-100 disabled:opacity-50" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>-</button>
                  <input type="number" className="h-full w-full border-x-2 border-neutral-950 bg-transparent text-center text-lg font-bold text-neutral-950 outline-none" value={qty} onChange={e => {
                  const value = parseInt(e.target.value, 10);
                  if (value > 0) setQty(currentProduct.manage_stock ? Math.min(currentProduct.stock_quantity, value) : value);
                }} min="1" max={currentProduct.manage_stock ? currentProduct.stock_quantity : undefined} />
                  <button type="button" className="flex h-full w-12 items-center justify-center text-xl font-bold text-neutral-950 hover:bg-neutral-100 disabled:opacity-50" onClick={() => setQty(q => currentProduct.manage_stock ? Math.min(currentProduct.stock_quantity, q + 1) : q + 1)} disabled={currentProduct.manage_stock && qty >= currentProduct.stock_quantity}>+</button>
                </div>
                <button type="button" className="flex h-14 flex-1 items-center justify-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-8 text-sm font-bold uppercase tracking-widest text-white shadow-[4px_4px_0_#171717] transition hover:translate-y-[2px] hover:shadow-[2px_2px_0_#171717] disabled:cursor-not-allowed disabled:border-neutral-400 disabled:bg-neutral-400 disabled:shadow-none" onClick={handleAddToCart} disabled={isVariableProduct && (!hasOptionsSelected || !isCombinationValid)}>
                  <ShoppingCart size={18} /> Add to Cart
                </button>
                {token && user?.role === 'buyer' && <button type="button" className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-neutral-950 bg-white text-rose-600 shadow-[4px_4px_0_#171717] transition hover:translate-y-[2px] hover:bg-rose-50 hover:shadow-[2px_2px_0_#171717] disabled:opacity-50" onClick={() => toggleWishlist(product)} disabled={loadingIds.includes(product.id)} title={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}>
                    <Heart size={20} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} strokeWidth={isWishlisted(product.id) ? 1 : 2} />
                  </button>}
              </div>}

            {hasTechnicalDetails && <div className="mt-10 border-t-2 border-neutral-950 pt-8">
              <h5 className="mb-6 text-xl font-bold text-neutral-950">Quick Specs</h5>
              <DetailGrid rows={specificationRows.slice(0, 6)} />
              </div>}
          </div>
          </div>
        </section>

        {(hasProductDescription || hasBoxContents) && <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
            {hasProductDescription && <InfoPanel title="Product Description" className="h-full">
                <div className="prose prose-sm max-w-none text-neutral-700 sm:prose-base prose-p:leading-relaxed prose-strong:text-neutral-950">
                  {product.description.split('\n').map((paragraph, i) => paragraph.trim() ? <p key={i} className="mb-4">{paragraph}</p> : null)}
                </div>
              </InfoPanel>}

            {hasBoxContents && <InfoPanel title="What's In The Box" className="h-full">
              <ul className="grid gap-3 sm:grid-cols-2">
                {whatsInsideBox.map((item, index) => <li key={`${item}-${index}`} className="flex items-center gap-3 border-2 border-neutral-950 bg-neutral-50 p-4">
                    <CheckCircle size={18} className="text-neutral-950 shrink-0" />
                    <span className="text-sm font-bold text-neutral-950">{item}</span>
                  </li>)}
              </ul>
              </InfoPanel>}
          </div>}

        {(hasTechnicalDetails || hasSafetyDetails) && <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
            {hasTechnicalDetails && <InfoPanel title="Detailed Specifications" className="h-full">
                <DetailGrid rows={specificationRows} />
              </InfoPanel>}

            {hasSafetyDetails && <InfoPanel title="Safety & Compliance" className="h-full">
                <div className="space-y-4">
                  {safetyRows.map(([label, val]) => <div key={label} className="border-l-4 border-neutral-950 bg-neutral-50 p-4">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</span>
                      <span className="mt-1 block text-sm font-bold text-neutral-950">{val}</span>
                    </div>)}
                </div>
              </InfoPanel>}
          </div>}

        {hasSizeChart && <div className="mb-16">
            <InfoPanel title="Size Chart">
              {sizeChart.image_url && <div className="border-2 border-neutral-950 p-2">
                  <img src={sizeChart.image_url} alt={`${product.name} size chart`} className="w-full object-contain" />
                </div>}
              {sizeChart.notes && <p className="mt-4 text-sm font-medium text-neutral-700">{sizeChart.notes}</p>}
            </InfoPanel>
          </div>}

        <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <InfoPanel title={`Verified Customer Reviews (${totalReviews})`} className="h-full">
            {reviews.length === 0 ? <p className="text-sm font-medium italic text-neutral-500">No customer reviews have been submitted for this product yet.</p> : <div className="divide-y-2 divide-neutral-950">
                {reviews.map(rev => <div key={rev.id} className="py-8 first:pt-0 last:pb-0">
                    <div className="mb-3 flex items-center justify-between">
                      <strong className="text-sm font-bold text-neutral-950">{rev.user?.name}</strong>
                      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{formatDateTime(rev.created_at, {
                    includeTime: false
                  }, props)}</span>
                    </div>
                    <div className="mb-4"><StarSelector rating={rev.rating} readonly /></div>
                    <p className="text-base font-medium italic text-neutral-700">"{rev.comment}"</p>
                  </div>)}
              </div>}
          </InfoPanel>

          <InfoPanel title={isSellerPreview ? 'Feedback & Review' : token && user?.role === 'buyer' ? 'Submit a Review' : 'Feedback & Review'} className="h-full bg-neutral-100 border-dashed">
            {isSellerPreview ? <p className="text-sm font-medium text-neutral-600">
                Reviews are read-only in seller preview.
              </p> : token && user?.role === 'buyer' && reviewEligibility.can_review ? reviewSuccess ? <div className="flex items-center gap-3 border-2 border-emerald-600 bg-emerald-50 p-6 text-sm font-bold text-emerald-800">
                  <CheckCircle size={20} /> Review submitted successfully!
                </div> : <form onSubmit={handleReviewSubmit} className="space-y-6">
                  {reviewError && <div className="flex items-center gap-3 border-2 border-rose-600 bg-rose-50 p-6 text-sm font-bold text-rose-800">
                      <AlertTriangle size={20} /> {reviewError}
                    </div>}
                  <div>
                    <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-neutral-950">Your Rating</label>
                    <StarSelector rating={userRating} onChange={setUserRating} />
                  </div>
                  <div>
                    <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-neutral-950">Review Comments</label>
                    <textarea className="h-32 w-full resize-none border-2 border-neutral-950 bg-white p-4 text-sm font-medium text-neutral-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20" placeholder="Write your review comments here..." value={userComment} onChange={e => setUserComment(e.target.value)} required />
                  </div>
                  <button type="submit" className="flex w-full items-center justify-center border-2 border-neutral-950 bg-neutral-950 py-4 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-neutral-800 disabled:opacity-50" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form> : token && user?.role === 'buyer' ? <p className="text-sm font-medium text-neutral-600">
                {reviewEligibility.has_reviewed ? 'You have already reviewed this product.' : 'Only buyers who have ordered this product can leave a review.'}
              </p> : <p className="text-sm font-medium text-neutral-600">
                Please <Link href="/login" className="font-bold text-neutral-950 underline decoration-2 underline-offset-2 hover:text-blue-600">log in</Link> as a buyer to leave verified customer feedback on items you purchase.
              </p>}
          </InfoPanel>
        </div>

        {!isSellerPreview && <ProductRecommendations productId={product.id} initialRelated={props.relatedProducts || []} pageProps={props} />}
      </main>

      <Footer />
    </div>;
};
export default ProductDetails;
