import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, router, usePage } from '@inertiajs/react';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CategoryDrawer } from '../components/CategoryDrawer';
import { AttributeDrawer } from '../components/AttributeDrawer';
import { BrandDrawer } from '../components/BrandDrawer';
import { DEFAULT_UNITS, UnitMeasurementDrawer } from '../components/UnitMeasurementDrawer';
import { DismissibleAlert } from '../components/DismissibleAlert';
import { SellerPageShell, SellerPaginationCard, SellerSortHeader, SellerTablePaginationBar } from '../components/seller-workspace';
import { AlertTriangle, ArrowDownToLine, ArrowLeft, ArrowUpToLine, ChevronRight, ChevronDown, Edit, Eye, Image, Layers, ListFilter, ListPlus, PackageOpen, Plus, ShieldCheck, Tag, Trash, Truck, Warehouse, X, LayoutGrid, CircleDollarSign, ShoppingCart, Box, HelpCircle, CheckCircle2, ScanSearch, Wrench, Columns3, Check } from 'lucide-react';
import { getUserLocalization } from '../utils/localization';
import { getNextSort, sortRows } from '../utils/tableSorting';
const CONDITION_OPTIONS = [['new', 'New'], ['renewed', 'Renewed'], ['open_box', 'Open Box'], ['refurbished', 'Refurbished'], ['used_like_new', 'Used - Like New'], ['used_good', 'Used - Good'], ['used_acceptable', 'Used - Acceptable']];
const BULLET_TITLE_OPTIONS = ['Description', 'Material', 'Compatibility', 'Battery Life', 'Warranty', 'Care Instructions', 'Fit', 'Ingredients', 'Other'];
const PRODUCT_TYPE_OPTIONS = [['simple', 'Simple product'], ['grouped', 'Grouped product'], ['external', 'External/Affiliate product'], ['variable', 'Variable product']];
const buildPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({
    length: total
  }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
};
const defaultSafety = {
  certifications: '',
  warnings: '',
  batteries: '',
  compliance_marks: ''
};
const listFrom = (value, fallback = ['']) => {
  if (Array.isArray(value) && value.length > 0) return value;
  return fallback;
};
const cleanList = items => listFrom(items).map(item => String(item || '').trim()).filter(Boolean);
const unitStorageKey = userId => `seller-unit-measurements-${userId || 'default'}`;
const INDIA_COUNTRY = 'india';
const GST_RATE_LABEL = 'GST (18%)';
const getSellerTaxLabel = sellerCountry => String(sellerCountry || '').trim().toLowerCase() === INDIA_COUNTRY ? GST_RATE_LABEL : 'Tax (18%)';
const loadSellerUnits = userId => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(unitStorageKey(userId)) || 'null');
    return Array.isArray(stored) && stored.length ? stored : DEFAULT_UNITS;
  } catch (error) {
    return DEFAULT_UNITS;
  }
};
const toUnitLabel = unit => {
  const name = String(unit?.name || '').trim();
  const symbol = String(unit?.symbol || '').trim();
  if (!name && !symbol) return '';
  if (!symbol) return name;
  return `${name} (${symbol})`;
};
const TAX_OPTIONS = [{
  value: 'taxable',
  label: GST_RATE_LABEL
}, {
  value: 'none',
  label: 'No GST'
}];
const getTaxLabel = (product, sellerCountry) => String(product?.tax_status || 'none') === 'taxable' ? getSellerTaxLabel(product?.user?.country || sellerCountry) : 'No Tax';
const ProductAttributeValuePicker = ({
  attribute,
  index,
  savedValues,
  onAddValue,
  onRemoveValue,
  onSyncAttribute
}) => {
  const [draftValue, setDraftValue] = useState('');
  const [open, setOpen] = useState(false);
  const selectedValues = (typeof attribute.options === 'string' ? attribute.options.split(',') : attribute.options || []).map(option => String(option || '').trim()).filter(Boolean);
  const availableSavedValues = Array.from(new Set((savedValues || []).map(option => String(option || '').trim()).filter(Boolean)));
  const submitValue = () => {
    const normalizedValue = draftValue.trim();
    if (!normalizedValue) return;
    onAddValue(index, normalizedValue);
    onSyncAttribute?.(attribute.name, [...availableSavedValues, normalizedValue]);
    setDraftValue('');
  };
  const toggleSavedValue = value => {
    const normalizedValue = String(value || '').trim();
    if (!normalizedValue) return;
    if (selectedValues.includes(normalizedValue)) {
      onRemoveValue(index, normalizedValue);
      setOpen(false);
      return;
    }
    onAddValue(index, normalizedValue);
    setOpen(false);
  };
  return <div className="space-y-3">
    <div className="grid gap-2 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-start">
      <button type="button" className="inline-flex min-h-10 w-full items-center justify-between border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-950 transition hover:border-neutral-950" onClick={() => setOpen(current => !current)}>
        <span>{selectedValues.length} selected</span>
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className="flex-1">
        {selectedValues.length > 0 ? <div className="flex flex-wrap gap-2">
          {selectedValues.map(value => <span key={value} className="inline-flex items-center gap-2 border border-neutral-950 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-950">
            {value}
            <button type="button" className="inline-flex h-4 w-4 items-center justify-center text-neutral-500 transition hover:text-red-600" onClick={() => {
              onRemoveValue(index, value);
              setOpen(false);
            }} aria-label={`Remove ${value}`}>
              <X size={12} />
            </button>
          </span>)}
        </div> : <div className="flex min-h-10 items-center border border-dashed border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-400">
          No values selected yet
        </div>}
      </div>
    </div>

    {open && <div role="listbox" aria-label={`${attribute.name || 'Attribute'} values`} className="space-y-2 border border-neutral-200 bg-neutral-50 p-3">
      {availableSavedValues.length === 0 ? <span className="block text-sm text-neutral-500">No saved values yet.</span> : availableSavedValues.map(value => {
        const selected = selectedValues.includes(value);
        return <button key={value} type="button" className={`flex w-full items-center gap-3 border px-3 py-2 text-left text-sm transition ${selected ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950'}`} onClick={() => toggleSavedValue(value)} aria-pressed={selected}>
          <span className={`inline-flex h-4 w-4 items-center justify-center border ${selected ? 'border-white' : 'border-neutral-300'}`}>
            {selected && <Check size={11} />}
          </span>
          <span>{value}</span>
        </button>;
      })}
    </div>}

    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px]">
      <input className="min-h-10 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950" value={draftValue} placeholder={`Add ${attribute.name || 'value'} value`} onChange={event => setDraftValue(event.target.value)} onKeyDown={event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          submitValue();
        }
      }} />
      <Button type="button" variant="outline" className="min-h-10 whitespace-nowrap rounded-none border border-neutral-300 px-4" onClick={submitValue}>
        <Plus size={14} />
        Add Value
      </Button>
    </div>
  </div>;
};
const defaultForm = user => ({
  name: '',
  description: '',
  short_description: '',
  item_code: '',
  hsn_sac_code: '',
  gtin_upc_ean: '',
  tax_status: 'taxable',
  sold_individually: false,
  is_active: true,
  brand_id: '',
  featured_image: '',
  gallery_images: [''],
  manufacturer: '',
  model_number: '',
  country_of_origin: user?.country || '',
  product_type: '',
  product_type_keyword: '',
  item_classification: 'Finished Good',
  service_delivery_method: 'Remote/Online',
  service_duration: '1 Hour',
  service_scope: '',
  service_requirements: '',
  service_lead_time: '',
  target_gender: '',
  recommended_age: '',
  condition: 'new',
  fulfillment_channel: user?.default_fulfillment_channel || '',
  regular_price: '',
  sale_price: '',
  sku: '',
  parent_sku_id: '',
  manage_stock: false,
  stock_quantity: 0,
  selectedCats: [],
  isOtherCat: false,
  new_category_name: '',
  warehouse_id: '',
  warehouse_qty: 0,
  bin_location: '',
  batch_tracking: false,
  serial_tracking: false,
  expiry_tracking: false,
  incoming_inspection: false,
  outgoing_inspection: false,
  manufacturing_inspection: false,
  opening_stock: '',
  min_stock_level: '',
  max_stock_level: '',
  reorder_level: '',
  stock_valuation_method: 'FIFO',
  default_putaway_zone: '',
  default_putaway_bin: '',
  storage_condition: '',
  hazardous_material: false,
  weight_kg: '',
  length_cm: '',
  width_cm: '',
  height_cm: '',
  package_weight_kg: '',
  package_length_cm: '',
  package_width_cm: '',
  package_height_cm: '',
  weight_unit: 'Kilogram (kg)',
  dimension_unit: 'Centimeter (cm)',
  package_type: '',
  shipping_class: '',
  purchase_note: '',
  bullet_points: [],
  size_chart: {
    needed: false,
    image_url: '',
    notes: ''
  },
  safety_compliance: {
    ...defaultSafety
  },
  seo_search_terms: [''],
  whats_inside_box: [''],
  menu_order: 0,
  inventoryType: 'simple',
  attributesList: [],
  variationsList: [],
  groupedProductIds: [],
  externalUrl: '',
  externalButtonText: '',
  procurement_method: 'buy',
  default_vendor: '',
  vendor_sku: '',
  purchasing_lead_time_days: '',
  minimum_order_quantity: '',
  cost_price: '',
  margin_percent: '',
  discount_percent: '',
  unit_label: 'Hourly (Hour)',
  tax_class: 'inclusive',
  price_tax_mode: 'Inclusive',
  seo_title: '',
  seo_description: '',
  returnable: true,
  cross_sell_product_ids: [],
  up_sell_product_ids: []
});
export const SellerProducts = () => {
  const {
    user
  } = useAuth();
  const {
    props
  } = usePage();
  const [products, setProducts] = useState(props.sellerProducts || []);
  const [categories, setCategories] = useState(props.categories || []);
  const [warehouses, setWarehouses] = useState(props.sellerWarehouses || []);
  const [vendors, setVendors] = useState(props.sellerVendors || []);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeEditorSection, setActiveEditorSection] = useState('general');
  const [form, setForm] = useState(() => defaultForm(user));
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [brands, setBrands] = useState(Array.isArray(props.brands) ? props.brands : []);
  const [attributeCache, setAttributeCache] = useState(Array.isArray(props.attributes) ? props.attributes : []);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isAttributeDrawerOpen, setIsAttributeDrawerOpen] = useState(false);
  const [isBrandDrawerOpen, setIsBrandDrawerOpen] = useState(false);
  const [isUnitDrawerOpen, setIsUnitDrawerOpen] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [catalogFilters, setCatalogFilters] = useState({
    category: 'all',
    type: 'all',
    status: 'all'
  });
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [catalogSort, setCatalogSort] = useState({
    key: 'name',
    direction: 'asc'
  });
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [crossSellSearch, setCrossSellSearch] = useState('');
  const [upSellSearch, setUpSellSearch] = useState('');
  const [visibleCatalogColumns, setVisibleCatalogColumns] = useState({
    type: true,
    price: true,
    qty: true,
    tax: true,
    status: true
  });
  const [itemCodeAutoGenerated, setItemCodeAutoGenerated] = useState(true);
  const [selectedAttributeId, setSelectedAttributeId] = useState('');
  const [unitOptions, setUnitOptions] = useState(() => loadSellerUnits(user?.id));
  const catalogToolbarRef = useRef(null);
  const sellerLocalization = getUserLocalization(props, user?.country);
  const currencyPrefix = sellerLocalization.symbol || `${sellerLocalization.currency} `;
  const taxableLabel = getSellerTaxLabel(user?.country);
  const taxOptions = useMemo(() => [{
    value: 'taxable',
    label: taxableLabel
  }, {
    value: 'none',
    label: user?.country && String(user.country).trim().toLowerCase() === INDIA_COUNTRY ? 'No GST' : 'No Tax'
  }], [taxableLabel, user?.country]);
  const mediaItems = useMemo(() => {
    const gallery = cleanList(form.gallery_images);
    const featured = String(form.featured_image || '').trim();
    const items = featured ? [featured, ...gallery.filter(item => item !== featured)] : gallery;
    return items.slice(0, 10);
  }, [form.featured_image, form.gallery_images]);
  const fulfillmentChannels = useMemo(() => {
    const channels = Array.isArray(user?.fulfillment_channels) ? user.fulfillment_channels : [];
    return channels.length > 0 ? channels : [user?.default_fulfillment_channel || 'Seller Fulfilled'];
  }, [user?.default_fulfillment_channel, user?.fulfillment_channels]);
  const shippingCarrierOptions = useMemo(() => {
    const warehouseCarriers = (warehouses || []).map(warehouse => String(warehouse?.default_carrier || '').trim()).filter(Boolean);
    const fallbackChannels = fulfillmentChannels.map(channel => String(channel || '').trim()).filter(Boolean);
    return Array.from(new Set([...warehouseCarriers, ...fallbackChannels]));
  }, [fulfillmentChannels, warehouses]);
  const addAnotherStorageKey = `seller-products-add-another-${user?.id || 'seller'}`;
  const fallbackAddAnotherStorageKey = 'seller-products-add-another';
  const rememberAddAnotherIntent = nextItemCode => {
    try {
      const value = JSON.stringify({
        nextItemCode,
        createdAt: Date.now()
      });
      sessionStorage.setItem(addAnotherStorageKey, value);
      sessionStorage.setItem(fallbackAddAnotherStorageKey, value);
    } catch (error) {
      // Some browsers can block sessionStorage; the in-memory onSuccess path still handles the common case.
    }
  };
  const consumeAddAnotherIntent = () => {
    try {
      const value = sessionStorage.getItem(addAnotherStorageKey) || sessionStorage.getItem(fallbackAddAnotherStorageKey);
      if (!value) return null;
      sessionStorage.removeItem(addAnotherStorageKey);
      sessionStorage.removeItem(fallbackAddAnotherStorageKey);
      const parsed = JSON.parse(value);
      return typeof parsed?.nextItemCode === 'string' ? parsed.nextItemCode : '';
    } catch (error) {
      return null;
    }
  };
  const clearAddAnotherIntent = () => {
    try {
      sessionStorage.removeItem(addAnotherStorageKey);
      sessionStorage.removeItem(fallbackAddAnotherStorageKey);
    } catch (error) {
      // Nothing to clear when storage is unavailable.
    }
  };
  const consumeEditIntent = () => {
    try {
      const editIdValue = sessionStorage.getItem('seller-products-edit-id');
      if (!editIdValue) return null;
      sessionStorage.removeItem('seller-products-edit-id');
      const parsedId = Number(editIdValue);
      return Number.isFinite(parsedId) ? parsedId : null;
    } catch (error) {
      return null;
    }
  };
  useEffect(() => {
    setProducts(props.sellerProducts || []);
    setCategories(props.categories || []);
    setWarehouses(props.sellerWarehouses || []);
    setUnitOptions(loadSellerUnits(user?.id));
    if (Array.isArray(props.brands)) setBrands(props.brands);
    if (Array.isArray(props.attributes)) setAttributeCache(props.attributes);
    setLoading(false);
    const successMessage = props.flash?.success || '';
    setFormSuccess(successMessage);
    if (props.flash?.error) setFormError(props.flash.error);
    const nextItemCode = consumeAddAnotherIntent();
    if (nextItemCode !== null) {
      openFreshCreateForm(nextItemCode || buildNextItemCode());
      return;
    }
    const editProductId = consumeEditIntent();
    if (editProductId !== null) {
      const matchedProduct = (props.sellerProducts || []).find(product => Number(product?.id) === editProductId);
      if (matchedProduct) {
        openEdit(matchedProduct);
      }
    }
  }, [props.attributes, props.brands, props.categories, props.flash, props.sellerProducts, props.sellerWarehouses, user?.id]);
  useEffect(() => {
    try {
      window.localStorage.setItem(unitStorageKey(user?.id), JSON.stringify(unitOptions));
    } catch (error) {
      // Keep unit selection working even when storage is unavailable.
    }
  }, [unitOptions, user?.id]);
  useEffect(() => {
    if (activeEditorSection === 'variations' && form.inventoryType !== 'variable') {
      setActiveEditorSection('general');
      return;
    }
    if (activeEditorSection === 'inventory' && form.inventoryType === 'service') {
      setActiveEditorSection('media');
    }
  }, [activeEditorSection, form.inventoryType]);
  useEffect(() => {
    if (!showColumnMenu && !showFilters) return undefined;
    const handleCatalogPanelClick = event => {
      if (catalogToolbarRef.current && !catalogToolbarRef.current.contains(event.target)) {
        setShowColumnMenu(false);
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleCatalogPanelClick);
    return () => document.removeEventListener('mousedown', handleCatalogPanelClick);
  }, [showColumnMenu, showFilters]);
  useEffect(() => {
    setCurrentPage(1);
  }, [catalogFilters, catalogSearch, catalogSort, productsPerPage]);
  const setField = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleUnitSubmitSuccess = (unit) => {
    const nextLabel = toUnitLabel(unit);
    if (!nextLabel) return;
    setForm(prev => ({
      ...prev,
      unit_label: nextLabel
    }));
    setIsUnitDrawerOpen(false);
  };
  const incrementItemCode = code => {
    const match = String(code || '').match(/^(.*?)(\d+)$/);
    if (!match) return '';
    const [, prefix, numberPart] = match;
    return `${prefix}${String(Number(numberPart) + 1).padStart(numberPart.length, '0')}`;
  };
  const buildNextItemCode = () => {
    const existingIds = (props.sellerProducts || []).map(product => Number(product?.id)).filter(value => Number.isFinite(value));
    const nextId = (existingIds.length > 0 ? Math.max(...existingIds) : 0) + 1;
    return `MYS-${String(nextId).padStart(8, '0')}`;
  };
  const openFreshCreateForm = (itemCode = buildNextItemCode()) => {
    setEditId(null);
    setItemCodeAutoGenerated(true);
    setForm({
      ...defaultForm(user),
      item_code: itemCode
    });
    setFormError('');
    setShowAdvancedOptions(true);
    setActiveEditorSection('general');
    setShowForm(true);
  };
  const setListField = (field, index, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, itemIndex) => itemIndex === index ? value : item)
    }));
  };
  const buildCategoryTree = list => {
    const map = {};
    const tree = [];
    list.forEach(category => {
      map[category.id] = {
        ...category,
        children: []
      };
    });
    list.forEach(category => {
      if (category.parent_id && map[category.parent_id]) {
        map[category.parent_id].children.push(map[category.id]);
      } else {
        tree.push(map[category.id]);
      }
    });
    return tree;
  };
  const handleCatCheckbox = id => {
    setForm(prev => ({
      ...prev,
      selectedCats: prev.selectedCats.includes(id) ? prev.selectedCats.filter(catId => catId !== id) : [...prev.selectedCats, id]
    }));
  };
  const renderCategoryTree = (nodes, depth = 0) => nodes.map(node => <React.Fragment key={node.id}>
    <label>
      <input type="checkbox" checked={form.selectedCats.includes(node.id)} onChange={() => handleCatCheckbox(node.id)} />
      {node.name}
    </label>
    {node.children?.length > 0 && renderCategoryTree(node.children, depth + 1)}
  </React.Fragment>);
  const openCreate = () => {
    setFormSuccess('');
    openFreshCreateForm();
  };
  const openEdit = prod => {
    setLoading(true);
    const fullProd = props.sellerProducts?.find(item => item.id === prod.id) || prod;
    const mainWarehouse = fullProd.warehouses?.[0];
    setEditId(fullProd.id);
    setForm({
      ...defaultForm(user),
      name: fullProd.name || '',
      description: fullProd.description || '',
      short_description: fullProd.short_description || '',
      item_code: fullProd.mystore_product_id || '',
      featured_image: fullProd.featured_image || '',
      gallery_images: listFrom(fullProd.gallery_images),
      manufacturer: fullProd.manufacturer || '',
      model_number: fullProd.model_number || '',
      country_of_origin: fullProd.country_of_origin || user?.country || '',
      product_type: fullProd.product_type || '',
      product_type_keyword: fullProd.product_type_keyword || '',
      item_classification: fullProd.product_type_keyword || 'Finished Good',
      target_gender: fullProd.target_gender || '',
      recommended_age: fullProd.recommended_age || '',
      condition: fullProd.condition || 'new',
      fulfillment_channel: fullProd.fulfillment_channel || user?.default_fulfillment_channel || '',
      regular_price: fullProd.regular_price || '',
      sale_price: fullProd.sale_price || '',
      tax_status: fullProd.tax_status || 'taxable',
      tax_class: fullProd.tax_class || 'inclusive',
      sku: fullProd.sku || '',
      parent_sku_id: fullProd.parent_sku_id || '',
      manage_stock: !!fullProd.manage_stock,
      stock_quantity: fullProd.stock_quantity || 0,
      selectedCats: fullProd.categories?.map(category => category.id) || [],
      warehouse_id: mainWarehouse?.id || '',
      warehouse_qty: mainWarehouse?.pivot?.quantity || 0,
      bin_location: mainWarehouse?.pivot?.bin_location || '',
      opening_stock: fullProd.stock_quantity || '',
      min_stock_level: mainWarehouse?.pivot?.safety_stock || '',
      stock_valuation_method: 'FIFO',
      weight_kg: fullProd.weight_kg || '',
      length_cm: fullProd.length_cm || '',
      width_cm: fullProd.width_cm || '',
      height_cm: fullProd.height_cm || '',
      package_weight_kg: fullProd.package_weight_kg || '',
      package_length_cm: fullProd.package_length_cm || '',
      package_width_cm: fullProd.package_width_cm || '',
      package_height_cm: fullProd.package_height_cm || '',
      weight_unit: 'Kilogram (kg)',
      dimension_unit: 'Centimeter (cm)',
      package_type: '',
      shipping_class: fullProd.shipping_class || '',
      purchase_note: fullProd.purchase_note || '',
      bullet_points: Array.isArray(fullProd.bullet_points) ? fullProd.bullet_points : [],
      size_chart: {
        needed: !!fullProd.size_chart,
        image_url: fullProd.size_chart?.image_url || '',
        notes: fullProd.size_chart?.notes || ''
      },
      safety_compliance: {
        ...defaultSafety,
        ...(fullProd.safety_compliance || {})
      },
      seo_search_terms: listFrom(fullProd.seo_search_terms),
      whats_inside_box: listFrom(fullProd.whats_inside_box),
      cross_sell_product_ids: Array.isArray(fullProd.cross_sell_product_ids) ? fullProd.cross_sell_product_ids.map(id => String(id)) : [],
      up_sell_product_ids: Array.isArray(fullProd.up_sell_product_ids) ? fullProd.up_sell_product_ids.map(id => String(id)) : [],
      menu_order: fullProd.menu_order || 0,
      inventoryType: fullProd.type || 'simple',
      attributesList: fullProd.attributes || [],
      variationsList: fullProd.variations?.map(variation => ({
        id: variation.id,
        attributes: variation.attributes || {},
        regular_price: variation.regular_price || '',
        sale_price: variation.sale_price || '',
        sku: variation.sku || '',
        manage_stock: !!variation.manage_stock,
        stock_quantity: variation.stock_quantity || 0
      })) || [],
      groupedProductIds: Array.isArray(fullProd.grouped_product_ids) ? fullProd.grouped_product_ids.map(id => String(id)) : [],
      externalUrl: fullProd.external_url || '',
      externalButtonText: fullProd.external_button_text || ''
    });
    setFormError('');
    setFormSuccess('');
    setItemCodeAutoGenerated(false);
    setShowAdvancedOptions(true);
    setActiveEditorSection('general');
    setShowForm(true);
    setLoading(false);
  };
  const handleDelete = id => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    router.delete(`/products/${id}`, {
      preserveScroll: true,
      preserveState: false,
      only: ['sellerProducts', 'categories', 'sellerWarehouses', 'flash']
    });
  };
  const toggleProductSelection = id => {
    setSelectedProductIds(current => current.includes(id) ? current.filter(productId => productId !== id) : [...current, id]);
  };
  const handleBulkAction = action => {
    if (selectedProductIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Delete ${selectedProductIds.length} selected product${selectedProductIds.length === 1 ? '' : 's'}?`)) {
      return;
    }
    setLoading(true);
    router.post('/products/bulk-action', {
      ids: selectedProductIds,
      action
    }, {
      preserveScroll: true,
      preserveState: false,
      only: ['sellerProducts', 'categories', 'sellerWarehouses', 'flash'],
      onSuccess: () => setSelectedProductIds([]),
      onError: errors => setFormError(Object.values(errors)[0] || 'Bulk action could not be completed.'),
      onFinish: () => setLoading(false)
    });
  };
  const updateArrayField = (field, index, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, itemIndex) => itemIndex === index ? value : item)
    }));
  };
  const addArrayField = (field, value = '') => {
    setForm(prev => ({
      ...prev,
      [field]: [...prev[field], value]
    }));
  };
  const removeArrayField = (field, index) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, itemIndex) => itemIndex !== index)
    }));
  };
  const uploadMediaFile = async file => {
    if (!file) return;
    setMediaUploading(true);
    setMediaUploadError('');
    try {
      const payload = new FormData();
      payload.append('image', file);
      const response = await fetch('/media/upload', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: payload
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Upload failed.');
      const url = data?.url || '';
      if (url) {
        setForm(prev => {
          const currentGallery = cleanList(prev.gallery_images);
          const nextGallery = Array.from(new Set([...currentGallery, url])).slice(0, 10);
          const nextFeatured = prev.featured_image || nextGallery[0] || '';
          return {
            ...prev,
            featured_image: nextFeatured,
            gallery_images: nextGallery
          };
        });
      }
    } catch (error) {
      setMediaUploadError(error.message || 'Upload failed.');
    } finally {
      setMediaUploading(false);
    }
  };
  const setPrimaryMedia = url => {
    if (!url) return;
    setForm(prev => ({
      ...prev,
      featured_image: url,
      gallery_images: [url, ...cleanList(prev.gallery_images).filter(item => item !== url)].slice(0, 10)
    }));
  };
  const removeMediaItem = url => {
    if (!url) return;
    setForm(prev => {
      const nextGallery = cleanList(prev.gallery_images).filter(item => item !== url);
      const nextFeatured = prev.featured_image === url ? nextGallery[0] || '' : prev.featured_image;
      return {
        ...prev,
        featured_image: nextFeatured,
        gallery_images: nextGallery
      };
    });
  };
  const addSpecification = () => {
    setForm(prev => ({
      ...prev,
      bullet_points: [...(Array.isArray(prev.bullet_points) ? prev.bullet_points : []), {
        title: '',
        value: ''
      }]
    }));
  };
  const updateSpecification = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      bullet_points: (Array.isArray(prev.bullet_points) ? prev.bullet_points : []).map((item, itemIndex) => itemIndex === index ? {
        ...item,
        [field]: value
      } : item)
    }));
  };
  const removeSpecification = index => {
    setForm(prev => ({
      ...prev,
      bullet_points: (Array.isArray(prev.bullet_points) ? prev.bullet_points : []).filter((_, itemIndex) => itemIndex !== index)
    }));
  };
  const addVariation = () => {
    const initialAttrs = {};
    form.attributesList.forEach(attr => {
      if (attr.name?.trim()) initialAttrs[attr.name.trim()] = '';
    });
    setField('variationsList', [...form.variationsList, {
      id: null,
      attributes: initialAttrs,
      regular_price: form.regular_price || '',
      sale_price: '',
      sku: '',
      manage_stock: true,
      stock_quantity: 0
    }]);
  };
  const addSavedAttributeToProduct = attributeId => {
    const attribute = (props.attributes || []).find(item => String(item.id) === String(attributeId));
    setSelectedAttributeId('');
    if (!attribute) return;
    setForm(prev => {
      if (prev.attributesList.some(item => item.name?.toLowerCase() === attribute.name?.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        attributesList: [...prev.attributesList, {
          name: attribute.name,
          options: []
        }]
      };
    });
  };
  const removeProductAttribute = index => {
    setForm(prev => ({
      ...prev,
      attributesList: prev.attributesList.filter((_, itemIndex) => itemIndex !== index),
      variationsList: []
    }));
  };
  const updateProductAttributeOptions = (index, value) => {
    setForm(prev => ({
      ...prev,
      attributesList: prev.attributesList.map((attribute, itemIndex) => itemIndex === index ? {
        ...attribute,
        options: value.split(',').map(option => option.trim()).filter(Boolean)
      } : attribute),
      variationsList: []
    }));
  };
  const normalizedAttributeOptions = attribute => (typeof attribute.options === 'string' ? attribute.options.split(',') : attribute.options || []).map(option => String(option || '').trim()).filter(Boolean);
  const setProductAttributeOptions = (index, options) => {
    const uniqueOptions = Array.from(new Set(options.map(option => String(option || '').trim()).filter(Boolean)));
    setForm(prev => ({
      ...prev,
      attributesList: prev.attributesList.map((attribute, itemIndex) => itemIndex === index ? {
        ...attribute,
        options: uniqueOptions
      } : attribute),
      variationsList: []
    }));
  };
  const addProductAttributeValue = (index, value) => {
    const currentOptions = normalizedAttributeOptions(form.attributesList[index] || {});
    setProductAttributeOptions(index, [...currentOptions, value]);
  };
  const removeProductAttributeValue = (index, value) => {
    const currentOptions = normalizedAttributeOptions(form.attributesList[index] || {});
    setProductAttributeOptions(index, currentOptions.filter(option => option !== value));
  };
  const syncAttributeOptions = async (attributeName, options) => {
    const attribute = attributeCache.find(item => item.name?.toLowerCase() === attributeName.toLowerCase());
    if (!attribute) return;
    const payload = {
      name: attribute.name,
      options: Array.from(new Set([...(attribute.options || []).map(option => String(option || '').trim()).filter(Boolean), ...options.map(option => String(option || '').trim()).filter(Boolean)]))
    };
    try {
      const response = await fetch(`/seller/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Attribute options could not be saved.');
      }
      setAttributeCache(current => current.map(item => item.id === attribute.id ? {
        ...item,
        options: payload.options
      } : item));
      router.reload({
        only: ['attributes'],
        preserveScroll: true,
        preserveState: true
      });
    } catch (error) {
      setFormError(error.message || 'Attribute options could not be saved.');
    }
  };
  const generateVariantCombinations = () => {
    const attributes = buildPreviewAttributes();
    if (attributes.length === 0) {
      setFormError('Add at least one attribute with options before generating variants.');
      return;
    }
    const combinations = attributes.reduce((current, attribute) => current.flatMap(combination => attribute.options.map(option => ({
      ...combination,
      [attribute.name]: option
    }))), [{}]);
    setForm(prev => ({
      ...prev,
      variationsList: combinations.map((attributesMap, index) => {
        const suffix = Object.values(attributesMap).join('-').replace(/\s+/g, '-').toUpperCase();
        return {
          id: null,
          attributes: attributesMap,
          regular_price: prev.regular_price || '',
          sale_price: '',
          sku: prev.sku ? `${prev.sku}-${suffix || index + 1}` : '',
          manage_stock: true,
          stock_quantity: 0
        };
      })
    }));
  };
  const handleBrandCreated = brand => {
    setBrands(current => {
      const next = Array.isArray(current) ? [...current] : [];
      const existingIndex = next.findIndex(item => String(item.id) === String(brand.id));
      if (existingIndex >= 0) {
        next[existingIndex] = {
          ...next[existingIndex],
          ...brand
        };
      } else {
        next.push(brand);
      }
      return next.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    });
    setField('brand_id', String(brand.id));
    setIsBrandDrawerOpen(false);
  };
  const handleSubmit = e => {
    e.preventDefault();
    const submitIntent = e.nativeEvent?.submitter?.value === 'addAnother' ? 'addAnother' : 'close';
    setFormError('');
    setFormSuccess('');
    if (!form.name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (form.inventoryType !== 'grouped' && form.inventoryType !== 'external' && !form.regular_price) {
      setFormError('List price is required for this product type.');
      return;
    }
    if (form.inventoryType === 'external' && !form.externalUrl.trim()) {
      setFormError('Affiliate/external URL is required for external products.');
      return;
    }
    if (form.isOtherCat && !form.new_category_name.trim()) {
      setFormError('Please enter a name for the new category.');
      return;
    }
    const cleanedAttributes = form.attributesList.filter(attr => attr.name?.trim()).map(attr => ({
      name: attr.name.trim(),
      options: typeof attr.options === 'string' ? attr.options.split(',').map(option => option.trim()).filter(Boolean) : attr.options || []
    })).filter(attr => attr.options.length > 0);
    const normalizedType = form.inventoryType === 'service' ? 'simple' : form.inventoryType;
    const payload = {
      name: form.name.trim(),
      description: form.description,
      mystore_product_id: editId || !itemCodeAutoGenerated ? form.item_code.trim() || null : null,
      status: form.is_active ? 'published' : 'draft',
      hsn_sac_code: form.hsn_sac_code,
      gtin_upc_ean: form.gtin_upc_ean,
      tax_status: form.tax_status || 'none',
      tax_class: form.tax_status === 'taxable' ? form.tax_class : 'standard',
      sold_individually: form.sold_individually,
      is_active: form.is_active,
      brand_id: form.brand_id,
      short_description: form.short_description,
      featured_image: form.featured_image || null,
      gallery_images: cleanList(form.gallery_images),
      manufacturer: form.manufacturer,
      model_number: form.model_number,
      country_of_origin: form.country_of_origin || user?.country || null,
      product_type: form.product_type,
      product_type_keyword: form.product_type_keyword,
      target_gender: form.target_gender,
      recommended_age: form.recommended_age,
      condition: form.condition,
      fulfillment_channel: form.fulfillment_channel || user?.default_fulfillment_channel || null,
      regular_price: form.regular_price ? parseFloat(form.regular_price) : 0,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      sku: form.sku,
      parent_sku_id: form.parent_sku_id,
      manage_stock: form.manage_stock,
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
      categories: form.selectedCats,
      new_category_name: form.isOtherCat ? form.new_category_name.trim() : '',
      warehouse_id: form.warehouse_id ? parseInt(form.warehouse_id, 10) : null,
      warehouse_qty: form.warehouse_id ? parseInt(form.warehouse_qty, 10) || 0 : null,
      bin_location: form.bin_location,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      length_cm: form.length_cm ? parseFloat(form.length_cm) : null,
      width_cm: form.width_cm ? parseFloat(form.width_cm) : null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      package_weight_kg: form.package_weight_kg ? parseFloat(form.package_weight_kg) : null,
      package_length_cm: form.package_length_cm ? parseFloat(form.package_length_cm) : null,
      package_width_cm: form.package_width_cm ? parseFloat(form.package_width_cm) : null,
      package_height_cm: form.package_height_cm ? parseFloat(form.package_height_cm) : null,
      shipping_class: form.shipping_class,
      purchase_note: form.purchase_note,
      bullet_points: form.bullet_points.filter(bullet => bullet.title?.trim() || bullet.value?.trim()),
      size_chart: form.size_chart.needed ? {
        image_url: form.size_chart.image_url,
        notes: form.size_chart.notes
      } : null,
      safety_compliance: form.safety_compliance,
      seo_search_terms: cleanList(form.seo_search_terms),
      cross_sell_product_ids: (form.cross_sell_product_ids || []).map(id => parseInt(id, 10)).filter(Boolean),
      up_sell_product_ids: (form.up_sell_product_ids || []).map(id => parseInt(id, 10)).filter(Boolean),
      whats_inside_box: cleanList(form.whats_inside_box),
      menu_order: parseInt(form.menu_order, 10) || 0,
      type: normalizedType,
      grouped_product_ids: normalizedType === 'grouped' ? form.groupedProductIds.map(id => parseInt(id, 10)).filter(Boolean) : [],
      external_url: normalizedType === 'external' ? form.externalUrl.trim() : null,
      external_button_text: normalizedType === 'external' ? form.externalButtonText.trim() || 'Buy on partner site' : null,
      attributes: normalizedType === 'variable' ? cleanedAttributes : null,
      variations: normalizedType === 'variable' ? form.variationsList.map(variation => ({
        ...variation,
        regular_price: parseFloat(variation.regular_price),
        sale_price: variation.sale_price ? parseFloat(variation.sale_price) : null,
        stock_quantity: parseInt(variation.stock_quantity, 10) || 0
      })) : null
    };
    const nextItemCode = submitIntent === 'addAnother' ? incrementItemCode(form.item_code) || '' : '';
    if (submitIntent === 'addAnother') {
      rememberAddAnotherIntent(nextItemCode);
    } else {
      clearAddAnotherIntent();
    }
    setLoading(true);
    const options = {
      preserveScroll: true,
      preserveState: submitIntent === 'addAnother',
      only: ['sellerProducts', 'categories', 'sellerWarehouses', 'flash'],
      onSuccess: () => {
        setFormSuccess(editId ? 'Product updated successfully!' : 'Product created successfully!');
        if (submitIntent === 'addAnother') {
          openFreshCreateForm(nextItemCode || buildNextItemCode());
          return;
        }
        setShowForm(false);
      },
      onError: errors => {
        clearAddAnotherIntent();
        setFormError(Object.values(errors)[0] || 'An error occurred.');
      },
      onFinish: () => setLoading(false)
    };
    if (editId) {
      router.put(`/products/${editId}`, payload, options);
      return;
    }
    router.post('/products', payload, options);
  };
  const sellerLocked = user && !user.email_verified_at;
  const formatMoney = value => {
    const amount = Number.parseFloat(value);
    return Number.isFinite(amount) ? new Intl.NumberFormat(sellerLocalization.locale, {
      style: 'currency',
      currency: sellerLocalization.currency,
      maximumFractionDigits: 2
    }).format(amount) : new Intl.NumberFormat(sellerLocalization.locale, {
      style: 'currency',
      currency: sellerLocalization.currency,
      maximumFractionDigits: 2
    }).format(0);
  };
  const inventoryTypeLabel = type => {
    const match = PRODUCT_TYPE_OPTIONS.find(([value]) => value === type);
    return match ? match[1] : 'Simple product';
  };
  const renderPrice = row => {
    if (row.sale_price) {
      return <>
        <span>{formatMoney(row.sale_price)}</span>
        <span>{formatMoney(row.regular_price)}</span>
      </>;
    }
    return <span>{formatMoney(row.regular_price)}</span>;
  };
  const getStockLabel = row => row.stock_quantity > 0 ? `${row.stock_quantity} available` : 'Out of Stock';
  const activeProductsCount = products.filter(product => product.status === 'published').length;
  const inventoryToggleOptions = [{
    key: 'batch_tracking',
    title: 'Batch Tracking',
    description: 'Require batch values during receipt and dispatch.'
  }, {
    key: 'serial_tracking',
    title: 'Serial Tracking',
    description: 'Require serial values during receipt and dispatch.'
  }, {
    key: 'expiry_tracking',
    title: 'Expiry Tracking',
    description: 'Require expiry dates during inventory movements.'
  }, {
    key: 'incoming_inspection',
    title: 'Incoming Inspection',
    description: 'Require quality inspection before received stock becomes available.'
  }, {
    key: 'manufacturing_inspection',
    title: 'Manufacturing Inspection',
    description: 'Require inspection during production or before finished goods receipt.'
  }, {
    key: 'outgoing_inspection',
    title: 'Outgoing Inspection',
    description: 'Require inspection before warehouse dispatch or shipment.'
  }];
  const serviceProductsCount = products.filter(product => product.type === 'service').length;
  const standardProductsCount = products.filter(product => product.type !== 'service').length;
  const visibleCatalogColumnEntries = [['type', 'Type'], ['price', 'Price'], ['qty', 'Quantity'], ['tax', 'Tax'], ['status', 'Status']];
  const filteredProducts = products.filter(product => {
    const query = catalogSearch.trim().toLowerCase();
    const haystack = [product.name, product.sku, product.mystore_product_id, product.product_type, product.brand?.name].join(' ').toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesCategory = catalogFilters.category === 'all' || product.categories?.some(category => String(category.id) === catalogFilters.category);
    const normalizedType = product.type === 'service' ? 'service' : 'product';
    const matchesType = catalogFilters.type === 'all' || normalizedType === catalogFilters.type;
    const matchesStatus = catalogFilters.status === 'all' || product.status === catalogFilters.status;
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });
  const sortedProducts = sortRows(filteredProducts, catalogSort, {
    name: product => product.name,
    type: product => product.type === 'service' ? 'service' : 'product',
    price: product => Number(product.sale_price || product.regular_price || 0),
    qty: product => Number(product.stock_quantity || 0),
    tax: product => product.tax_status === 'taxable' ? 1 : 0,
    status: product => product.status
  });
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / productsPerPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const pageStartIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = sortedProducts.slice(pageStartIndex, pageStartIndex + productsPerPage);
  const visibleProductsCount = paginatedProducts.length;
  const paginationStart = filteredProducts.length > 0 ? pageStartIndex + 1 : 0;
  const paginationEnd = filteredProducts.length > 0 ? pageStartIndex + visibleProductsCount : 0;
  const paginatedProductIds = paginatedProducts.map(product => product.id);
  const selectedProductsCount = selectedProductIds.length;
  const allVisibleProductsSelected = paginatedProductIds.length > 0 && paginatedProductIds.every(id => selectedProductIds.includes(id));
  const hasSomeVisibleProductsSelected = paginatedProductIds.some(id => selectedProductIds.includes(id));
  const activeFilterCount = Object.values(catalogFilters).filter(value => value !== 'all').length;
  const visibleCatalogColumnsCount = Object.values(visibleCatalogColumns).filter(Boolean).length;
  const tableColumnTemplate = ['34px', '42px', 'minmax(360px, 2.8fr)', visibleCatalogColumns.type ? '128px' : null, visibleCatalogColumns.price ? '128px' : null, visibleCatalogColumns.qty ? '92px' : null, visibleCatalogColumns.tax ? '96px' : null, visibleCatalogColumns.status ? '110px' : null, '124px'].filter(Boolean).join(' ');
  const emptyCatalogMessage = <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center border-t border-neutral-200 bg-neutral-50/50">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
      <PackageOpen size={32} />
    </div>
    <h4 className="text-lg font-bold text-neutral-950">No items found</h4>
    <p className="max-w-sm text-sm text-neutral-500">Try changing the search, filters, or create a new item to start filling this catalog.</p>
  </div>;
  useEffect(() => {
    setCurrentPage(page => Math.min(page, totalPages));
  }, [totalPages]);
  const renderCatalogSortHeader = (key, label, className) => <SellerSortHeader active={catalogSort.key === key} direction={catalogSort.direction} className={`justify-start gap-1 ${className || ''}`} onClick={() => setCatalogSort(current => getNextSort(current, key))}>
    {label}
  </SellerSortHeader>;
  const renderTextListEditor = (field, label, placeholder) => <div>
    <label>{label}</label>
    <div>
      {form[field].map((item, index) => <div key={`${field}-${index}`}>
        <input value={item} placeholder={placeholder} onChange={event => updateArrayField(field, index, event.target.value)} />
        <Button type="button" variant="ghost" onClick={() => removeArrayField(field, index)}><X size={15} /></Button>
      </div>)}
    </div>
    <Button type="button" variant="secondary" size="sm" onClick={() => addArrayField(field)}>
      <Plus size={14} /> Add
    </Button>
  </div>;
  const availableGroupedProducts = products.filter(product => product.id !== editId);
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach(category => map.set(category.id, category));
    return map;
  }, [categories]);
  const editorSections = [{
    id: 'general',
    label: 'General',
    icon: Tag
  }, {
    id: 'attributes',
    label: 'Attributes',
    icon: LayoutGrid
  }, {
    id: 'pricing',
    label: 'Pricing & Channels',
    icon: CircleDollarSign
  }, {
    id: 'manufacturing',
    label: form.inventoryType === 'service' ? 'Subcontracting & Preparation' : 'Purchasing & Manufacturing',
    icon: ShoppingCart
  }, ...(form.inventoryType === 'service' ? [] : [{
    id: 'inventory',
    label: 'Inventory & Logistics',
    icon: Box
  }]), {
    id: 'media',
    label: 'Media & Notes',
    icon: Image
  }];
  const selectedCategories = form.selectedCats.map(id => categoryMap.get(id)).filter(Boolean);
  const summaryPriceLabel = form.inventoryType === 'external' ? 'External listing' : formatMoney(form.sale_price || form.regular_price || 0);
  const summaryType = inventoryTypeLabel(form.inventoryType);
  const progressPercent = 38;
  const attributeCount = form.attributesList.filter(attr => attr.name?.trim()).length;
  const visibleSection = editorSections.some(section => section.id === activeEditorSection) ? activeEditorSection : 'general';
  const specificationRows = Array.isArray(form.bullet_points) ? form.bullet_points : [];
  const fieldClassName = 'min-h-12 w-full rounded-none border border-neutral-200 bg-white px-3.5 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-0';
  const textareaClassName = 'w-full rounded-none border border-neutral-200 bg-white px-3.5 py-3 text-sm leading-6 text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-0';
  const hintClassName = 'mt-2 text-xs leading-5 text-neutral-500';
  const productTypeNotes = {
    simple: 'No variants. Best for a single SKU.',
    grouped: 'Bundle related products into one listing.',
    external: 'Send buyers to a partner or affiliate URL.',
    variable: 'Build sizes, colors, or other options.'
  };
  const isElectronicsSelection = selectedCategories.some(category => {
    let current = category;
    while (current) {
      const label = `${current.name || ''} ${current.slug || ''}`.toLowerCase();
      if (label.includes('electronic') || label.includes('electronics') || label.includes('computer') || label.includes('mobile')) {
        return true;
      }
      current = current.parent_id ? categoryMap.get(current.parent_id) : null;
    }
    return false;
  });
  const hasSpecificationRows = Array.isArray(form.bullet_points) && form.bullet_points.length > 0;
  const buildPreviewAttributes = () => form.attributesList.filter(attr => attr.name?.trim()).map(attr => ({
    name: attr.name.trim(),
    options: typeof attr.options === 'string' ? attr.options.split(',').map(option => option.trim()).filter(Boolean) : attr.options || []
  })).filter(attr => attr.options.length > 0);
  const productSearchPool = useMemo(() => (products || []).filter(product => String(product.id) !== String(editId || '')), [products, editId]);
  const findProductMatches = query => {
    const normalizedQuery = String(query || '').trim().toLowerCase();
    if (!normalizedQuery) return [];
    return productSearchPool.filter(product => {
      const haystack = [product.name, product.sku, product.mystore_product_id].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    }).slice(0, 6);
  };
  const crossSellMatches = useMemo(() => findProductMatches(crossSellSearch).filter(product => !(form.cross_sell_product_ids || []).includes(String(product.id))), [crossSellSearch, form.cross_sell_product_ids, productSearchPool]);
  const upSellMatches = useMemo(() => findProductMatches(upSellSearch).filter(product => !(form.up_sell_product_ids || []).includes(String(product.id))), [upSellSearch, form.up_sell_product_ids, productSearchPool]);
  const selectedCrossSellProducts = useMemo(() => productSearchPool.filter(product => (form.cross_sell_product_ids || []).includes(String(product.id))), [productSearchPool, form.cross_sell_product_ids]);
  const selectedUpSellProducts = useMemo(() => productSearchPool.filter(product => (form.up_sell_product_ids || []).includes(String(product.id))), [productSearchPool, form.up_sell_product_ids]);
  const addRelatedProduct = (field, productId) => {
    setForm(current => ({
      ...current,
      [field]: Array.from(new Set([...(current[field] || []), String(productId)]))
    }));
  };
  const removeRelatedProduct = (field, productId) => {
    setForm(current => ({
      ...current,
      [field]: (current[field] || []).filter(id => String(id) !== String(productId))
    }));
  };
  const purchaseNoteLines = String(form.purchase_note || '').split('\n');
  const purchaseNoteHeading = purchaseNoteLines[0] || '';
  const purchaseNoteBody = purchaseNoteLines.slice(1).join('\n');
  const updatePurchaseNote = (heading, body) => {
    const nextHeading = String(heading || '');
    const nextBody = String(body || '');
    const nextValue = nextBody ? `${nextHeading}\n${nextBody}` : nextHeading;
    setField('purchase_note', nextValue);
  };
  const buildDraftPreviewProduct = () => {
    const groupedIds = form.groupedProductIds.map(id => parseInt(id, 10)).filter(Boolean);
    const attributes = form.inventoryType === 'variable' ? buildPreviewAttributes() : [];
    return {
      id: editId || `draft-${Date.now()}`,
      name: form.name.trim() || 'Untitled product',
      mystore_product_id: form.item_code || buildNextItemCode(),
      status: form.is_active ? 'published' : 'draft',
      description: form.description,
      short_description: form.short_description,
      featured_image: form.featured_image || null,
      image_url: form.featured_image || null,
      gallery_images: cleanList(form.gallery_images),
      manufacturer: form.manufacturer,
      model_number: isElectronicsSelection ? form.model_number : '',
      country_of_origin: form.country_of_origin || user?.country || '',
      product_type: form.product_type,
      product_type_keyword: form.product_type_keyword,
      target_gender: form.target_gender,
      recommended_age: form.recommended_age,
      condition: form.condition,
      fulfillment_channel: form.fulfillment_channel || user?.default_fulfillment_channel || null,
      regular_price: form.regular_price ? parseFloat(form.regular_price) : 0,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      sku: form.sku,
      parent_sku_id: form.parent_sku_id,
      manage_stock: form.manage_stock,
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
      weight_kg: form.weight_kg,
      length_cm: form.length_cm,
      width_cm: form.width_cm,
      height_cm: form.height_cm,
      package_weight_kg: form.package_weight_kg,
      package_length_cm: form.package_length_cm,
      package_width_cm: form.package_width_cm,
      package_height_cm: form.package_height_cm,
      shipping_class: form.shipping_class,
      purchase_note: form.purchase_note,
      bullet_points: form.bullet_points.filter(bullet => bullet.title?.trim() || bullet.value?.trim()),
      size_chart: form.size_chart.needed ? {
        image_url: form.size_chart.image_url,
        notes: form.size_chart.notes
      } : null,
      safety_compliance: form.safety_compliance,
      seo_search_terms: cleanList(form.seo_search_terms),
      whats_inside_box: cleanList(form.whats_inside_box),
      type: form.inventoryType,
      attributes,
      variations: form.inventoryType === 'variable' ? form.variationsList.map((variation, index) => ({
        ...variation,
        id: variation.id || `draft-variation-${index}`,
        regular_price: variation.regular_price ? parseFloat(variation.regular_price) : 0,
        sale_price: variation.sale_price ? parseFloat(variation.sale_price) : null,
        stock_quantity: parseInt(variation.stock_quantity, 10) || 0
      })) : [],
      grouped_products: form.inventoryType === 'grouped' ? products.filter(product => groupedIds.includes(product.id)) : [],
      external_url: form.inventoryType === 'external' ? form.externalUrl.trim() : null,
      external_button_text: form.inventoryType === 'external' ? form.externalButtonText.trim() || 'Buy on partner site' : null,
      brand: {
        name: user?.brand_name || user?.name || 'Your store'
      },
      user: {
        name: user?.name || 'Seller',
        brand_name: user?.brand_name || user?.name || 'Your store'
      },
      categories: selectedCategories
    };
  };
  const visitPreviewPage = url => {
    router.visit(url);
  };
  const openDraftPreview = () => {
    try {
      const key = `seller-product-preview-${user?.id || 'seller'}-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify({
        product: buildDraftPreviewProduct(),
        productReviews: [],
        averageRating: 0,
        totalReviews: 0
      }));
      visitPreviewPage(`/seller/products/preview-draft?key=${encodeURIComponent(key)}`);
    } catch (error) {
      setFormError('Could not prepare the product preview in this browser.');
    }
  };
  const openSavedPreview = productId => {
    visitPreviewPage(`/seller/products/${productId}/preview`);
  };
  const updateInventoryType = value => {
    setForm(prev => ({
      ...prev,
      inventoryType: value,
      attributesList: value === 'variable' ? prev.attributesList : [],
      variationsList: value === 'variable' ? prev.variationsList : [],
      groupedProductIds: value === 'grouped' ? prev.groupedProductIds : [],
      externalUrl: value === 'external' ? prev.externalUrl : '',
      externalButtonText: value === 'external' ? prev.externalButtonText : '',
      parent_sku_id: value === 'variable' ? prev.parent_sku_id : ''
    }));
  };
  return <div>
    <Sidebar />

    <SellerPageShell>
      <div>

        {user && !user.email_verified_at && <div className="mb-6 flex items-start gap-4 border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <AlertTriangle size={20} className="shrink-0 text-amber-700 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-amber-950">Email Verification Required</h4>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Please verify your email address to add, edit or manage products. <Link href="/seller/profile" className="font-semibold underline hover:text-amber-950">Verify email now</Link>.
            </p>
          </div>
        </div>}

        {showForm ? <div>
          {formError && <DismissibleAlert onClose={() => setFormError('')} role="alert">
            {formError}
          </DismissibleAlert>}
          {formSuccess && <DismissibleAlert onClose={() => setFormSuccess('')}>
            {formSuccess}
          </DismissibleAlert>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Top Bar Navigation */}
            <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-950">{editId ? 'Edit Item' : 'Add Item'}</h2>
                <p className="mt-1 text-[15px] text-neutral-500">Create a product or service for your catalog <span className="font-semibold text-amber-700">* Unsaved changes</span></p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button variant="outline" type="submit" name="submitIntent" value="addAnother" disabled={loading}>
                  Save & add another
                </Button>
                <Button type="submit" name="submitIntent" value="close" disabled={loading}>
                  <Plus size={16} />
                  {editId ? 'Update Item' : 'Create Item'}
                </Button>
              </div>
            </div>

            {/* Horizontal Tabs & Progress */}
            <div className="border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-3">
                {editorSections.map((section, index) => {
                  const isActive = visibleSection === section.id;
                  const Icon = section.icon;
                  return <button type="button" key={section.id} className={`inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-semibold transition ${isActive ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100'}`} onClick={() => setActiveEditorSection(section.id)}>
                    <span className="inline-flex h-6 min-w-6 items-center justify-center border border-current text-xs">{index + 1}</span>
                    <Icon size={14} />
                    <span>{section.label}</span>
                  </button>;
                })}
              </div>
              <div className="mt-4 border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between gap-4 text-sm font-semibold text-neutral-950">
                  <span>Setup progress</span>
                  <span>{progressPercent}% complete</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden border border-neutral-200 bg-stone-200">
                  <div className="h-full bg-green-300" style={{
                    width: `${progressPercent}%`
                  }}></div>
                </div>
              </div>
            </div>

            {/* Main Grid: Left Main Content / Right Sidebar */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.85fr)] lg:items-start">
              <div className="h-fit space-y-5 lg:sticky lg:top-24">
                {visibleSection === 'general' && <Card className="space-y-0">
                  <div className="mb-5 flex items-start gap-4">
                    <Box size={20} className="mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-neutral-950">Basic Information</h3>
                      <p className="mt-1 text-[15px] text-neutral-500">Core identity of this item in your catalog.</p>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-12">
                    <div className="xl:col-span-5">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-950">Type <span className="text-red-500">*</span></label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className={`relative flex items-center flex-row cursor-pointer gap-3 rounded-sm border px-4 py-3 transition ${form.inventoryType !== 'service' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950 hover:bg-neutral-50'}`}>
                          <input className="sr-only" type="radio" name="item_type" value="simple" checked={form.inventoryType !== 'service'} onChange={() => updateInventoryType('simple')} />
                          <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current">
                            {form.inventoryType !== 'service' ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
                          </span>
                          <span className="min-w-0">
                            <strong className="block text-sm font-bold leading-none">Product</strong>
                          </span>
                        </label>
                        <label className={`relative flex items-center flex-row cursor-pointer gap-3 rounded-sm border px-4 py-3 transition ${form.inventoryType === 'service' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950 hover:bg-neutral-50'}`}>
                          <input className="sr-only" type="radio" name="item_type" value="service" checked={form.inventoryType === 'service'} onChange={() => updateInventoryType('service')} />
                          <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current">
                            {form.inventoryType === 'service' ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
                          </span>
                          <span className="min-w-0">
                            <strong className="block text-sm font-bold leading-none">Service</strong>
                          </span>
                        </label>
                      </div>
                    </div>
                    {form.inventoryType !== 'service' && <div className="xl:col-span-3">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-950 ">Item Classification <span className="text-red-500">*</span></label>
                      <select className={fieldClassName} value={form.item_classification} onChange={e => setField('item_classification', e.target.value)}>
                        <option>Finished Good</option>
                        <option>Raw Material</option>
                      </select>
                      <div className={hintClassName}>How this item is used in your workflow.</div>
                    </div>}
                    <div className="xl:col-span-4">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-950">Item Code <span className="text-red-500">*</span></label>
                      <input className={fieldClassName} type="text" placeholder="PRD-000009" value={form.item_code} onChange={e => {
                        setItemCodeAutoGenerated(false);
                        setField('item_code', e.target.value);
                      }} />
                      <div className={hintClassName}>Auto-generated, but editable.</div>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-12 xl:items-end">
                    <div className="xl:col-span-5">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-950">Item Name <span className="text-red-500">*</span></label>
                      <input className={fieldClassName} type="text" value={form.name} onChange={e => setField('name', e.target.value)} required />
                    </div>
                    <div className="xl:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-neutral-950">HSN/SAC Code</label>
                      <input className={fieldClassName} type="text" value={form.hsn_sac_code} onChange={e => setField('hsn_sac_code', e.target.value)} />
                    </div>
                    <div className="xl:col-span-2">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-950">SKU <HelpCircle size={14} className="text-neutral-400" /></label>
                      <input className={fieldClassName} type="text" placeholder="SKU" value={form.sku} onChange={e => setField('sku', e.target.value)} />
                    </div>
                    <div className="xl:col-span-3">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-950">GTIN, UPC, EAN, or ISBN <HelpCircle size={14} className="text-neutral-400" /></label>
                      <input className={fieldClassName} type="text" value={form.gtin_upc_ean} onChange={e => setField('gtin_upc_ean', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-neutral-950">Description</label>
                    <textarea className={`${textareaClassName} min-h-[150px]`} rows="5" placeholder="Write a detailed product description..." value={form.description} onChange={e => setField('description', e.target.value)}></textarea>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-neutral-950">Short Description</label>
                    <textarea className={`${textareaClassName} min-h-[104px]`} rows="3" placeholder="A brief summary shown in listings and search results." value={form.short_description} onChange={e => setField('short_description', e.target.value)}></textarea>
                  </div>

                  <button type="button" className="ml-auto inline-flex cursor-pointer items-center gap-2 self-end rounded-sm border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-neutral-50" onClick={() => setShowAdvancedOptions(current => !current)} aria-expanded={showAdvancedOptions}>
                    <ListPlus size={14} />
                    <span>Advanced options</span>
                    <ChevronRight size={14} className={`transition ${showAdvancedOptions ? 'rotate-90' : ''}`} />
                  </button>

                  {showAdvancedOptions && <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4">
                    <div>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h4 className="text-base font-bold text-neutral-950">Product Specifications</h4>
                          <p className="mt-1 text-sm text-neutral-500">Add structured details such as Material, Warranty or Dimensions.</p>
                        </div>
                        {specificationRows.length > 0 && <Button type="button" variant="outline" onClick={addSpecification}>
                          <Plus size={14} />
                          Add specification
                        </Button>}
                      </div>
                      {specificationRows.length > 0 ? <div className="space-y-3">
                        <div className="grid grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_48px] items-center gap-3 border-b border-neutral-200 pb-2 text-sm font-semibold text-neutral-950">
                          <span>#</span>
                          <span>Specification</span>
                          <span>Value</span>
                          <span className="sr-only">Actions</span>
                        </div>

                        <div className="space-y-3">
                          {specificationRows.map((specification, index) => <div key={`specification-${index}`} className="grid grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_48px] items-center gap-3 rounded-none border border-neutral-200 bg-white p-3">
                            <div className="flex h-12 items-center justify-center border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-700">
                              {index + 1}
                            </div>
                            <input className={fieldClassName} type="text" placeholder="e.g. Material" value={specification.title || ''} onChange={e => updateSpecification(index, 'title', e.target.value)} />
                            <input className={fieldClassName} type="text" placeholder="e.g. 100% Cotton" value={specification.value || ''} onChange={e => updateSpecification(index, 'value', e.target.value)} />
                            <button type="button" className="inline-flex h-12 w-12 items-center justify-center border border-neutral-200 bg-white text-neutral-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600" onClick={() => removeSpecification(index)} aria-label={`Remove specification ${index + 1}`}>
                              <Trash size={14} />
                            </button>
                          </div>)}
                        </div>
                      </div> : <button type="button" className="inline-flex items-center justify-center gap-2 w-full text-center border border-dashed border-neutral-950 bg-white px-4 py-3 text-sm font-semibold text-neutral-950" onClick={addSpecification}>
                        <Plus size={14} />
                        Add your first specification
                      </button>}
                    </div>
                  </div>}

                  {form.inventoryType === 'service' && <div className="mt-8 border-t border-neutral-200 pt-8">
                    <div className="mb-4 flex items-center gap-2">
                      <h3 className="text-lg font-bold text-neutral-950">Service Details</h3>
                    </div>
                    <div className="grid gap-5 xl:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Delivery Method</label>
                        <select className={fieldClassName} value={form.service_delivery_method} onChange={e => setField('service_delivery_method', e.target.value)}>
                          <option>Remote/Online</option>
                          <option>On-Site</option>
                          <option>In-Store</option>
                          <option>Digital Delivery</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Service Duration</label>
                        <input className={fieldClassName} type="text" placeholder="e.g. 1 Hour" value={form.service_duration} onChange={e => setField('service_duration', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Booking Lead Time</label>
                        <input className={fieldClassName} type="text" placeholder="e.g. 24 hours in advance" value={form.service_lead_time} onChange={e => setField('service_lead_time', e.target.value)} />
                      </div>
                    </div>
                    <div className="mt-5 space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Service Scope & Inclusions</label>
                        <textarea className={textareaClassName} rows={3} placeholder="What is exactly included in this service?" value={form.service_scope} onChange={e => setField('service_scope', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Requirements from Buyer</label>
                        <textarea className={textareaClassName} rows={3} placeholder="What do you need from the customer before starting?" value={form.service_requirements} onChange={e => setField('service_requirements', e.target.value)} />
                      </div>
                    </div>
                  </div>}
                </Card>}

                {visibleSection === 'attributes' && <Card className="space-y-0">
                  <div className="mb-5 flex items-start gap-4">
                    <LayoutGrid size={20} className="mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-neutral-950">{form.inventoryType === 'service' ? 'Service Attributes' : 'Product Structure'}</h3>
                      <p className="mt-1 text-[15px] text-neutral-500">
                        {form.inventoryType === 'service' ? 'Attach reusable service attributes without generating stock variants.' : 'Sell this as a single item or with multiple variants.'}
                      </p>
                    </div>
                  </div>

                  {form.inventoryType !== 'service' && <div className="grid gap-3 sm:grid-cols-2">
                    <label className={`relative flex items-center cursor-pointer items-start gap-3 border px-4 py-3 transition ${form.inventoryType !== 'variable' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950 hover:bg-neutral-50'}`}>
                      <input className="sr-only" type="radio" name="structure_type" value="simple" checked={form.inventoryType !== 'variable'} onChange={() => updateInventoryType('simple')} />
                      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current">
                        {form.inventoryType !== 'variable' ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-sm font-bold leading-none">Simple Product</strong>
                        <span className="mt-1 block text-xs leading-5 opacity-80">One product, one SKU, no variant combinations.</span>
                      </span>
                    </label>
                    <label className={`relative flex items-center cursor-pointer gap-3 border px-4 py-3 transition ${form.inventoryType === 'variable' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950 hover:bg-neutral-50'}`}>
                      <input className="sr-only" type="radio" name="structure_type" value="variable" checked={form.inventoryType === 'variable'} onChange={() => updateInventoryType('variable')} />
                      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current">
                        {form.inventoryType === 'variable' ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-sm font-bold leading-none">Variable Product</strong>
                        <span className="mt-1 block text-xs leading-5 opacity-80">Create options like Size or Colour and generate variants.</span>
                      </span>
                    </label>
                  </div>}

                  {(form.inventoryType === 'service' || form.inventoryType === 'variable') && <div className="mt-5 space-y-5">
                    <div className="border border-neutral-200 bg-white p-4">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-bold text-neutral-950">Options</h4>
                          <p className="mt-1 text-sm leading-6 text-neutral-500">Add options like Size or Colour. Every combination of values becomes a variant.</p>
                        </div>
                        <span className="inline-flex min-h-9 items-center border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold text-neutral-700">{attributeCount} option(s)</span>
                      </div>

                      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_132px]">
                        <select className="min-h-10 w-full rounded-none border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950" value={selectedAttributeId} onChange={event => {
                          setSelectedAttributeId(event.target.value);
                          addSavedAttributeToProduct(event.target.value);
                        }}>
                          <option value="">Add an option...</option>
                          {(props.attributes || []).map(attribute => <option key={attribute.id} value={attribute.id}>{attribute.name}</option>)}
                        </select>
                        <Button type="button" variant="outline" className="min-h-10 whitespace-nowrap rounded-none border border-neutral-300 px-4" onClick={() => setIsAttributeDrawerOpen(true)}>
                          <Plus size={14} /> New attribute
                        </Button>
                      </div>

                      {form.attributesList.length === 0 ? <div className="border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
                        No options yet. Add one below to start building variants.
                      </div> : <div className="space-y-4">
                        {form.attributesList.map((attribute, index) => <div key={`${attribute.name}-${index}`} className="mx-auto max-w-[920px] border border-neutral-200 bg-white p-4">
                          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-950 text-sm font-bold text-white">{index + 1}</span>
                              <div>
                                <strong className="block text-sm font-bold text-neutral-950">{attribute.name}</strong>
                                <span className="mt-1 block text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">{normalizedAttributeOptions(attribute).length} value(s)</span>
                              </div>
                            </div>
                            <button type="button" className="inline-flex min-h-10 items-center gap-2 border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600" onClick={() => removeProductAttribute(index)} aria-label={`Remove ${attribute.name}`}>
                              <X size={15} />
                              <span>Remove</span>
                            </button>
                          </div>
                          <ProductAttributeValuePicker attribute={attribute} index={index} savedValues={(attributeCache || []).find(item => item.name?.toLowerCase() === attribute.name?.toLowerCase())?.options || []} onAddValue={addProductAttributeValue} onRemoveValue={removeProductAttributeValue} onSyncAttribute={syncAttributeOptions} />
                        </div>)}
                      </div>}
                    </div>
                  </div>}

                  {form.inventoryType === 'variable' && <div className="mt-5 border border-neutral-200 bg-neutral-50 p-4">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-neutral-950">Variants</h4>
                        <p className="mt-1 text-sm leading-6 text-neutral-500">Generate variants from your options, then edit each one inline.</p>
                      </div>
                      <Button type="button" className="min-h-12 rounded-none border border-neutral-200 px-4" onClick={generateVariantCombinations}>
                        <Plus size={14} /> Generate Variants
                      </Button>
                    </div>
                    {form.variationsList.length === 0 ? <div className="flex items-center flex-col justify-center gap-3 border border-dashed border-neutral-300 bg-white px-4 py-6">
                      <LayoutGrid size={28} className="text-neutral-400" />
                      <div>
                        <h5 className="text-base font-bold text-neutral-950 text-center">No variants yet</h5>
                        <p className="mt-1 text-sm leading-6 text-neutral-500">Add options with values above, then generate variants.</p>
                      </div>
                    </div> : <div className="space-y-3">
                      {form.variationsList.map((variation, index) => <div key={`variant-${index}`} className="flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-white p-4">
                        <strong className="text-sm font-bold text-neutral-950">{Object.values(variation.attributes || {}).join(' / ') || `Variant ${index + 1}`}</strong>
                        <span className="inline-flex min-h-10 items-center border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium text-neutral-600">{variation.sku || 'SKU pending'}</span>
                      </div>)}
                    </div>}
                  </div>}
                </Card>}

                {visibleSection === 'pricing' && <>
                  <Card className="space-y-0">
                    <div className="mb-5 flex items-start gap-4">
                      <CircleDollarSign size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-neutral-950">Pricing</h3>
                        <p className="mt-1 text-[15px] text-neutral-500">Set selling price, cost, margin, taxes and the selling unit.</p>
                      </div>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-3">
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-950">Selling Price <span className="text-red-500">*</span></label>
                        <div className="flex items-center overflow-hidden rounded-none border border-neutral-200 bg-white focus-within:border-neutral-950">
                          <span className="inline-flex h-11 items-center border-r border-neutral-200 px-3 text-sm font-semibold text-neutral-500">{currencyPrefix}</span>
                          <input className="h-11 w-full bg-transparent px-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="number" step="0.01" value={form.regular_price} onChange={e => setField('regular_price', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">MRP</label>
                        <div className="flex items-center overflow-hidden rounded-none border border-neutral-200 bg-white focus-within:border-neutral-950">
                          <span className="inline-flex h-11 items-center border-r border-neutral-200 px-3 text-sm font-semibold text-neutral-500">{currencyPrefix}</span>
                          <input className="h-11 w-full bg-transparent px-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="number" step="0.01" value={form.sale_price} onChange={e => setField('sale_price', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Cost Price</label>
                        <div className="flex items-center overflow-hidden rounded-none border border-neutral-200 bg-white focus-within:border-neutral-950">
                          <span className="inline-flex h-11 items-center border-r border-neutral-200 px-3 text-sm font-semibold text-neutral-500">{currencyPrefix}</span>
                          <input className="h-11 w-full bg-transparent px-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="number" step="0.01" value={form.cost_price} onChange={e => setField('cost_price', e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Margin %</label>
                        <div className="flex items-center overflow-hidden rounded-none border border-neutral-200 bg-white focus-within:border-neutral-950">
                          <input className="h-11 w-full bg-transparent px-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="number" value={form.margin_percent} onChange={e => setField('margin_percent', e.target.value)} />
                          <span className="inline-flex h-11 items-center border-l border-neutral-200 px-3 text-sm font-semibold text-neutral-500">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Discount (%)</label>
                        <div className="flex items-center overflow-hidden rounded-none border border-neutral-200 bg-white focus-within:border-neutral-950">
                          <input className="h-11 w-full bg-transparent px-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="number" value={form.discount_percent} onChange={e => setField('discount_percent', e.target.value)} />
                          <span className="inline-flex h-11 items-center border-l border-neutral-200 px-3 text-sm font-semibold text-neutral-500">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-950">Unit <span className="text-red-500">*</span></label>
                        <div className="flex items-stretch gap-2">
                          <select className={fieldClassName} value={form.unit_label} onChange={e => setField('unit_label', e.target.value)}>
                            {unitOptions.filter(unit => unit?.is_active !== false).map(unit => {
                            const label = toUnitLabel(unit);
                            return label ? <option key={unit.id} value={label}>{label}</option> : null;
                          })}
                          </select>
                          <Button type="button" className="inline-flex min-w-12 items-center justify-center border border-neutral-200 bg-white" variant="outline" onClick={() => setIsUnitDrawerOpen(true)} aria-label="Create unit">
                            <Plus size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Taxes</label>
                        <select className={fieldClassName} value={form.tax_status} onChange={e => setField('tax_status', e.target.value)}>
                          {taxOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Price Tax Mode</label>
                        <select className={fieldClassName} value={form.price_tax_mode} onChange={e => {
                        const nextMode = e.target.value;
                        setField('price_tax_mode', nextMode);
                        setField('tax_class', nextMode === 'Exclusive' ? 'exclusive' : 'inclusive');
                      }} disabled={form.tax_status !== 'taxable'}>
                          <option>Inclusive</option>
                          <option>Exclusive</option>
                        </select>
                      </div>
                    </div>
                  </Card>
                  {form.inventoryType !== 'service' && <Card className="space-y-0">
                    <div className="mb-5 flex items-start gap-4">
                      <Warehouse size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-neutral-950">Shipping Options</h3>
                        <p className="mt-1 text-[15px] text-neutral-500">Choose the default fulfillment path for this product and review how many shipping options checkout can offer buyers.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="border border-neutral-200 bg-neutral-50 p-4 xl:col-span-2">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <strong className="block text-base font-semibold text-neutral-950">Available shipping options</strong>
                              <p className="mt-1 text-sm leading-6 text-neutral-500">These come from the fulfillment channels configured in seller settings and can be assigned to this product.</p>
                            </div>
                            <span className="inline-flex min-h-9 items-center border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-950">
                              {shippingCarrierOptions.length} option{shippingCarrierOptions.length === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {shippingCarrierOptions.length > 0 ? shippingCarrierOptions.map(option => <span key={option} className="inline-flex items-center border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700">
                                {option}
                              </span>) : <span className="text-sm text-neutral-500">No shipping options configured yet.</span>}
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-neutral-950">Shipment Channel</label>
                          <select className={fieldClassName} value={form.fulfillment_channel} onChange={e => setField('fulfillment_channel', e.target.value)}>
                            <option value="">Select an option</option>
                            {shippingCarrierOptions.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                          <div className={hintClassName}>Seller selects one shipment channel for this product. Buyer will see and accept this channel at checkout.</div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-neutral-950">Default Warehouse</label>
                          <select className={fieldClassName} value={form.warehouse_id} onChange={e => setField('warehouse_id', e.target.value)}>
                            <option value="">Select an option</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                          <div className={hintClassName}>Used as the primary inventory source for this product.</div>
                        </div>
                        <div className="flex items-start justify-between gap-3 border border-neutral-200 bg-neutral-50 p-4 xl:col-span-2">
                          <div>
                            <strong className="block text-sm font-semibold text-neutral-950">Checkout behavior</strong>
                            <span className="mt-1 block text-xs leading-5 text-neutral-500">Buyer will see the seller-selected shipment channel and its shipping cost in checkout. Buyer does not choose another channel.</span>
                          </div>
                          <span className="inline-flex min-h-9 items-center border border-neutral-200 bg-white px-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700">
                            Seller-selected channel
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>}

                  <Card className="space-y-0">
                    <div className="mb-5 flex items-start gap-4">
                      <Tag size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-neutral-950">OMS & Storefront</h3>
                        <p className="mt-1 text-[15px] text-neutral-500">Search visibility, returns policy and product recommendations.</p>
                      </div>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.12fr)_minmax(250px,0.88fr)]">
                      <div>
                        <label className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-neutral-950">
                          <span>SEO Meta Title</span>
                          <span className="text-xs font-medium text-neutral-400">0/60</span>
                        </label>
                        <input className={fieldClassName} type="text" value={form.seo_title} onChange={e => setField('seo_title', e.target.value)} />
                      </div>
                      <div className="flex items-start justify-between gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="min-w-0">
                          <strong className="block text-sm font-semibold text-neutral-950">Returnable</strong>
                          <p className="mt-1 text-[11px] leading-4 text-neutral-500">Allow return workflows for this item.</p>
                        </div>
                        <label><input type="checkbox" className="h-4 w-4 accent-neutral-950" checked={form.returnable} onChange={e => setField('returnable', e.target.checked)} /><span></span></label>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="mb-2 block text-sm font-semibold text-neutral-950">SEO Description</label>
                      <textarea className={`${textareaClassName} min-h-[104px]`} rows="4" placeholder="Write a search-friendly product summary..." value={form.seo_description} onChange={e => setField('seo_description', e.target.value)}></textarea>
                    </div>

                    <div className="mt-3 grid gap-3 xl:grid-cols-2">
                      <div className="border border-neutral-200 bg-neutral-50 p-4">
                        <h4 className="text-base font-bold text-neutral-950">Cross-sells</h4>
                        <p className="mt-1 text-sm leading-5 text-neutral-500">Recommend complementary products across all sales channels.</p>
                        <div className="mt-2">
                          <input className={fieldClassName} placeholder="Search by product name, SKU, or code..." value={crossSellSearch} onChange={e => setCrossSellSearch(e.target.value)} />
                        </div>
                        {crossSellMatches.length > 0 && <div className="mt-2 space-y-2 border border-neutral-200 bg-white p-2">
                          {crossSellMatches.map(product => <button key={`cross-sell-${product.id}`} type="button" className="flex w-full items-center justify-between gap-3 border border-neutral-200 px-3 py-2 text-left text-sm text-neutral-800 transition hover:border-neutral-950" onClick={() => {
                            addRelatedProduct('cross_sell_product_ids', product.id);
                            setCrossSellSearch('');
                          }}>
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{product.name}</span>
                              <span className="mt-1 block truncate text-xs text-neutral-400">{product.sku || product.mystore_product_id || 'No code'}</span>
                            </span>
                            <Plus size={14} />
                          </button>)}
                        </div>}
                        {selectedCrossSellProducts.length > 0 ? <div className="mt-2 flex flex-wrap gap-2">
                          {selectedCrossSellProducts.map(product => <span key={`selected-cross-${product.id}`} className="inline-flex items-center gap-2 border border-neutral-950 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-950">
                            <span>{product.name}</span>
                            <button type="button" className="inline-flex h-4 w-4 items-center justify-center text-neutral-500 transition hover:text-red-600" onClick={() => removeRelatedProduct('cross_sell_product_ids', product.id)} aria-label={`Remove ${product.name}`}>
                              <X size={12} />
                            </button>
                          </span>)}
                        </div> : <p className="mt-2 text-sm text-neutral-400">No cross-sell products selected yet.</p>}
                      </div>
                      <div className="border border-neutral-200 bg-neutral-50 p-4">
                        <h4 className="text-base font-bold text-neutral-950">Up-sells</h4>
                        <p className="mt-1 text-sm leading-5 text-neutral-500">Recommend higher-value alternatives across all sales channels.</p>
                        <div className="mt-2">
                          <input className={fieldClassName} placeholder="Search by product name, SKU, or code..." value={upSellSearch} onChange={e => setUpSellSearch(e.target.value)} />
                        </div>
                        {upSellMatches.length > 0 && <div className="mt-2 space-y-2 border border-neutral-200 bg-white p-2">
                          {upSellMatches.map(product => <button key={`up-sell-${product.id}`} type="button" className="flex w-full items-center justify-between gap-3 border border-neutral-200 px-3 py-2 text-left text-sm text-neutral-800 transition hover:border-neutral-950" onClick={() => {
                            addRelatedProduct('up_sell_product_ids', product.id);
                            setUpSellSearch('');
                          }}>
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{product.name}</span>
                              <span className="mt-1 block truncate text-xs text-neutral-400">{product.sku || product.mystore_product_id || 'No code'}</span>
                            </span>
                            <Plus size={14} />
                          </button>)}
                        </div>}
                        {selectedUpSellProducts.length > 0 ? <div className="mt-2 flex flex-wrap gap-2">
                          {selectedUpSellProducts.map(product => <span key={`selected-up-${product.id}`} className="inline-flex items-center gap-2 border border-neutral-950 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-950">
                            <span>{product.name}</span>
                            <button type="button" className="inline-flex h-4 w-4 items-center justify-center text-neutral-500 transition hover:text-red-600" onClick={() => removeRelatedProduct('up_sell_product_ids', product.id)} aria-label={`Remove ${product.name}`}>
                              <X size={12} />
                            </button>
                          </span>)}
                        </div> : <p className="mt-2 text-sm text-neutral-400">No up-sell products selected yet.</p>}
                      </div>
                    </div>
                  </Card>
                </>}

                {visibleSection === 'manufacturing' && <Card className="space-y-0">
                  <div className="mb-5 flex items-start gap-4">
                    <ShoppingCart size={20} className="mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-neutral-950">
                        {form.inventoryType === 'service' ? 'Subcontracting & Preparation' : 'Purchasing & Manufacturing'}
                      </h3>
                      <p className="mt-1 text-[15px] text-neutral-500">
                        {form.inventoryType === 'service' ? 'How this service is delivered - in-house, subcontracted, or both.' : 'How this item is sourced - purchased, manufactured, or both.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-neutral-950">
                        {form.inventoryType === 'service' ? 'Service Delivery Source' : 'Procurement Method'}
                      </label>
                      <select className={fieldClassName} value={form.procurement_method} onChange={e => setField('procurement_method', e.target.value)}>
                        <option value="buy">{form.inventoryType === 'service' ? 'Subcontracted' : 'Buy'}</option>
                        <option value="make">{form.inventoryType === 'service' ? 'In-House' : 'Make'}</option>
                        <option value="both">{form.inventoryType === 'service' ? 'Hybrid' : 'Both'}</option>
                      </select>
                    </div>
                    <div className="flex items-center border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-500">
                      {form.inventoryType === 'service' 
                        ? 'Choose whether this service is provided by your own staff, subcontracted to a vendor, or both.' 
                        : 'Choose whether this item should be purchased, manufactured, or supported by both flows.'}
                    </div>
                  </div>

                  {form.procurement_method !== 'make' && <div className="mt-4 border border-neutral-200 bg-neutral-50 p-4">
                    <div>
                      <h4 className="text-base font-bold text-neutral-950">
                        {form.inventoryType === 'service' ? 'Subcontracting Defaults' : 'Purchasing Defaults'}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-neutral-500">
                        {form.inventoryType === 'service' ? 'Preferred subcontractor details for delivering this service.' : 'Preferred vendor item values will be saved to procurement vendor items for replenishment use.'}
                      </p>
                    </div>
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">
                          {form.inventoryType === 'service' ? 'Default Subcontractor' : 'Default Vendor'}
                        </label>
                        <select className={fieldClassName} value={form.default_vendor} onChange={e => setField('default_vendor', e.target.value)}>
                          <option value="">Select an option</option>
                          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">
                          {form.inventoryType === 'service' ? 'Subcontractor Reference Code' : 'Vendor SKU'}
                        </label>
                        <input className={fieldClassName} type="text" value={form.vendor_sku} onChange={e => setField('vendor_sku', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">
                          {form.inventoryType === 'service' ? 'Resource Procurement Time (Days)' : 'Purchasing Lead Time (Days)'}
                        </label>
                        <input className={fieldClassName} type="number" value={form.purchasing_lead_time_days} onChange={e => setField('purchasing_lead_time_days', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">
                          {form.inventoryType === 'service' ? 'Minimum Booking Requirement (Hours)' : 'Minimum Order Quantity (MOQ)'}
                        </label>
                        <input className={fieldClassName} type="number" value={form.moq} onChange={e => setField('moq', e.target.value)} />
                      </div>
                    </div>
                  </div>}

                  {form.procurement_method !== 'buy' && <div className="mt-4 border border-neutral-200 bg-neutral-50 p-4">
                    <div>
                      <h4 className="text-base font-bold text-neutral-950">
                        {form.inventoryType === 'service' ? 'Service Preparation' : 'Manufacturing Defaults'}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-neutral-500">
                        {form.inventoryType === 'service' ? 'Details on preparation and resources needed before delivery.' : 'Time constraints and default bill of materials.'}
                      </p>
                    </div>
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">
                          {form.inventoryType === 'service' ? 'Service Preparation Time (Days)' : 'Manufacturing Lead Time (Days)'}
                        </label>
                        <input className={fieldClassName} type="number" value={form.manufacturing_lead_time_days} onChange={e => setField('manufacturing_lead_time_days', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">
                          {form.inventoryType === 'service' ? 'Resource Allocation Plan' : 'Default BOM'}
                        </label>
                        <input className={fieldClassName} type="text" placeholder={form.inventoryType === 'service' ? 'Enter allocation plan details' : 'Enter BOM reference'} value={form.bom_id || ''} onChange={e => setField('bom_id', e.target.value)} />
                      </div>
                    </div>
                  </div>}
                </Card>}

                {visibleSection === 'inventory' && <div className="space-y-5">
                  <Card className="space-y-0">
                    <div className="mb-5 flex items-start gap-4">
                      <Box size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-neutral-950">Inventory & Logistics</h3>
                        <p className="mt-1 text-[15px] text-neutral-500">Stock tracking, levels, valuation and warehouse handling.</p>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 border border-neutral-200 bg-neutral-50 p-4">
                      <div>
                        <h4 className="text-base font-bold text-neutral-950">Track Inventory</h4>
                        <p className="mt-1 text-sm leading-5 text-neutral-500">Maintain stock levels</p>
                      </div>
                      <label>
                        <input type="checkbox" className="h-4 w-4 accent-neutral-950" checked={form.manage_stock} onChange={e => setField('manage_stock', e.target.checked)} />
                        <span></span>
                      </label>
                    </div>

                    {form.manage_stock && <div className="mt-4 space-y-4">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {inventoryToggleOptions.map(toggle => <div key={toggle.key} className="flex items-start justify-between gap-3 border border-neutral-200 bg-white p-3">
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-950">{toggle.title}</h4>
                            <p className="mt-1 text-xs leading-5 text-neutral-500">{toggle.description}</p>
                          </div>
                          <label>
                            <input type="checkbox" className="h-4 w-4 accent-neutral-950" checked={!!form[toggle.key]} onChange={e => setField(toggle.key, e.target.checked)} />
                            <span></span>
                          </label>
                        </div>)}
                      </div>

                      <div className="border border-neutral-200 bg-neutral-50 p-4">
                        <h4 className="text-base font-bold text-neutral-950">Stock Levels & Valuation</h4>
                        <div className="mt-4 grid gap-4 xl:grid-cols-3">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-neutral-950">Opening Stock</label>
                            <input className={fieldClassName} type="number" min="0" value={form.opening_stock} onChange={e => {
                              const value = e.target.value;
                              setField('opening_stock', value);
                              setField('stock_quantity', value);
                              setField('warehouse_qty', value);
                            }} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-neutral-950">Min Stock Level</label>
                            <input className={fieldClassName} type="number" min="0" value={form.min_stock_level} onChange={e => setField('min_stock_level', e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-neutral-950">Max Stock Level</label>
                            <input className={fieldClassName} type="number" min="0" value={form.max_stock_level} onChange={e => setField('max_stock_level', e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-neutral-950">Reorder Level</label>
                            <input className={fieldClassName} type="number" min="0" value={form.reorder_level} onChange={e => setField('reorder_level', e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-neutral-950">Preferred Warehouse</label>
                            <select className={fieldClassName} value={form.warehouse_id} onChange={e => setField('warehouse_id', e.target.value)}>
                              <option value="">Select an option</option>
                              {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-neutral-950">Stock Valuation Method</label>
                            <select className={fieldClassName} value={form.stock_valuation_method} onChange={e => setField('stock_valuation_method', e.target.value)}>
                              <option value="FIFO">FIFO</option>
                              <option value="LIFO">LIFO</option>
                              <option value="Weighted Average">Weighted Average</option>
                              <option value="Standard Cost">Standard Cost</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="border border-neutral-200 bg-neutral-50 p-4">
                        <h4 className="text-base font-bold text-neutral-950">Warehouse & Logistics</h4>
                        <div className="mt-4 grid gap-4 xl:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-neutral-950">Default Putaway Zone</label>
                            <input className={fieldClassName} type="text" value={form.default_putaway_zone} onChange={e => setField('default_putaway_zone', e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-neutral-950">Default Putaway Bin</label>
                            <input className={fieldClassName} type="text" value={form.default_putaway_bin} onChange={e => setField('default_putaway_bin', e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-neutral-950">Storage Condition</label>
                            <select className={fieldClassName} value={form.storage_condition} onChange={e => setField('storage_condition', e.target.value)}>
                              <option value="">Select an option</option>
                              <option value="ambient">Ambient</option>
                              <option value="cool_dry">Cool & Dry</option>
                              <option value="refrigerated">Refrigerated</option>
                              <option value="frozen">Frozen</option>
                            </select>
                          </div>
                          <div className="flex items-start justify-between gap-3 border border-neutral-200 bg-white p-4">
                            <div>
                              <h4 className="text-sm font-semibold text-neutral-950">Hazardous Material</h4>
                              <p className="mt-1 text-xs leading-5 text-neutral-500">Flags the item for safety-aware handling flows.</p>
                            </div>
                            <label>
                              <input type="checkbox" className="h-4 w-4 accent-neutral-950" checked={form.hazardous_material} onChange={e => setField('hazardous_material', e.target.checked)} />
                              <span></span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>}
                  </Card>

                  <Card className="space-y-0">
                    <div className="mb-5 flex items-start gap-4">
                      <Warehouse size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-neutral-950">Physical Properties & Global Trade</h3>
                        <p className="mt-1 text-[15px] text-neutral-500">Weight, dimensions, packaging and customs details.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Weight</label>
                        <input className={fieldClassName} type="number" value={form.weight_kg} onChange={e => setField('weight_kg', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Weight Unit</label>
                        <select className={fieldClassName} value={form.weight_unit} onChange={e => setField('weight_unit', e.target.value)}>
                          <option>Kilogram (kg)</option>
                          <option>Gram (g)</option>
                          <option>Pound (lb)</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Length</label>
                        <input className={fieldClassName} type="number" value={form.length_cm} onChange={e => setField('length_cm', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Width</label>
                        <input className={fieldClassName} type="number" value={form.width_cm} onChange={e => setField('width_cm', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Height</label>
                        <input className={fieldClassName} type="number" value={form.height_cm} onChange={e => setField('height_cm', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Dimension Unit</label>
                        <select className={fieldClassName} value={form.dimension_unit} onChange={e => setField('dimension_unit', e.target.value)}>
                          <option>Centimeter (cm)</option>
                          <option>Millimeter (mm)</option>
                          <option>Inch (in)</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Package Type</label>
                        <input className={fieldClassName} type="text" value={form.package_type} onChange={e => setField('package_type', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Shipping Class</label>
                        <input className={fieldClassName} type="text" value={form.shipping_class} onChange={e => setField('shipping_class', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">HS Code</label>
                        <input className={fieldClassName} type="text" value={form.hsn_sac_code} onChange={e => setField('hsn_sac_code', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Country of Origin</label>
                        <select className={fieldClassName} value={form.country_of_origin} onChange={e => setField('country_of_origin', e.target.value)}>
                          <option value="">Select an option</option>
                          <option value={user?.country || ''}>{user?.country || 'Country'}</option>
                        </select>
                      </div>
                    </div>
                  </Card>
                </div>}

                {visibleSection === 'media' && <div className="space-y-5">
                  <Card className="space-y-0">
                    <div className="mb-5 flex items-start gap-4">
                      <Image size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-neutral-950">Item Images</h3>
                        <p className="mt-1 text-[15px] text-neutral-500">The first image is used as the main thumbnail. Up to 10 files.</p>
                      </div>
                    </div>

                    <label className="block border border-dashed border-neutral-300 bg-neutral-50 p-5 transition hover:border-neutral-950">
                      <input className="hidden" type="file" accept="image/*" onChange={e => uploadMediaFile(e.target.files?.[0])} />
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <span className="inline-flex h-14 w-14 items-center justify-center border border-neutral-200 bg-white text-neutral-950">
                          <Image size={28} />
                        </span>
                        <div>
                          <strong className="block text-base font-bold text-neutral-950">Add more media</strong>
                          <span className="mt-1 block text-sm leading-6 text-neutral-500">Upload images or videos. Up to 10 files total.</span>
                        </div>
                        <small className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">{mediaUploading ? 'Uploading...' : `${mediaItems.length}/10 files`}</small>
                        <p className="text-sm text-neutral-500">Choose one image as the primary thumbnail after upload.</p>
                      </div>
                    </label>
                    {mediaUploadError && <div className="mt-3 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{mediaUploadError}</div>}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {mediaItems.map(mediaUrl => {
                        const isPrimary = form.featured_image === mediaUrl;
                        return <article key={mediaUrl} className="overflow-hidden border border-neutral-200 bg-white">
                          <div className="aspect-[4/3] border-b border-neutral-200 bg-neutral-50">
                            <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
                          </div>

                          <div className="space-y-3 p-3">
                            <div className="flex items-center justify-between gap-3">
                              {isPrimary ? <span className="inline-flex min-h-9 items-center border border-neutral-200 bg-neutral-950 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white">Primary</span> : <button type="button" className="inline-flex min-h-9 items-center border border-neutral-200 bg-white px-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950" onClick={() => setPrimaryMedia(mediaUrl)}>
                                Set primary
                              </button>}

                              <button type="button" className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600" onClick={() => removeMediaItem(mediaUrl)} aria-label="Remove image">
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        </article>;
                      })}
                    </div>
                  </Card>

                  <Card className="space-y-0">
                    <div className="mb-5 flex items-start gap-2">
                      <ListPlus size={20} className="mt-1 shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-neutral-950">Additional Notes</h3>
                        <p className="text-[15px] text-neutral-500">Internal notes - not shown to customers*</p>
                      </div>
                    </div>
                    <div className="overflow-hidden border border-neutral-200 bg-white">
                      <input className="h-14 w-full border-b border-neutral-200 bg-neutral-50 px-4 text-lg font-semibold text-neutral-950 outline-none placeholder:text-neutral-400" type="text" placeholder="Header" value={purchaseNoteHeading} onChange={e => updatePurchaseNote(e.target.value, purchaseNoteBody)} />
                      <textarea className="min-h-[180px] w-full px-4 py-3 text-sm leading-7 text-neutral-700 outline-none placeholder:text-neutral-400" rows="8" placeholder="Write internal notes here..." value={purchaseNoteBody} onChange={e => updatePurchaseNote(purchaseNoteHeading, e.target.value)}></textarea>
                    </div>
                  </Card>
                </div>}
              </div>

              <div className="space-y-5">
                <Card>
                  <div className="mb-4 flex items-center gap-2">
                    <span><LayoutGrid size={12} /> LIVE PREVIEW</span>
                  </div>
                  <div className="border border-neutral-200 bg-gradient-to-b from-white to-slate-50 p-4">
                    <div>
                      {form.featured_image ? <img src={form.featured_image} alt="" /> : <Image size={24} />}
                    </div>
                    <div>
                      <div>{form.name || 'Untitled item'}</div>
                      <div>{form.item_code || buildNextItemCode()}</div>
                      <div>
                        {form.sale_price || form.regular_price ? formatMoney(form.sale_price || form.regular_price) : 'No price set'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-950">{form.is_active ? 'Active' : 'Draft'}</span>
                    <span className="inline-flex items-center border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-950">{form.inventoryType === 'service' ? 'Service' : 'Product'}</span>
                    {form.inventoryType === 'variable' && <span className="inline-flex items-center border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-950">Variable Product</span>}
                    {form.tax_status === 'taxable' && <span className="inline-flex items-center border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-950">{taxableLabel}</span>}
                  </div>
                </Card>

                {visibleSection === 'general' && <>
                  <Card className="space-y-4 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <span>
                        <Tag size={15} />
                      </span>
                      <h3 className="text-base font-bold text-neutral-950">Classification</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Category</label>
                        <div className="flex items-stretch gap-2">
                          <select className={fieldClassName} value={form.selectedCats[0] || ''} onChange={e => setField('selectedCats', e.target.value ? [parseInt(e.target.value, 10)] : [])}>
                            <option value="">Select an option</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <Button type="button" className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950" variant="outline" onClick={() => setIsCategoryDrawerOpen(true)} aria-label="Create category">
                            <Plus size={14} />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Brand</label>
                        <div className="flex items-stretch gap-2">
                          <select className={fieldClassName} value={form.brand_id} onChange={e => setField('brand_id', e.target.value)}>
                            <option value="">Select an option</option>
                            {brands.map(brand => <option key={brand.id} value={String(brand.id)}>{brand.name}</option>)}
                          </select>
                          <Button type="button" className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950" variant="outline" onClick={() => setIsBrandDrawerOpen(true)} aria-label="Create brand">
                            <Plus size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="space-y-4 p-4">
                    <h3 className="text-base font-bold text-neutral-950">Status</h3>
                    <div className="grid gap-3">
                      <div className="flex items-start justify-between gap-3 rounded-sm border border-neutral-200 bg-neutral-50 p-4">
                        <div>
                          <strong className="block text-sm font-semibold text-neutral-950">{user?.country && String(user.country).trim().toLowerCase() === INDIA_COUNTRY ? 'Apply GST' : 'Apply Tax'}</strong>
                          <span className="mt-1 block text-xs leading-5 text-neutral-500">{user?.country && String(user.country).trim().toLowerCase() === INDIA_COUNTRY ? 'Use GST on this product or service.' : 'Use tax on this product or service.'}</span>
                        </div>
                        <label>
                          <input type="checkbox" checked={form.tax_status === 'taxable'} onChange={e => {
                          const enabled = e.target.checked;
                          setField('tax_status', enabled ? 'taxable' : 'none');
                          if (enabled) {
                            setField('tax_class', form.price_tax_mode === 'Exclusive' ? 'exclusive' : 'inclusive');
                          }
                        }} />
                          <span></span>
                        </label>
                      </div>
                      <div className="flex items-start justify-between gap-3 rounded-sm border border-neutral-200 bg-neutral-50 p-4">
                        <div>
                          <strong className="block text-sm font-semibold text-neutral-950">Sold individually</strong>
                          <span className="mt-1 block text-xs leading-5 text-neutral-500">Limit purchases to 1 item per order</span>
                        </div>
                        <label>
                          <input type="checkbox" checked={form.sold_individually} onChange={e => setField('sold_individually', e.target.checked)} />
                          <span></span>
                        </label>
                      </div>
                      <label className="flex items-start justify-between gap-3 rounded-sm border border-neutral-200 bg-neutral-50 p-4">
                        <input type="checkbox" checked={form.is_active} onChange={e => setField('is_active', e.target.checked)} />
                        <span className="min-w-0">
                          <strong className="block text-sm font-semibold text-neutral-950">Active</strong>
                          <span className="mt-1 block text-xs leading-5 text-neutral-500">Item is visible and available for sale</span>
                        </span>
                      </label>
                    </div>
                  </Card>
                </>}

                {visibleSection === 'pricing' && <Card className="space-y-0">
                  <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-neutral-950"><CircleDollarSign size={16} /> Price summary</h3>
                  <div className="flex items-center justify-between gap-4 border-t border-neutral-200 py-3 first:border-t-0 first:pt-0">
                    <span>Selling Price</span>
                    <strong>{form.regular_price ? formatMoney(form.regular_price) : '-'}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-neutral-200 py-3">
                    <span>MRP</span>
                    <strong>{form.sale_price ? formatMoney(form.sale_price) : '-'}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-neutral-200 py-3">
                    <span>Cost Price</span>
                    <strong>{form.cost_price ? formatMoney(form.cost_price) : '-'}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-neutral-200 py-3">
                    <span>Profit / unit</span>
                    <strong>-</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-neutral-200 py-3">
                    <span>Margin %</span>
                    <strong>{form.margin_percent ? `${form.margin_percent}%` : '-'}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-neutral-200 py-3 pb-0">
                    <span>Discount (%)</span>
                    <strong>{form.discount_percent ? `${form.discount_percent}%` : '-'}</strong>
                  </div>
                </Card>}
              </div>
            </div>
          </form>
        </div> : <div className="space-y-6">
          <div className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">Products &amp; Services</h2>
                <p className="mt-3 text-sm leading-7 text-neutral-600">Manage your products and services catalog.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" type="button" onClick={() => router.visit('/seller/products/import')}><ArrowDownToLine size={14} /> Import</Button>
                <Button variant="outline" type="button" onClick={() => router.visit('/seller/products/export')}><ArrowUpToLine size={14} /> Export</Button>
                <Button variant="primary" onClick={openCreate} disabled={sellerLocked}>
                  <Plus size={16} /> Add Item
                </Button>
              </div>
            </div>

            <div aria-label="Product catalog summary" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Total Products</span>
                    <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{products.length}</strong>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Box size={14} /></div>
                </div>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Active</span>
                    <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{activeProductsCount}</strong>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><CheckCircle2 size={14} /></div>
                </div>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Products</span>
                    <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{standardProductsCount}</strong>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><PackageOpen size={14} /></div>
                </div>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Services</span>
                    <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{serviceProductsCount}</strong>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Wrench size={14} /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-neutral-200 bg-white p-4 shadow-sm" ref={catalogToolbarRef}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
              <div className="flex min-h-12 w-full items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 xl:max-w-[560px] xl:flex-1">
                <ScanSearch size={16} className="text-neutral-700" />
                <input className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="text" placeholder="Search by name or code..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} />
              </div>

              <div className="flex flex-wrap gap-3 xl:ml-auto">
                <div className="relative">
                  <Button variant="outline" type="button" onClick={() => {
                    setShowColumnMenu(current => !current);
                    setShowFilters(false);
                  }}>
                    <Columns3 size={14} />
                    Manage Columns
                  </Button>
                  {showColumnMenu && <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-72 border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
                    <div className="border-b border-neutral-200 pb-3">
                      <strong className="block text-sm font-semibold text-neutral-950">Visible columns</strong>
                      <span className="mt-1 block text-xs text-neutral-500">Choose what appears in the table.</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {visibleCatalogColumnEntries.map(([key, label]) => <label key={key} className="flex items-center gap-3 border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-950">
                        <input type="checkbox" checked={visibleCatalogColumns[key]} onChange={event => setVisibleCatalogColumns(current => ({
                          ...current,
                          [key]: event.target.checked
                        }))} className="h-4 w-4 accent-neutral-950" />
                        <span>{label}</span>
                      </label>)}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button className="inline-flex min-h-10 items-center justify-center border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950" type="button" onClick={() => setVisibleCatalogColumns({
                        type: true,
                        price: true,
                        qty: true,
                        tax: true,
                        status: true
                      })}>
                        Reset
                      </button>
                      <button className="inline-flex min-h-10 items-center justify-center border border-neutral-200 bg-neutral-950 px-3 text-sm font-medium text-white" type="button" onClick={() => setShowColumnMenu(false)}>
                        Done
                      </button>
                    </div>
                  </div>}
                </div>

                <div className="relative">
                  <Button variant="outline" type="button" onClick={() => {
                    setShowFilters(current => !current);
                    setShowColumnMenu(false);
                  }}>
                    <ListFilter size={14} />
                    Filters
                    {activeFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center border border-neutral-950 bg-neutral-950 px-1 text-[10px] font-semibold text-white">{activeFilterCount}</span>}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {showFilters && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-950/35 px-4 py-6" onMouseDown={() => setShowFilters(false)}>
            <div className="w-full max-w-md border border-neutral-200 bg-neutral-50 p-5 shadow-sm" onMouseDown={event => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-3">
                <div>
                  <strong className="block text-lg font-bold text-neutral-950">Filter products</strong>
                  <span className="mt-1 block text-sm text-neutral-500">Refine the list by category, item type, and status.</span>
                </div>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950" onClick={() => setShowFilters(false)} aria-label="Close filters">
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 grid gap-4">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Category</span>
                  <select className="min-h-11 w-full border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none" value={catalogFilters.category} onChange={event => setCatalogFilters(current => ({
                    ...current,
                    category: event.target.value
                  }))}>
                    <option value="all">All categories</option>
                    {categories.map(category => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                  <select className="min-h-11 w-full border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none" value={catalogFilters.type} onChange={event => setCatalogFilters(current => ({
                    ...current,
                    type: event.target.value
                  }))}>
                    <option value="all">All types</option>
                    <option value="product">Products</option>
                    <option value="service">Services</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                  <select className="min-h-11 w-full border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none" value={catalogFilters.status} onChange={event => setCatalogFilters(current => ({
                    ...current,
                    status: event.target.value
                  }))}>
                    <option value="all">All statuses</option>
                    <option value="published">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              </div>
              <div className="mt-5 flex gap-3">
                <button className="inline-flex min-h-10 items-center justify-center border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950" type="button" onClick={() => setCatalogFilters({
                  category: 'all',
                  type: 'all',
                  status: 'all'
                })}>
                  Clear filters
                </button>
                <button className="inline-flex min-h-10 items-center justify-center border border-neutral-200 bg-neutral-950 px-3 text-sm font-medium text-white" type="button" onClick={() => setShowFilters(false)}>
                  Apply
                </button>
              </div>
            </div>
          </div>}

          <div className="hidden overflow-hidden border border-neutral-200 bg-white shadow-sm xl:block">
            <div style={{
              gridTemplateColumns: tableColumnTemplate
            }} className="grid border-b border-neutral-200 bg-neutral-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              <div>
                <input type="checkbox" checked={allVisibleProductsSelected} ref={input => {
                  if (input) input.indeterminate = !allVisibleProductsSelected && hasSomeVisibleProductsSelected;
                }} onChange={event => {
                  setSelectedProductIds(current => {
                    if (event.target.checked) {
                      return Array.from(new Set([...current, ...paginatedProductIds]));
                    }
                    return current.filter(id => !paginatedProductIds.includes(id));
                  });
                }} disabled={paginatedProductIds.length === 0} aria-label="Select visible products" className="h-4 w-4 accent-neutral-950" />
              </div>
              <div>#</div>
              {renderCatalogSortHeader('name', 'Name', 'name justify-start')}
              {visibleCatalogColumns.type ? renderCatalogSortHeader('type', 'Type', 'type') : <div />}
              {visibleCatalogColumns.price ? renderCatalogSortHeader('price', 'Price', 'price') : <div />}
              {visibleCatalogColumns.qty ? renderCatalogSortHeader('qty', 'Qty', 'qty') : <div />}
              {visibleCatalogColumns.tax ? renderCatalogSortHeader('tax', 'Tax', 'tax') : <div />}
              {visibleCatalogColumns.status ? renderCatalogSortHeader('status', 'Status', 'status') : <div />}
              <div>Actions</div>
            </div>

            <div className="divide-y-2 divide-neutral-200">
              {filteredProducts.length === 0 ? emptyCatalogMessage : paginatedProducts.map(product => <div key={product.id} style={{
                gridTemplateColumns: tableColumnTemplate
              }} className="grid items-center gap-3 px-4 py-4 text-base text-neutral-800">
                <div>
                  <input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => toggleProductSelection(product.id)} aria-label={`Select ${product.name}`} className="h-4 w-4 accent-neutral-950" />
                </div>
                <div className="text-center font-medium text-neutral-500">{paginatedProducts.indexOf(product) + 1}</div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center border border-neutral-200 bg-neutral-100 text-sm font-semibold uppercase text-neutral-950">{(product.name || 'P').slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0">
                    <strong className="block truncate text-base font-semibold text-neutral-950">{product.name}</strong>
                    <span className="mt-1 block truncate text-sm text-neutral-500">{product.mystore_product_id || 'Pending'}</span>
                    <em className="mt-1 block truncate text-sm not-italic text-neutral-500">{product.product_type || (product.type === 'service' ? 'Service Package' : 'Catalog Product')}</em>
                  </div>
                </div>
                <div className="flex justify-center">{visibleCatalogColumns.type ? <span className="inline-flex border border-neutral-950 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-700">{product.type === 'service' ? 'Service' : 'Product'}</span> : null}</div>
                <div className="text-center">{visibleCatalogColumns.price ? <strong className="text-base font-semibold text-neutral-950">{formatMoney(product.sale_price || product.regular_price)}</strong> : null}</div>
                <div className="text-center">{visibleCatalogColumns.qty ? <span className="text-base text-neutral-700">{product.type === 'service' ? 'N/A' : product.stock_quantity}</span> : null}</div>
                <div className="text-center">{visibleCatalogColumns.tax ? <span className="text-base text-neutral-700">{getTaxLabel(product, user?.country)}</span> : null}</div>
                <div className="flex justify-center">{visibleCatalogColumns.status ? <span className="inline-flex border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">{product.status === 'published' ? 'Active' : 'Draft'}</span> : null}</div>
                <div className="flex justify-center">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400" type="button" onClick={() => openSavedPreview(product.id)} disabled={sellerLocked} aria-label={`Preview ${product.name}`} title="Preview">
                      <Eye size={14} />
                    </button>
                    <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400" type="button" onClick={() => openEdit(product)} disabled={sellerLocked} aria-label={`Edit ${product.name}`} title="Edit">
                      <Edit size={14} />
                    </button>
                    <button className="inline-flex h-9 w-9 items-center justify-center border border-rose-500 bg-white text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-white disabled:text-rose-300" type="button" onClick={() => handleDelete(product.id)} disabled={sellerLocked} aria-label={`Remove ${product.name}`} title="Remove">
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              </div>)}
            </div>
          </div>

          <div className="space-y-4 xl:hidden">
            {filteredProducts.length === 0 ? emptyCatalogMessage : paginatedProducts.map(product => <article key={`mobile-${product.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate text-base font-semibold text-neutral-950">{product.name}</strong>
                  <span className="mt-1 block truncate text-xs text-neutral-500">{product.mystore_product_id || product.sku || 'Pending code'}</span>
                </div>
                <span className="inline-flex border border-neutral-950 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-700">
                  {product.status === 'published' ? 'Active' : 'Draft'}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{product.type === 'service' ? 'Service' : 'Product'}</strong>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Price</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{formatMoney(product.sale_price || product.regular_price)}</strong>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Quantity</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{product.type === 'service' ? 'N/A' : product.stock_quantity}</strong>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Catalog Type</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{product.product_type || (product.type === 'service' ? 'Service Package' : 'Catalog Product')}</strong>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => openSavedPreview(product.id)} disabled={sellerLocked}>Preview</Button>
                <Button type="button" variant="primary" onClick={() => openEdit(product)} disabled={sellerLocked}>Edit</Button>
                <Button type="button" variant="outline" className="border-rose-500 text-rose-600 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-700" onClick={() => handleDelete(product.id)} disabled={sellerLocked}>Remove</Button>
              </div>
            </article>)}
          </div>

          <SellerPaginationCard>
            {selectedProductsCount > 0 && <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <strong className="text-sm font-semibold text-neutral-950">{selectedProductsCount} item{selectedProductsCount === 1 ? '' : 's'} selected</strong>
              <div role="toolbar" aria-label="Selected product actions" className="flex flex-wrap gap-3">
                <button className="inline-flex min-h-10 items-center justify-center gap-2 border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950" type="button" onClick={() => handleBulkAction('activate')} disabled={loading || sellerLocked}>
                  <CheckCircle2 size={14} />
                  Activate
                </button>
                <button className="inline-flex min-h-10 items-center justify-center gap-2 border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950" type="button" onClick={() => handleBulkAction('deactivate')} disabled={loading || sellerLocked}>
                  <X size={14} />
                  Deactivate
                </button>
                <button className="inline-flex min-h-10 items-center justify-center gap-2 border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950" type="button" onClick={() => handleBulkAction('delete')} disabled={loading || sellerLocked}>
                  <Trash size={14} />
                  Delete
                </button>
                <button className="inline-flex min-h-10 items-center justify-center gap-2 border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950" type="button" onClick={() => setSelectedProductIds([])}>
                  <X size={14} />
                  Clear
                </button>
              </div>
            </div>}
            <SellerTablePaginationBar showBorder={false} className={`${selectedProductsCount > 0 ? 'mt-4' : ''} bg-transparent px-0 pb-0 pt-0`} summary={`Showing ${paginationStart} to ${paginationEnd} of ${filteredProducts.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={productsPerPage} onPerPageChange={event => setProductsPerPage(Number(event.target.value))} />
          </SellerPaginationCard>

        </div>}
      </div>
      <CategoryDrawer isOpen={isCategoryDrawerOpen} onClose={() => setIsCategoryDrawerOpen(false)} />
      <AttributeDrawer isOpen={isAttributeDrawerOpen} onClose={() => setIsAttributeDrawerOpen(false)} />
      <BrandDrawer isOpen={isBrandDrawerOpen} onClose={() => setIsBrandDrawerOpen(false)} onCreated={handleBrandCreated} />
      <UnitMeasurementDrawer isOpen={isUnitDrawerOpen} onClose={() => setIsUnitDrawerOpen(false)} units={unitOptions} onUnitsChange={setUnitOptions} onSubmitSuccess={handleUnitSubmitSuccess} />
    </SellerPageShell>
  </div>;
};
export default SellerProducts;
