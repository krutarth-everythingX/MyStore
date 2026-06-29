import React, { useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, BriefcaseBusiness, ChevronLeft, ChevronRight, Edit, Eye, Globe, Image as ImageIcon, Layers, Package2, Ruler, ScrollText, Settings2, ShieldCheck, ShoppingBag, Tag, Truck, UserCircle2, Warehouse, X } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { SellerCard, SellerModalBackdrop, SellerModalCard, SellerPageShell, SellerPill } from '../components/seller-workspace';
import { getUserLocalization } from '../utils/localization';

const TAB_OPTIONS = [{
  id: 'overview',
  label: 'Overview'
}, {
  id: 'operations',
  label: 'Operations'
}, {
  id: 'catalog',
  label: 'Catalog & Channels'
}, {
  id: 'trade',
  label: 'Trade & Compliance'
}];

const normalizeList = value => Array.isArray(value) ? value.map(item => String(item || '').trim()).filter(Boolean) : [];
const INDIA_COUNTRY = 'india';
const hasValue = value => {
  if (Array.isArray(value)) return value.length > 0;
  if (value === 0) return true;
  if (value === false) return true;
  return String(value ?? '').trim() !== '';
};
const fallbackValue = value => hasValue(value) ? value : 'N/A';
const formatNumber = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toString() : 'N/A';
};
const formatNumberWithUnit = (value, unit) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric} ${unit}` : 'N/A';
};
const formatBoolean = value => value ? 'Yes' : 'No';
const formatDateTime = (value, locale) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat(locale || 'en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const readDraftPreview = draftKey => {
  if (!draftKey || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const SectionHeader = ({ icon: Icon, title, subtitle, badge = null }) => <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
    <div className="flex items-start gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-950">
        <Icon size={16} />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
      </div>
    </div>
    {badge}
  </div>;

const DetailGrid = ({ items, columns = 'sm:grid-cols-2 xl:grid-cols-4' }) => <div className={`grid gap-4 p-5 ${columns}`}>
    {items.map(item => <div key={item.label}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{item.label}</span>
        <strong className="mt-2 block whitespace-pre-wrap text-sm font-semibold text-neutral-950">{item.value}</strong>
      </div>)}
  </div>;

const StatCard = ({ label, value, hint = '' }) => <div className="border border-neutral-200 bg-white p-4">
    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
    <strong className="mt-2 block text-lg font-semibold text-neutral-950">{value}</strong>
    {hint ? <span className="mt-1 block text-xs text-neutral-500">{hint}</span> : null}
  </div>;

export const SellerProductPreview = () => {
  const { props, url } = usePage();
  const pageUrl = new URL(url || window.location.href, window.location.origin);
  const draftPreviewKey = props.previewDraftKey || pageUrl.searchParams.get('key');
  const draftPayload = useMemo(() => readDraftPreview(draftPreviewKey), [draftPreviewKey]);
  const product = props.productDetails || draftPayload?.product || null;
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const localization = getUserLocalization(props, props.auth?.user?.country);

  const editProduct = () => {
    if (typeof product?.id === 'number') {
      window.sessionStorage.setItem('seller-products-edit-id', String(product.id));
      router.visit('/seller/products');
    }
  };

  const formatMoney = amount => {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric)) return 'N/A';
    try {
      return new Intl.NumberFormat(localization.locale || 'en-IN', {
        style: 'currency',
        currency: product?.price_currency || localization.currency || 'INR',
        maximumFractionDigits: 2
      }).format(numeric);
    } catch (error) {
      return `${product?.price_currency || localization.currency || 'INR'} ${numeric.toFixed(2)}`;
    }
  };

  if (!product) {
    return <div>
        <Sidebar />
        <SellerPageShell>
          <SellerCard className="space-y-4">
            <h1 className="text-2xl font-semibold text-neutral-950">Product not found</h1>
            <p className="text-sm text-neutral-600">This preview is unavailable.</p>
            <div>
              <Button type="button" variant="outline" onClick={() => router.visit('/seller/products')}>
                <ArrowLeft size={16} />
                Back to products
              </Button>
            </div>
          </SellerCard>
        </SellerPageShell>
      </div>;
  }

  const categoryNames = Array.isArray(product.categories) ? product.categories.map(category => category?.name).filter(Boolean) : [];
  const galleryImages = normalizeList([product.featured_image, ...(Array.isArray(product.gallery_images) ? product.gallery_images : [])]);
  const activeImage = galleryImages[selectedImageIndex] || galleryImages[0] || '';
  const warehouses = Array.isArray(product.warehouses) ? product.warehouses : [];
  const firstWarehouse = warehouses[0] || null;
  const specifications = Array.isArray(product.bullet_points) ? product.bullet_points.filter(item => hasValue(item?.title) || hasValue(item?.value)) : [];
  const seoTerms = normalizeList(product.seo_search_terms);
  const boxItems = normalizeList(product.whats_inside_box);
  const safetyCompliance = product.safety_compliance && typeof product.safety_compliance === 'object' ? Object.entries(product.safety_compliance).filter(([, value]) => hasValue(value)) : [];
  const attributes = Array.isArray(product.attributes) ? product.attributes : [];
  const dimensionLabel = [product.length_cm, product.width_cm, product.height_cm].every(hasValue) ? `${formatNumber(product.length_cm)} x ${formatNumber(product.width_cm)} x ${formatNumber(product.height_cm)} cm` : 'N/A';
  const packageDimensionLabel = [product.package_length_cm, product.package_width_cm, product.package_height_cm].every(hasValue) ? `${formatNumber(product.package_length_cm)} x ${formatNumber(product.package_width_cm)} x ${formatNumber(product.package_height_cm)} cm` : 'N/A';
  const stockLabel = formatNumber(product.stock_quantity ?? 0);
  const statusLabel = product.status === 'published' ? 'Active' : product.status === 'draft' ? 'Draft' : fallbackValue(product.status);
  const typeLabel = product.type === 'service' ? 'Service' : 'Product';
  const catalogLabel = fallbackValue(product.product_type || 'Catalog Product');
  const lowStockValue = firstWarehouse?.pivot?.safety_stock ?? null;
  const maxStockValue = hasValue(product.menu_order) ? product.menu_order : null;
  const reorderValue = firstWarehouse?.pivot?.safety_stock ?? null;
  const stockValue = Number(product.regular_price || 0) * Number(product.stock_quantity || 0);
  const productChannels = Array.isArray(product.fulfillment_channels) && product.fulfillment_channels.length > 0 ? product.fulfillment_channels : product.fulfillment_channel ? [product.fulfillment_channel] : [];
  const sellerIsIndian = String(product.user?.country || '').trim().toLowerCase() === INDIA_COUNTRY;
  const taxTypeLabel = product.tax_status === 'taxable' ? (sellerIsIndian ? 'GST' : 'Tax') : fallbackValue(product.tax_status === 'none' ? (sellerIsIndian ? 'No GST' : 'No Tax') : product.tax_status);
  const salesChannelCount = productChannels.length;
  const channelEnabled = salesChannelCount > 0;
  const channelSyncPrice = false;
  const channelSyncStock = false;
  const channelBackorders = false;
  const isIncompleteShipping = !hasValue(product.weight_kg) || !hasValue(product.length_cm) || !hasValue(product.width_cm) || !hasValue(product.height_cm) || !hasValue(product.shipping_class);

  const summaryCards = [{
    label: 'Selling Price',
    value: formatMoney(product.sale_price || product.regular_price),
    hint: hasValue(product.sale_price) && Number(product.sale_price) < Number(product.regular_price) ? `Regular ${formatMoney(product.regular_price)}` : ''
  }, {
    label: 'Current Stock',
    value: stockLabel,
    hint: fallbackValue(product.stock_status)
  }, {
    label: 'Brand',
    value: fallbackValue(product.brand?.name || product.user?.brand_name),
    hint: fallbackValue(productChannels.join(', ') || product.fulfillment_channel)
  }, {
    label: 'Category',
    value: fallbackValue(categoryNames.join(', ')),
    hint: catalogLabel
  }];

  const sidebarSections = [{
    title: 'Product Details',
    icon: Eye,
    items: [{
      label: 'Selling Price',
      value: formatMoney(product.sale_price || product.regular_price)
    }, {
      label: 'Item Code',
      value: fallbackValue(product.mystore_product_id)
    }, {
      label: 'SKU',
      value: fallbackValue(product.sku)
    }, {
      label: 'Brand',
      value: fallbackValue(product.brand?.name || product.user?.brand_name)
    }, {
      label: 'Fulfillment Channels',
      value: fallbackValue(productChannels.join(', '))
    }, {
      label: 'Category Path',
      value: fallbackValue(categoryNames.join(', '))
    }]
  }, {
    title: 'Commercial Snapshot',
    icon: Tag,
    items: [{
      label: 'Cost / Purchase Rate',
      value: 'N/A'
    }, {
      label: 'Margin',
      value: 'N/A'
    }, {
      label: 'Sales Channels',
      value: `${channelEnabled ? 1 : 0}/${salesChannelCount}`
    }, {
      label: 'Profit / Unit',
      value: 'N/A'
    }]
  }, {
    title: 'Tax Information',
    icon: ShieldCheck,
    items: [{
      label: 'Tax Type',
      value: taxTypeLabel
    }, {
      label: 'Tax Inclusion',
      value: fallbackValue(product.tax_class)
    }, {
      label: 'Applied Rates',
      value: safetyCompliance.length > 0 ? safetyCompliance.map(([key, value]) => `${key}: ${value}`).join(', ') : 'N/A'
    }]
  }, {
    title: 'Stock Snapshot',
    icon: Warehouse,
    items: [{
      label: 'Current Stock',
      value: stockLabel
    }, {
      label: 'Default Warehouse',
      value: fallbackValue(firstWarehouse?.name)
    }, {
      label: 'Reorder Level',
      value: hasValue(reorderValue) ? formatNumber(reorderValue) : 'N/A'
    }, {
      label: 'Stock Value',
      value: Number.isFinite(stockValue) ? formatMoney(stockValue) : 'N/A'
    }]
  }];

  const renderOverviewTab = () => <div className="space-y-5">
      <SellerCard className="space-y-5">
        <SectionHeader icon={Package2} title="Overview" subtitle="Core product identity" />
        <DetailGrid items={[{
          label: 'Item Code',
          value: fallbackValue(product.mystore_product_id)
        }, {
          label: 'SKU',
          value: fallbackValue(product.sku)
        }, {
          label: 'Status',
          value: statusLabel
        }, {
          label: 'Item Type',
          value: typeLabel
        }, {
          label: 'Catalog Type',
          value: catalogLabel
        }, {
          label: 'Brand',
          value: fallbackValue(product.brand?.name || product.user?.brand_name)
        }, {
          label: 'Manufacturer',
          value: fallbackValue(product.manufacturer)
        }, {
          label: 'Model Number',
          value: fallbackValue(product.model_number)
        }, {
          label: 'Country of Origin',
          value: fallbackValue(product.country_of_origin)
        }, {
          label: 'Condition',
          value: fallbackValue(product.condition)
        }, {
          label: 'Target Gender',
          value: fallbackValue(product.target_gender)
        }, {
          label: 'Recommended Age',
          value: fallbackValue(product.recommended_age)
        }]} />
      </SellerCard>

      <SellerCard className="space-y-5">
        <SectionHeader icon={ScrollText} title="Catalog Story" subtitle="Descriptions, notes and positioning" />
        <DetailGrid items={[{
          label: 'Description',
          value: fallbackValue(product.description)
        }, {
          label: 'Short Description',
          value: fallbackValue(product.short_description)
        }, {
          label: 'Categories',
          value: fallbackValue(categoryNames.join(', '))
        }, {
          label: 'SEO Search Terms',
          value: fallbackValue(seoTerms.join(', '))
        }, {
          label: 'Purchase Note',
          value: fallbackValue(product.purchase_note)
        }, {
          label: 'Gallery Count',
          value: galleryImages.length > 0 ? String(galleryImages.length) : 'N/A'
        }]} columns="sm:grid-cols-2 xl:grid-cols-3" />
      </SellerCard>

      <SellerCard className="space-y-5">
        <SectionHeader icon={Layers} title="Specifications" subtitle="Structured product highlights" />
        {specifications.length > 0 ? <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {specifications.map((item, index) => <div key={`${item.title || 'spec'}-${index}`} className="border border-neutral-200 bg-white p-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{fallbackValue(item.title)}</span>
                <strong className="mt-2 block whitespace-pre-wrap text-sm font-semibold text-neutral-950">{fallbackValue(item.value)}</strong>
              </div>)}
          </div> : <div className="p-5 text-sm text-neutral-500">N/A</div>}
      </SellerCard>
    </div>;

  const renderOperationsTab = () => <div className="space-y-5">
      <SellerCard className="overflow-hidden p-0">
        <SectionHeader icon={ShoppingBag} title="Stock Levels" subtitle="Inventory control tower" />
        <DetailGrid items={[{
          label: 'Current Stock',
          value: stockLabel
        }, {
          label: 'Min Stock Level',
          value: hasValue(lowStockValue) ? formatNumber(lowStockValue) : 'N/A'
        }, {
          label: 'Max Stock Level',
          value: hasValue(maxStockValue) ? formatNumber(maxStockValue) : 'N/A'
        }, {
          label: 'Reorder Level',
          value: hasValue(reorderValue) ? formatNumber(reorderValue) : 'N/A'
        }]} />
      </SellerCard>

      <SellerCard className="overflow-hidden p-0">
        <SectionHeader icon={Warehouse} title="Warehouse Stock" subtitle="Location breakdown" />
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {(warehouses.length > 0 ? warehouses : [null]).map((warehouse, index) => <div key={warehouse?.id || `warehouse-empty-${index}`} className="border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <strong className="block text-base font-semibold text-neutral-950">{fallbackValue(warehouse?.name)}</strong>
                  <span className="mt-1 block text-sm text-neutral-500">Current Stock</span>
                </div>
                <strong className="text-lg font-semibold text-neutral-950">{warehouse ? formatNumber(warehouse?.pivot?.quantity ?? 0) : 'N/A'}</strong>
              </div>
            </div>)}
        </div>
      </SellerCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SellerCard className="overflow-hidden p-0">
          <SectionHeader icon={Settings2} title="Metadata" subtitle="Operations profile" />
          <DetailGrid items={[{
            label: 'Valuation Method',
            value: 'N/A'
          }, {
            label: 'Opening Stock',
            value: stockLabel
          }, {
            label: 'Stock Value',
            value: Number.isFinite(stockValue) ? formatMoney(stockValue) : 'N/A'
          }, {
            label: 'Default Warehouse',
            value: fallbackValue(firstWarehouse?.name)
          }, {
            label: 'Putaway Zone',
            value: 'N/A'
          }, {
            label: 'Putaway Bin',
            value: fallbackValue(firstWarehouse?.pivot?.bin_location)
          }]} columns="sm:grid-cols-2" />
        </SellerCard>

        <SellerCard className="overflow-hidden p-0">
          <SectionHeader icon={BriefcaseBusiness} title="Manufacturing" subtitle="Operational defaults" />
          <DetailGrid items={[{
            label: 'Procurement Method',
            value: 'N/A'
          }, {
            label: 'Default BOM',
            value: 'N/A'
          }, {
            label: 'Structure Type',
            value: fallbackValue(product.type)
          }, {
            label: 'Manage Stock',
            value: formatBoolean(Boolean(product.manage_stock))
          }, {
            label: 'Bin Location',
            value: fallbackValue(firstWarehouse?.pivot?.bin_location)
          }, {
            label: 'Reserved Quantity',
            value: firstWarehouse ? formatNumber(firstWarehouse?.pivot?.reserved_quantity ?? 0) : 'N/A'
          }]} columns="sm:grid-cols-2" />
        </SellerCard>
      </div>

      <SellerCard className="overflow-hidden p-0">
        <SectionHeader icon={Truck} title="Shipping Readiness" subtitle="Fulfillment readiness" badge={<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isIncompleteShipping ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{isIncompleteShipping ? 'Incomplete' : 'Ready'}</span>} />
        <DetailGrid items={[{
          label: 'Weight',
          value: formatNumberWithUnit(product.weight_kg, 'kg')
        }, {
          label: 'Dimensions',
          value: dimensionLabel
        }, {
          label: 'Package Type',
          value: 'N/A'
        }, {
          label: 'Shipping Class',
          value: fallbackValue(product.shipping_class)
        }]} />
      </SellerCard>
    </div>;

  const renderCatalogTab = () => <div className="space-y-5">
      <SellerCard className="overflow-hidden p-0">
        <SectionHeader icon={Globe} title="Sales Channels" subtitle="Channel readiness" badge={<span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{`${channelEnabled ? 1 : 0}/${salesChannelCount}`}</span>} />
        <div className="p-5">
          <div className="max-w-[620px] border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-lg font-semibold text-neutral-950">{fallbackValue(product.user?.brand_name || product.brand?.name || 'Storefront')}</strong>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${channelEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-700'}`}>{channelEnabled ? 'Active' : 'Inactive'}</span>
                </div>
                <span className="mt-1 block text-sm text-neutral-500">{fallbackValue(product.user?.brand_name || product.brand?.name || 'storefront')}</span>
              </div>
              <strong className="text-lg font-semibold text-neutral-950">{formatMoney(product.sale_price || product.regular_price)}</strong>
            </div>
            <DetailGrid items={[{
              label: 'Channel Selling Price',
              value: formatMoney(product.sale_price || product.regular_price)
            }, {
              label: 'Channel MRP',
              value: formatMoney(product.regular_price)
            }, {
              label: 'Default Warehouse',
              value: fallbackValue(firstWarehouse?.name)
            }, {
              label: 'Price List',
              value: 'N/A'
            }]} columns="sm:grid-cols-2" />
            <div className="flex flex-wrap gap-2 px-5 pb-5">
              {[`Sync Price: ${formatBoolean(channelSyncPrice)}`, `Sync Stock: ${formatBoolean(channelSyncStock)}`, 'Stock Buffer: N/A', `Allow Backorders: ${formatBoolean(channelBackorders)}`].map(label => <span key={label} className="inline-flex rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700">{label}</span>)}
            </div>
          </div>
        </div>
      </SellerCard>
    </div>;

  const renderTradeTab = () => <div className="space-y-5">
      <SellerCard className="overflow-hidden p-0">
        <SectionHeader icon={Globe} title="Trade & Compliance" subtitle="Global trade identity" />
        <DetailGrid items={[{
          label: 'HS Code',
          value: 'N/A'
        }, {
          label: 'HSN Code',
          value: 'N/A'
        }, {
          label: 'Country of Origin',
          value: fallbackValue(product.country_of_origin)
        }]} columns="sm:grid-cols-2 xl:grid-cols-3" />
      </SellerCard>

      <SellerCard className="overflow-hidden p-0">
        <SectionHeader icon={Ruler} title="Physical Properties & Global Trade" subtitle="Shipping specification" />
        <DetailGrid items={[{
          label: 'Weight',
          value: formatNumberWithUnit(product.weight_kg, 'kg')
        }, {
          label: 'Length',
          value: formatNumberWithUnit(product.length_cm, 'cm')
        }, {
          label: 'Width',
          value: formatNumberWithUnit(product.width_cm, 'cm')
        }, {
          label: 'Height',
          value: formatNumberWithUnit(product.height_cm, 'cm')
        }, {
          label: 'Package Type',
          value: 'N/A'
        }, {
          label: 'Shipping Class',
          value: fallbackValue(product.shipping_class)
        }, {
          label: 'Dimensions',
          value: dimensionLabel
        }]} />
      </SellerCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SellerCard className="overflow-hidden p-0">
          <SectionHeader icon={ShieldCheck} title="Compliance Status" subtitle="Fulfillment flags" />
          <DetailGrid items={[{
            label: 'Taxable',
            value: formatBoolean(product.tax_status === 'taxable')
          }, {
            label: 'Hazardous Material',
            value: 'N/A'
          }, {
            label: 'Track Inventory',
            value: formatBoolean(Boolean(product.manage_stock))
          }, {
            label: 'Sold Individually',
            value: formatBoolean(Boolean(product.sold_individually))
          }]} columns="sm:grid-cols-2" />
        </SellerCard>

        <SellerCard className="overflow-hidden p-0">
          <SectionHeader icon={UserCircle2} title="Record Owner" subtitle="Record stewardship" />
          <DetailGrid items={[{
            label: 'Created By',
            value: fallbackValue(product.user?.name)
          }, {
            label: 'Created At',
            value: formatDateTime(product.created_at, localization.locale)
          }, {
            label: 'Last Updated',
            value: formatDateTime(product.updated_at, localization.locale)
          }, {
            label: 'Structure Type',
            value: fallbackValue(product.type)
          }, {
            label: 'Storage Condition',
            value: safetyCompliance.find(([key]) => key === 'warnings')?.[1] || 'N/A'
          }]} columns="sm:grid-cols-2" />
        </SellerCard>
      </div>
    </div>;

  const openLightbox = index => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };
  const showPreviousImage = () => {
    if (galleryImages.length <= 1) return;
    setSelectedImageIndex(current => current === 0 ? galleryImages.length - 1 : current - 1);
  };
  const showNextImage = () => {
    if (galleryImages.length <= 1) return;
    setSelectedImageIndex(current => current === galleryImages.length - 1 ? 0 : current + 1);
  };

  return <div>
      <Sidebar />
      <SellerPageShell>
        <div className="space-y-6">
          <div className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <SellerPill>{statusLabel}</SellerPill>
                  <SellerPill>{typeLabel}</SellerPill>
                  <SellerPill>{catalogLabel}</SellerPill>
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">{fallbackValue(product.name)}</h1>
                <p className="mt-2 text-sm text-neutral-500">{fallbackValue(product.mystore_product_id)}</p>
                <p className="mt-4 max-w-4xl text-sm leading-7 text-neutral-600">{fallbackValue(product.short_description || product.description)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => router.visit('/seller/products')}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
                {typeof product.id === 'number' ? <Button type="button" onClick={editProduct}>
                    <Edit size={16} />
                    Edit
                  </Button> : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_340px] xl:items-start">
              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-[auto_auto]">
                  <div className="border border-neutral-200 bg-white">
                    {activeImage ? <button type="button" className="block w-full" onClick={() => openLightbox(selectedImageIndex)} aria-label="Open product image">
                        <img src={activeImage} alt={product.name || 'Product'} className="aspect-square w-full object-cover" />
                      </button> : <div className="flex aspect-square items-center justify-center text-neutral-400">
                        <ImageIcon size={32} />
                      </div>}
                  </div>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {summaryCards.map(item => <StatCard key={item.label} label={item.label} value={item.value} hint={item.hint} />)}
                    </div>
                    {galleryImages.length > 1 ? <div className="flex flex-wrap gap-3">
                        {galleryImages.slice(0, 5).map((image, index) => <button key={image} type="button" className={`h-20 w-20 overflow-hidden border bg-white ${index === selectedImageIndex ? 'border-neutral-950' : 'border-neutral-200'}`} onClick={() => setSelectedImageIndex(index)} aria-label={`View image ${index + 1}`}>
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          </button>)}
                      </div> : null}
                  </div>
                  <div className="lg:col-span-2 lg:mt-2">
                    <div className="flex flex-wrap gap-2">
                      {TAB_OPTIONS.map(tab => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex min-h-10 items-center border px-4 text-sm font-medium transition ${tab.id === activeTab ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950'}`}>
                          {tab.label}
                        </button>)}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  {activeTab === 'overview' && renderOverviewTab()}
                  {activeTab === 'operations' && renderOperationsTab()}
                  {activeTab === 'catalog' && renderCatalogTab()}
                  {activeTab === 'trade' && renderTradeTab()}
                </div>
              </div>

              <aside className="space-y-4">
                {sidebarSections.map(section => <div key={section.title} className="border border-neutral-200 bg-white">
                    <div className="border-b border-neutral-200 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <section.icon size={16} className="text-neutral-700" />
                        <strong className="text-base font-semibold text-neutral-950">{section.title}</strong>
                      </div>
                    </div>
                    <div className="space-y-4 px-5 py-4">
                      {section.items.map(item => <div key={item.label} className="border-b border-neutral-100 pb-4 last:border-b-0 last:pb-0">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{item.label}</span>
                          <strong className="mt-2 block whitespace-pre-wrap text-sm font-semibold text-neutral-950">{item.value}</strong>
                        </div>)}
                    </div>
                  </div>)}
              </aside>
            </div>
          </div>

        </div>
        {lightboxOpen && activeImage ? <SellerModalBackdrop onClose={() => setLightboxOpen(false)}>
            <SellerModalCard className="max-w-5xl bg-white p-4 sm:p-5" onMouseDown={event => event.stopPropagation()}>
              <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                <div>
                  <strong className="block text-lg font-semibold text-neutral-950">{fallbackValue(product.name)}</strong>
                  <span className="mt-1 block text-sm text-neutral-500">{selectedImageIndex + 1} / {galleryImages.length}</span>
                </div>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950" onClick={() => setLightboxOpen(false)} aria-label="Close image viewer">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={showPreviousImage} disabled={galleryImages.length <= 1} aria-label="Previous image">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex-1 overflow-hidden border border-neutral-200 bg-neutral-50">
                  <img src={activeImage} alt={product.name || 'Product'} className="max-h-[72vh] w-full object-contain" />
                </div>
                <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={showNextImage} disabled={galleryImages.length <= 1} aria-label="Next image">
                  <ChevronRight size={18} />
                </button>
              </div>
              {galleryImages.length > 1 ? <div className="mt-4 flex flex-wrap gap-3">
                  {galleryImages.map((image, index) => <button key={`${image}-${index}`} type="button" className={`h-20 w-20 overflow-hidden border bg-white ${index === selectedImageIndex ? 'border-neutral-950' : 'border-neutral-200'}`} onClick={() => setSelectedImageIndex(index)} aria-label={`Select image ${index + 1}`}>
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>)}
                </div> : null}
            </SellerModalCard>
          </SellerModalBackdrop> : null}
      </SellerPageShell>
    </div>;
};

export default SellerProductPreview;
