import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, router, usePage } from '@inertiajs/react';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { CategoryDrawer } from '../components/CategoryDrawer';
import { RightDrawer } from '../components/RightDrawer';
import { AlertTriangle, ArrowDownToLine, ArrowUpToLine, ChevronRight, Edit, Eye, Image, Layers, ListFilter, ListPlus, PackageOpen, Plus, ShieldCheck, Tag, Trash, Truck, Warehouse, X, LayoutGrid, CircleDollarSign, ShoppingCart, Box, HelpCircle, CheckCircle2, ScanSearch, Wrench, Columns3 } from 'lucide-react';
import './SellerProducts.css';

const CONDITION_OPTIONS = [
  ['new', 'New'],
  ['renewed', 'Renewed'],
  ['open_box', 'Open Box'],
  ['refurbished', 'Refurbished'],
  ['used_like_new', 'Used - Like New'],
  ['used_good', 'Used - Good'],
  ['used_acceptable', 'Used - Acceptable'],
];

const BULLET_TITLE_OPTIONS = [
  'Description',
  'Material',
  'Compatibility',
  'Battery Life',
  'Warranty',
  'Care Instructions',
  'Fit',
  'Ingredients',
  'Other',
];

const PRODUCT_TYPE_OPTIONS = [
  ['simple', 'Simple product'],
  ['grouped', 'Grouped product'],
  ['external', 'External/Affiliate product'],
  ['variable', 'Variable product'],
];

const defaultSafety = {
  certifications: '',
  warnings: '',
  batteries: '',
  compliance_marks: '',
};

const listFrom = (value, fallback = ['']) => {
  if (Array.isArray(value) && value.length > 0) return value;
  return fallback;
};

const cleanList = (items) => (
  listFrom(items).map((item) => String(item || '').trim()).filter(Boolean)
);

const defaultForm = (user) => ({
  name: '',
  description: '',
  short_description: '',
  item_code: '',
  hsn_sac_code: '',
  gtin_upc_ean: '',
  is_taxable: false,
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
  size_chart: { needed: false, image_url: '', notes: '' },
  safety_compliance: { ...defaultSafety },
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
  price_tax_mode: 'Inclusive',
  seo_title: '',
  seo_description: '',
  returnable: true,
  channel_enabled: false,
  channel_sync_price: false,
  channel_sync_stock: true,
  channel_allow_backorders: false,
  use_channel_price: false,
});

export const SellerProducts = () => {
  const { user } = useAuth();
  const { props } = usePage();

  const [products, setProducts] = useState(props.sellerProducts || []);
  const [categories, setCategories] = useState(props.categories || []);
  const [warehouses, setWarehouses] = useState(props.sellerWarehouses || []);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeEditorSection, setActiveEditorSection] = useState('overview');
  const [form, setForm] = useState(() => defaultForm(user));
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [brands, setBrands] = useState(Array.isArray(props.brands) ? props.brands : []);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(true);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isBrandDrawerOpen, setIsBrandDrawerOpen] = useState(false);
  const [brandForm, setBrandForm] = useState({ name: '', logo: '' });
  const [brandError, setBrandError] = useState('');
  const [brandSubmitting, setBrandSubmitting] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [catalogFilters, setCatalogFilters] = useState({
    category: 'all',
    type: 'all',
    status: 'all',
  });
  const [visibleCatalogColumns, setVisibleCatalogColumns] = useState({
    type: true,
    price: true,
    qty: true,
    tax: true,
    status: true,
  });
  const [submitMode, setSubmitMode] = useState('close');
  const [itemCodeAutoGenerated, setItemCodeAutoGenerated] = useState(true);
  const formRef = useRef(null);
  const catalogToolbarRef = useRef(null);

  const fulfillmentChannels = useMemo(() => {
    const channels = Array.isArray(user?.fulfillment_channels) ? user.fulfillment_channels : [];
    return channels.length > 0 ? channels : [user?.default_fulfillment_channel || 'Seller Fulfilled'];
  }, [user?.default_fulfillment_channel, user?.fulfillment_channels]);

  useEffect(() => {
    setProducts(props.sellerProducts || []);
    setCategories(props.categories || []);
    setWarehouses(props.sellerWarehouses || []);
    if (Array.isArray(props.brands)) setBrands(props.brands);
    setLoading(false);
    setFormSuccess(props.flash?.success || '');
    if (props.flash?.error) setFormError(props.flash.error);
  }, [props.brands, props.categories, props.flash, props.sellerProducts, props.sellerWarehouses]);

  useEffect(() => {
    if (activeEditorSection === 'variations' && form.inventoryType !== 'variable') {
      setActiveEditorSection('overview');
    }
  }, [activeEditorSection, form.inventoryType]);

  useEffect(() => {
    if (Array.isArray(props.brands) && props.brands.length > 0) return undefined;

    let isMounted = true;

    fetch('/api/brands', {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Brand list could not be loaded.');
        return response.json();
      })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setBrands(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [props.brands]);

  useEffect(() => {
    if (!isBrandDrawerOpen) {
      setBrandForm({ name: '', logo: '' });
      setBrandError('');
      setBrandSubmitting(false);
    }
  }, [isBrandDrawerOpen]);

  useEffect(() => {
    if (!showColumnMenu && !showFilters) return undefined;

    const handleCatalogPanelClick = (event) => {
      if (catalogToolbarRef.current && !catalogToolbarRef.current.contains(event.target)) {
        setShowColumnMenu(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleCatalogPanelClick);
    return () => document.removeEventListener('mousedown', handleCatalogPanelClick);
  }, [showColumnMenu, showFilters]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildNextItemCode = () => {
    const existingIds = (props.sellerProducts || [])
      .map((product) => Number(product?.id))
      .filter((value) => Number.isFinite(value));
    const nextId = (existingIds.length > 0 ? Math.max(...existingIds) : 0) + 1;
    return `MYS-${String(nextId).padStart(8, '0')}`;
  };

  const openFreshCreateForm = () => {
    setEditId(null);
    setItemCodeAutoGenerated(true);
    setForm({
      ...defaultForm(user),
      item_code: buildNextItemCode(),
    });
    setFormError('');
    setShowAdvancedOptions(true);
    setActiveEditorSection('general');
    setShowForm(true);
  };

  const setListField = (field, index, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const buildCategoryTree = (list) => {
    const map = {};
    const tree = [];
    list.forEach((category) => {
      map[category.id] = { ...category, children: [] };
    });
    list.forEach((category) => {
      if (category.parent_id && map[category.parent_id]) {
        map[category.parent_id].children.push(map[category.id]);
      } else {
        tree.push(map[category.id]);
      }
    });
    return tree;
  };

  const handleCatCheckbox = (id) => {
    setForm((prev) => ({
      ...prev,
      selectedCats: prev.selectedCats.includes(id)
        ? prev.selectedCats.filter((catId) => catId !== id)
        : [...prev.selectedCats, id],
    }));
  };

  const renderCategoryTree = (nodes, depth = 0) => nodes.map((node) => (
    <React.Fragment key={node.id}>
      <label className={`cat-checkbox-item body-md depth-${depth}`} style={{ paddingLeft: `${depth * 16}px` }}>
        <input type="checkbox" checked={form.selectedCats.includes(node.id)} onChange={() => handleCatCheckbox(node.id)} />
        {node.name}
      </label>
      {node.children?.length > 0 && renderCategoryTree(node.children, depth + 1)}
    </React.Fragment>
  ));

  const openCreate = () => {
    setFormSuccess('');
    openFreshCreateForm();
  };

  const openEdit = (prod) => {
    setLoading(true);
    const fullProd = props.sellerProducts?.find((item) => item.id === prod.id) || prod;
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
      target_gender: fullProd.target_gender || '',
      recommended_age: fullProd.recommended_age || '',
      condition: fullProd.condition || 'new',
      fulfillment_channel: fullProd.fulfillment_channel || user?.default_fulfillment_channel || '',
      regular_price: fullProd.regular_price || '',
      sale_price: fullProd.sale_price || '',
      sku: fullProd.sku || '',
      parent_sku_id: fullProd.parent_sku_id || '',
      manage_stock: !!fullProd.manage_stock,
      stock_quantity: fullProd.stock_quantity || 0,
      selectedCats: fullProd.categories?.map((category) => category.id) || [],
      warehouse_id: mainWarehouse?.id || '',
      warehouse_qty: mainWarehouse?.pivot?.quantity || 0,
      bin_location: mainWarehouse?.pivot?.bin_location || '',
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
      size_chart: { needed: !!fullProd.size_chart, image_url: fullProd.size_chart?.image_url || '', notes: fullProd.size_chart?.notes || '' },
      safety_compliance: { ...defaultSafety, ...(fullProd.safety_compliance || {}) },
      seo_search_terms: listFrom(fullProd.seo_search_terms),
      whats_inside_box: listFrom(fullProd.whats_inside_box),
      menu_order: fullProd.menu_order || 0,
      inventoryType: fullProd.type || 'simple',
      attributesList: fullProd.attributes || [],
      variationsList: fullProd.variations?.map((variation) => ({
        id: variation.id,
        attributes: variation.attributes || {},
        regular_price: variation.regular_price || '',
        sale_price: variation.sale_price || '',
        sku: variation.sku || '',
        manage_stock: !!variation.manage_stock,
        stock_quantity: variation.stock_quantity || 0,
      })) || [],
      groupedProductIds: Array.isArray(fullProd.grouped_product_ids) ? fullProd.grouped_product_ids.map((id) => String(id)) : [],
      externalUrl: fullProd.external_url || '',
      externalButtonText: fullProd.external_button_text || '',
    });
    setFormError('');
    setFormSuccess('');
    setItemCodeAutoGenerated(false);
    setShowAdvancedOptions(true);
    setActiveEditorSection('overview');
    setShowForm(true);
    setLoading(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    router.delete(`/products/${id}`, {
      preserveScroll: true,
      preserveState: false,
      only: ['sellerProducts', 'categories', 'sellerWarehouses', 'flash'],
    });
  };

  const updateArrayField = (field, index, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const addArrayField = (field, value = '') => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], value] }));
  };

  const removeArrayField = (field, index) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, itemIndex) => itemIndex !== index) }));
  };

  const uploadMediaFile = async (file) => {
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
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: payload,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Upload failed.');

      const url = data?.url || '';
      if (url) {
        setField('featured_image', url);
      }
    } catch (error) {
      setMediaUploadError(error.message || 'Upload failed.');
    } finally {
      setMediaUploading(false);
    }
  };

  const addSpecification = () => {
    setForm((prev) => ({
      ...prev,
      bullet_points: [...(Array.isArray(prev.bullet_points) ? prev.bullet_points : []), { title: '', value: '' }],
    }));
  };

  const updateSpecification = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      bullet_points: (Array.isArray(prev.bullet_points) ? prev.bullet_points : []).map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const removeSpecification = (index) => {
    setForm((prev) => ({
      ...prev,
      bullet_points: (Array.isArray(prev.bullet_points) ? prev.bullet_points : []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addVariation = () => {
    const initialAttrs = {};
    form.attributesList.forEach((attr) => {
      if (attr.name?.trim()) initialAttrs[attr.name.trim()] = '';
    });

    setField('variationsList', [
      ...form.variationsList,
      {
        id: null,
        attributes: initialAttrs,
        regular_price: form.regular_price || '',
        sale_price: '',
        sku: '',
        manage_stock: true,
        stock_quantity: 0,
      },
    ]);
  };

  const submitBrand = async (event) => {
    event.preventDefault();
    setBrandError('');

    if (!brandForm.name.trim()) {
      setBrandError('Brand name is required.');
      return;
    }

    setBrandSubmitting(true);

    try {
      const response = await fetch('/brands', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: brandForm.name.trim(),
          logo: brandForm.logo.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.errors
          ? Object.values(data.errors).flat()[0]
          : data?.message || 'Brand could not be created.';
        throw new Error(message);
      }

      setBrands((current) => {
        const next = Array.isArray(current) ? [...current] : [];
        if (!next.some((brand) => String(brand.id) === String(data.id))) {
          next.push(data);
        }
        return next;
      });
      setField('brand_id', String(data.id));
      setIsBrandDrawerOpen(false);
    } catch (error) {
      setBrandError(error.message || 'Brand could not be created.');
    } finally {
      setBrandSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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

    const cleanedAttributes = form.attributesList
      .filter((attr) => attr.name?.trim())
      .map((attr) => ({
        name: attr.name.trim(),
        options: typeof attr.options === 'string'
          ? attr.options.split(',').map((option) => option.trim()).filter(Boolean)
          : (attr.options || []),
      }))
      .filter((attr) => attr.options.length > 0);

    const normalizedType = form.inventoryType === 'service' ? 'simple' : form.inventoryType;

    const payload = {
      name: form.name.trim(),
      description: form.description,
      mystore_product_id: editId || !itemCodeAutoGenerated ? form.item_code.trim() || null : null,
      status: form.is_active ? 'published' : 'draft',
      hsn_sac_code: form.hsn_sac_code,
      gtin_upc_ean: form.gtin_upc_ean,
      is_taxable: form.is_taxable,
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
      bullet_points: form.bullet_points.filter((bullet) => bullet.title?.trim() || bullet.value?.trim()),
      size_chart: form.size_chart.needed ? { image_url: form.size_chart.image_url, notes: form.size_chart.notes } : null,
      safety_compliance: form.safety_compliance,
      seo_search_terms: cleanList(form.seo_search_terms),
      whats_inside_box: cleanList(form.whats_inside_box),
      menu_order: parseInt(form.menu_order, 10) || 0,
      type: normalizedType,
      grouped_product_ids: normalizedType === 'grouped'
        ? form.groupedProductIds.map((id) => parseInt(id, 10)).filter(Boolean)
        : [],
      external_url: normalizedType === 'external' ? form.externalUrl.trim() : null,
      external_button_text: normalizedType === 'external' ? form.externalButtonText.trim() || 'Buy on partner site' : null,
      attributes: normalizedType === 'variable' ? cleanedAttributes : null,
      variations: normalizedType === 'variable'
        ? form.variationsList.map((variation) => ({
          ...variation,
          regular_price: parseFloat(variation.regular_price),
          sale_price: variation.sale_price ? parseFloat(variation.sale_price) : null,
          stock_quantity: parseInt(variation.stock_quantity, 10) || 0,
        }))
        : null,
    };

    setLoading(true);

    const options = {
      preserveScroll: true,
      preserveState: submitMode === 'addAnother',
      only: ['sellerProducts', 'categories', 'sellerWarehouses', 'flash'],
      onSuccess: () => {
        setFormSuccess(editId ? 'Product updated successfully!' : 'Product created successfully!');
        if (submitMode === 'addAnother' && !editId) {
          openFreshCreateForm();
          return;
        }
        setShowForm(false);
      },
      onError: (errors) => setFormError(Object.values(errors)[0] || 'An error occurred.'),
      onFinish: () => setLoading(false),
    };

    if (editId) {
      router.put(`/products/${editId}`, payload, options);
      return;
    }

    router.post('/products', payload, options);
  };

  const sellerLocked = user && !user.email_verified_at;

  const formatMoney = (value) => {
    const amount = Number.parseFloat(value);
    return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : '$0.00';
  };

  const inventoryTypeLabel = (type) => {
    const match = PRODUCT_TYPE_OPTIONS.find(([value]) => value === type);
    return match ? match[1] : 'Simple product';
  };

  const renderPrice = (row) => {
    if (row.sale_price) {
      return (
        <>
          <span className="table-price-sale">{formatMoney(row.sale_price)}</span>
          <span className="table-price-old">{formatMoney(row.regular_price)}</span>
        </>
      );
    }
    return <span>{formatMoney(row.regular_price)}</span>;
  };

  const getStockLabel = (row) => (row.stock_quantity > 0 ? `${row.stock_quantity} available` : 'Out of Stock');
  const activeProductsCount = products.filter((product) => product.status === 'published').length;
  const serviceProductsCount = products.filter((product) => product.type === 'service').length;
  const standardProductsCount = products.filter((product) => product.type !== 'service').length;
  const visibleCatalogColumnEntries = [
    ['type', 'Type'],
    ['price', 'Price'],
    ['qty', 'Quantity'],
    ['tax', 'Tax'],
    ['status', 'Status'],
  ];
  const filteredProducts = products.filter((product) => {
    const query = catalogSearch.trim().toLowerCase();
    const haystack = [
      product.name,
      product.sku,
      product.mystore_product_id,
      product.product_type,
      product.brand?.name,
    ].join(' ').toLowerCase();
    const matchesSearch = !query || haystack.includes(query);

    const matchesCategory = catalogFilters.category === 'all'
      || product.categories?.some((category) => String(category.id) === catalogFilters.category);

    const normalizedType = product.type === 'service' ? 'service' : 'product';
    const matchesType = catalogFilters.type === 'all' || normalizedType === catalogFilters.type;
    const matchesStatus = catalogFilters.status === 'all' || product.status === catalogFilters.status;

    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });
  const activeFilterCount = Object.values(catalogFilters).filter((value) => value !== 'all').length;
  const visibleCatalogColumnsCount = Object.values(visibleCatalogColumns).filter(Boolean).length;
  const tableColumnTemplate = [
    '34px',
    'minmax(260px, 2.4fr)',
    visibleCatalogColumns.type ? '116px' : null,
    visibleCatalogColumns.price ? '128px' : null,
    visibleCatalogColumns.qty ? '96px' : null,
    visibleCatalogColumns.tax ? '92px' : null,
    visibleCatalogColumns.status ? '110px' : null,
    '118px',
  ].filter(Boolean).join(' ');
  const emptyCatalogMessage = (
    <div className="empty-catalog-message np-products-empty-state">
      <PackageOpen size={32} className="empty-catalog-icon" />
      <h4>No items found</h4>
      <p>Try changing the search, filters, or create a new item to start filling this catalog.</p>
    </div>
  );

  const renderTextListEditor = (field, label, placeholder) => (
    <div className="catalog-field-group">
      <label className="input-label label-md">{label}</label>
      <div className="dynamic-list">
        {form[field].map((item, index) => (
          <div className="dynamic-row" key={`${field}-${index}`}>
            <input className="input-field" value={item} placeholder={placeholder} onChange={(event) => updateArrayField(field, index, event.target.value)} />
            <Button type="button" variant="ghost" className="catalog-icon-button" onClick={() => removeArrayField(field, index)}><X size={15} /></Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={() => addArrayField(field)}>
        <Plus size={14} /> Add
      </Button>
    </div>
  );

  const availableGroupedProducts = products.filter((product) => product.id !== editId);
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => map.set(category.id, category));
    return map;
  }, [categories]);
  const editorSections = [
    { id: 'general', label: 'General', icon: Tag },
    { id: 'attributes', label: 'Attributes', icon: LayoutGrid },
    { id: 'pricing', label: 'Pricing & Channels', icon: CircleDollarSign },
    { id: 'manufacturing', label: 'Purchasing & Manufacturing', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory & Logistics', icon: Box },
    { id: 'media', label: 'Media & Notes', icon: Image },
  ];
  const selectedCategories = form.selectedCats
    .map((id) => categoryMap.get(id))
    .filter(Boolean);
  const summaryPriceLabel = form.inventoryType === 'external'
    ? 'External listing'
    : `$${Number.parseFloat(form.sale_price || form.regular_price || 0).toFixed(2)}`;
  const summaryType = inventoryTypeLabel(form.inventoryType);
  const progressPercent = 38;
  const attributeCount = form.attributesList.filter((attr) => attr.name?.trim()).length;
  const visibleSection = editorSections.some((section) => section.id === activeEditorSection)
    ? activeEditorSection
    : 'general';
  const specificationRows = Array.isArray(form.bullet_points) ? form.bullet_points : [];
  const productTypeNotes = {
    simple: 'No variants. Best for a single SKU.',
    grouped: 'Bundle related products into one listing.',
    external: 'Send buyers to a partner or affiliate URL.',
    variable: 'Build sizes, colors, or other options.',
  };
  const isElectronicsSelection = selectedCategories.some((category) => {
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

  const buildPreviewAttributes = () => form.attributesList
    .filter((attr) => attr.name?.trim())
    .map((attr) => ({
      name: attr.name.trim(),
      options: typeof attr.options === 'string'
        ? attr.options.split(',').map((option) => option.trim()).filter(Boolean)
        : (attr.options || []),
    }))
    .filter((attr) => attr.options.length > 0);

  const buildDraftPreviewProduct = () => {
    const groupedIds = form.groupedProductIds.map((id) => parseInt(id, 10)).filter(Boolean);
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
      bullet_points: form.bullet_points.filter((bullet) => bullet.title?.trim() || bullet.value?.trim()),
      size_chart: form.size_chart.needed ? { image_url: form.size_chart.image_url, notes: form.size_chart.notes } : null,
      safety_compliance: form.safety_compliance,
      seo_search_terms: cleanList(form.seo_search_terms),
      whats_inside_box: cleanList(form.whats_inside_box),
      type: form.inventoryType,
      attributes,
      variations: form.inventoryType === 'variable'
        ? form.variationsList.map((variation, index) => ({
          ...variation,
          id: variation.id || `draft-variation-${index}`,
          regular_price: variation.regular_price ? parseFloat(variation.regular_price) : 0,
          sale_price: variation.sale_price ? parseFloat(variation.sale_price) : null,
          stock_quantity: parseInt(variation.stock_quantity, 10) || 0,
        }))
        : [],
      grouped_products: form.inventoryType === 'grouped'
        ? products.filter((product) => groupedIds.includes(product.id))
        : [],
      external_url: form.inventoryType === 'external' ? form.externalUrl.trim() : null,
      external_button_text: form.inventoryType === 'external' ? form.externalButtonText.trim() || 'Buy on partner site' : null,
      brand: { name: user?.brand_name || user?.name || 'Your store' },
      user: { name: user?.name || 'Seller', brand_name: user?.brand_name || user?.name || 'Your store' },
      categories: selectedCategories,
    };
  };

  const openPreviewWindow = (url) => {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      setFormError('Please allow pop-ups to open the product preview.');
    }
  };

  const openDraftPreview = () => {
    try {
      const key = `seller-product-preview-${user?.id || 'seller'}-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify({
        product: buildDraftPreviewProduct(),
        productReviews: [],
        averageRating: 0,
        totalReviews: 0,
      }));
      openPreviewWindow(`/seller/products/preview-draft?key=${encodeURIComponent(key)}`);
    } catch (error) {
      setFormError('Could not prepare the product preview in this browser.');
    }
  };

  const openSavedPreview = (productId) => {
    openPreviewWindow(`/seller/products/${productId}/preview`);
  };

  const updateInventoryType = (value) => {
    setForm((prev) => ({
      ...prev,
      inventoryType: value,
      attributesList: value === 'variable' ? prev.attributesList : [],
      variationsList: value === 'variable' ? prev.variationsList : [],
      groupedProductIds: value === 'grouped' ? prev.groupedProductIds : [],
      externalUrl: value === 'external' ? prev.externalUrl : '',
      externalButtonText: value === 'external' ? prev.externalButtonText : '',
      parent_sku_id: value === 'variable' ? prev.parent_sku_id : '',
    }));
  };

  return (
    <div className="seller-dashboard-layout">
      <Sidebar />

      <div className="seller-dashboard-content animate-fade-in">
        <div className={`seller-dashboard-container container seller-products-page ${showForm ? 'product-editor-open' : ''}`}>
          <div className="seller-page-header">
            <div className="seller-page-title-block seller-products-title-block">
              <h2 className="headline-lg">Product Catalog</h2>
              <p className="body-md" style={{ color: 'var(--color-outline)' }}>
               Build product catalogs
              </p>
            </div>
            {!showForm && (
              <Button variant="primary" className="seller-add-product-btn" onClick={openCreate} disabled={sellerLocked}>
                <Plus size={16} style={{ marginRight: 6 }} /> Add New Product
              </Button>
            )}
          </div>

          {user && !user.email_verified_at && (
            <div className="form-alert form-alert-error body-md" style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <AlertTriangle size={18} style={{ marginRight: 8 }} />
              <span><strong>Email Verification Required:</strong> Please verify your email address to add, edit or manage products. <Link href="/seller/profile" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Verify email now</Link>.</span>
            </div>
          )}

          {showForm ? (
            <div className="product-form-card new-product-redesign">
                {formError && <div className="form-alert form-alert-error body-md">{formError}</div>}
                {formSuccess && <div className="form-alert form-alert-success body-md">{formSuccess}</div>}

                <form ref={formRef} onSubmit={handleSubmit}>
                  {/* Top Bar Navigation */}
                  <div className="np-header-bar">
                    <div className="np-title-block">
                      <h2 className="headline-lg">{editId ? 'Edit Item' : 'Add Item'}</h2>
                      <p className="body-md text-muted">Create a product or service for your catalog <span className="text-warning">* Unsaved changes</span></p>
                    </div>
                    <div className="np-header-actions">
                      <Button variant="outline" type="button" onClick={() => setShowForm(false)} className="np-back-btn">
                        &larr; Back
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        className="np-save-another-btn"
                        onClick={() => {
                          setSubmitMode('addAnother');
                          formRef.current?.requestSubmit();
                        }}
                      >
                        Save & add another
                      </Button>
                      <Button type="submit" disabled={loading} className="np-save-btn primary" onClick={() => setSubmitMode('close')}>
                        + {editId ? 'Update Item' : 'Create Item'}
                      </Button>
                    </div>
                  </div>

                  {/* Horizontal Tabs & Progress */}
                  <div className="np-nav-container">
                    <div className="np-tabs">
                      {editorSections.map((section, index) => {
                        const isActive = visibleSection === section.id;
                        const Icon = section.icon;
                        return (
                          <button
                          type="button"
                            key={section.id}
                            className={`np-tab-btn ${isActive ? 'is-active' : ''}`}
                            onClick={() => setActiveEditorSection(section.id)}
                          >
                            <span className={`np-tab-number ${isActive ? 'is-active' : ''}`}>{index + 1}</span>
                            <Icon size={14} className="np-tab-icon" />
                            <span className="np-tab-label">{section.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="np-progress-wrapper">
                      <div className="np-progress-labels">
                        <span>Setup progress</span>
                        <span>{progressPercent}% complete</span>
                      </div>
                      <div className="np-progress-bar-bg">
                        <div className="np-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid: Left Main Content / Right Sidebar */}
                  <div className="np-main-grid">
                    <div className="np-left-column">
                      {visibleSection === 'general' && (
                        <Card className="np-card np-card-shadow">
                          <div className="np-card-header-icon">
                            <Box size={20} className="np-card-header-icon-svg" />
                            <div>
                              <h3 className="np-card-title">Basic Information</h3>
                              <p className="np-card-subtitle">Core identity of this item in your catalog.</p>
                            </div>
                          </div>

                          <div className="np-form-row np-general-top-row">
                            <div className="input-container">
                              <label className="input-label label-md">Type <span className="text-danger">*</span></label>
                              <div className="np-radio-group np-inline-radio-group">
                                <label className={`np-radio-btn np-radio-btn-compact ${form.inventoryType !== 'service' ? 'active' : ''}`}>
                                  <input type="radio" name="item_type" value="simple" checked={form.inventoryType !== 'service'} onChange={() => updateInventoryType('simple')} />
                                  <span className="np-radio-circle"></span>
                                  Product
                                </label>
                                <label className={`np-radio-btn np-radio-btn-compact ${form.inventoryType === 'service' ? 'active' : ''}`}>
                                  <input type="radio" name="item_type" value="service" checked={form.inventoryType === 'service'} onChange={() => updateInventoryType('service')} />
                                  <span className="np-radio-circle"></span>
                                  Service
                                </label>
                              </div>
                            </div>
                            <div className="input-container">
                              <label className="input-label label-md">Item Code <span className="text-danger">*</span></label>
                              <input className="input-field" type="text" placeholder="MYS-00000001" value={form.item_code} onChange={(e) => setField('item_code', e.target.value)} />
                              <div className="input-help-text">Auto-generated, editable</div>
                            </div>
                            <div className="input-container">
                              <label className="input-label label-md">Item Name <span className="text-danger">*</span></label>
                              <input className="input-field" type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
                            </div>
                          </div>

                          <div className="np-form-row three-cols-general">
                            <div className="input-container">
                              <label className="input-label label-md">HSN/SAC Code</label>
                              <input className="input-field" type="text" value={form.hsn_sac_code} onChange={(e) => setField('hsn_sac_code', e.target.value)} />
                            </div>
                            <div className="input-container">
                              <label className="input-label label-md np-inline-label">SKU <HelpCircle size={14} className="text-muted"/></label>
                              <input className="input-field" type="text" placeholder="SKU" value={form.sku} onChange={(e) => setField('sku', e.target.value)} />
                            </div>
                            <div className="input-container">
                              <label className="input-label label-md np-inline-label">GTIN, UPC, EAN, or ISBN <HelpCircle size={14} className="text-muted"/></label>
                              <input className="input-field" type="text" value={form.gtin_upc_ean} onChange={(e) => setField('gtin_upc_ean', e.target.value)} />
                            </div>
                          </div>

                          <div className="input-container">
                            <label className="input-label label-md">Long Description</label>
                            <textarea className="input-field np-textarea" rows="6" placeholder="Write a detailed product description..." value={form.description} onChange={(e) => setField('description', e.target.value)}></textarea>
                          </div>

                          <button
                            type="button"
                            className={`np-advanced-options-toggle ${showAdvancedOptions ? 'is-open' : ''}`}
                            onClick={() => setShowAdvancedOptions((current) => !current)}
                            aria-expanded={showAdvancedOptions}
                          >
                            <span className="text-muted body-sm np-advanced-options-copy"><ListPlus size={14} /> Advanced options <ChevronRight size={14} className="np-advanced-options-icon" /></span>
                          </button>

                          {showAdvancedOptions && (
                            <div className="np-secondary-panel">
                              <div className="input-container">
                                <label className="input-label label-md">Short Description</label>
                                <textarea className="input-field np-short-textarea" rows="3" placeholder="A brief summary shown in listings and search results." value={form.short_description} onChange={(e) => setField('short_description', e.target.value)}></textarea>
                              </div>

                              <div className="np-specifications-block">
                                <div className="np-specifications-head">
                                  <div className="np-subsection-head">
                                    <h4>Product Specifications</h4>
                                    <p>Add structured details such as Material, Warranty or Dimensions.</p>
                                  </div>
                                  {specificationRows.length > 0 && (
                                    <Button type="button" variant="outline" className="np-spec-add-btn" onClick={addSpecification}>
                                      <Plus size={14} />
                                      Add specification
                                    </Button>
                                  )}
                                </div>
                                {specificationRows.length > 0 ? (
                                  <div className="np-specifications-table-wrap">
                                    <table className="np-specifications-table">
                                      <thead>
                                        <tr>
                                          <th>#</th>
                                          <th>Specification</th>
                                          <th>Value</th>
                                          <th aria-label="Actions"></th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {specificationRows.map((specification, index) => (
                                          <tr key={`specification-${index}`}>
                                            <td>{index + 1}</td>
                                            <td>
                                              <input
                                                className="input-field np-spec-input"
                                                type="text"
                                                placeholder="e.g. Material"
                                                value={specification.title || ''}
                                                onChange={(e) => updateSpecification(index, 'title', e.target.value)}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                className="input-field np-spec-input"
                                                type="text"
                                                placeholder="e.g. 100% Cotton"
                                                value={specification.value || ''}
                                                onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                                              />
                                            </td>
                                            <td>
                                              <button type="button" className="np-spec-delete-btn" onClick={() => removeSpecification(index)} aria-label={`Remove specification ${index + 1}`}>
                                                <Trash size={14} />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <button type="button" className="np-specifications-empty" onClick={addSpecification}>
                                    <Plus size={14} />
                                    Add your first specification
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      )}

                      {visibleSection === 'attributes' && (
                        <Card className="np-card np-card-shadow">
                          <div className="np-card-header-icon">
                            <LayoutGrid size={20} className="np-card-header-icon-svg" />
                            <div>
                              <h3 className="np-card-title">{form.inventoryType === 'service' ? 'Service Attributes' : 'Product Structure'}</h3>
                              <p className="np-card-subtitle">
                                {form.inventoryType === 'service'
                                  ? 'Attach reusable service attributes without generating stock variants.'
                                  : 'Sell this as a single item or with multiple variants.'}
                              </p>
                            </div>
                          </div>

                          {form.inventoryType !== 'service' && (
                            <div className="np-radio-group block-group" style={{marginTop: 15, marginBottom: 20}}>
                              <label className={`np-radio-btn block-btn ${form.inventoryType !== 'variable' ? 'active' : ''}`} style={{flex: 1}}>
                                <input type="radio" name="structure_type" value="simple" checked={form.inventoryType !== 'variable'} onChange={() => updateInventoryType('simple')} />
                                <span className="np-radio-circle"></span>
                                Simple Product
                              </label>
                              <label className={`np-radio-btn block-btn ${form.inventoryType === 'variable' ? 'active' : ''}`} style={{flex: 1}}>
                                <input type="radio" name="structure_type" value="variable" checked={form.inventoryType === 'variable'} onChange={() => updateInventoryType('variable')} />
                                <span className="np-radio-circle"></span>
                                Variable Product
                              </label>
                            </div>
                          )}

                          {(form.inventoryType === 'service' || form.inventoryType === 'variable') && (
                            <div className="np-options-section">
                              <div className="np-section-header">
                                <div>
                                  <h4>Options</h4>
                                  <p className="body-sm text-muted">Add options like Size or Colour. Every combination of values becomes a variant.</p>
                                </div>
                                <span className="np-section-count">{attributeCount} option(s)</span>
                              </div>
                              <div className="np-options-builder">
                                <p className="text-center text-muted body-sm" style={{margin:'20px 0'}}>No options yet. Add one below to start building variants.</p>
                                <div className="np-options-add-row">
                                  <select className="input-field" style={{flex: 1}}><option>Add an option...</option></select>
                                  <Button variant="outline" className="np-add-attribute-btn"><Plus size={14}/> New attribute</Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {form.inventoryType === 'variable' && (
                            <div className="np-variants-section">
                              <div className="np-section-header">
                                <div>
                                  <h4>Variants</h4>
                                  <p className="body-sm text-muted">Generate variants from your options, then edit each one inline.</p>
                                </div>
                                <Button type="button" className="np-generate-btn"><Plus size={14}/> Generate Variants</Button>
                              </div>
                              <div className="np-variants-empty">
                                <LayoutGrid size={32} className="text-muted" style={{opacity: 0.5, marginBottom: 8}}/>
                                <h5 style={{margin: '0 0 5px'}}>No variants yet</h5>
                                <p className="body-sm text-muted" style={{margin: 0}}>Add options with values above, then generate variants.</p>
                              </div>
                            </div>
                          )}
                        </Card>
                      )}
                      
                      {visibleSection === 'pricing' && (
                        <>
                          <Card className="np-card np-card-shadow">
                            <div className="np-card-header-icon">
                              <CircleDollarSign size={20} className="np-card-header-icon-svg" />
                              <div>
                                <h3 className="np-card-title">Pricing</h3>
                                <p className="np-card-subtitle">Set selling price, cost, margin, taxes and the selling unit.</p>
                              </div>
                            </div>
                            <div className="np-form-row three-cols-pricing" style={{marginTop: 15}}>
                              <div className="input-container">
                                <label className="input-label label-md">Selling Price <span className="text-danger">*</span></label>
                                <div className="input-with-prefix">
                                  <span className="input-prefix">$</span>
                                  <input className="input-field" type="number" step="0.01" value={form.regular_price} onChange={(e) => setField('regular_price', e.target.value)} />
                                </div>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">MRP</label>
                                <div className="input-with-prefix">
                                  <span className="input-prefix">$</span>
                                  <input className="input-field" type="number" step="0.01" value={form.sale_price} onChange={(e) => setField('sale_price', e.target.value)} />
                                </div>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Cost Price</label>
                                <div className="input-with-prefix">
                                  <span className="input-prefix">$</span>
                                  <input className="input-field" type="number" step="0.01" value={form.cost_price} onChange={(e) => setField('cost_price', e.target.value)} />
                                </div>
                              </div>
                            </div>
                            <div className="np-form-row three-cols-pricing">
                              <div className="input-container">
                                <label className="input-label label-md">Margin %</label>
                                <div className="input-with-suffix">
                                  <input className="input-field" type="number" value={form.margin_percent} onChange={(e) => setField('margin_percent', e.target.value)} />
                                  <span className="input-suffix">%</span>
                                </div>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Discount (%)</label>
                                <div className="input-with-suffix">
                                  <input className="input-field" type="number" value={form.discount_percent} onChange={(e) => setField('discount_percent', e.target.value)} />
                                  <span className="input-suffix">%</span>
                                </div>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Unit <span className="text-danger">*</span></label>
                                <select className="input-field" value={form.unit_label} onChange={(e) => setField('unit_label', e.target.value)}>
                                  <option>Hourly (Hour)</option>
                                </select>
                              </div>
                            </div>
                            <div className="np-form-row two-cols">
                              <div className="input-container">
                                <label className="input-label label-md">Taxes</label>
                                <select className="input-field"><option>Select taxes</option></select>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Price Tax Mode</label>
                                <select className="input-field" value={form.price_tax_mode} onChange={(e) => setField('price_tax_mode', e.target.value)}><option>Inclusive</option><option>Exclusive</option></select>
                              </div>
                            </div>
                          </Card>

                          <Card className="np-card np-card-shadow" style={{marginTop: 20}}>
                            <div className="np-card-header-icon">
                              <Warehouse size={20} className="np-card-header-icon-svg" />
                              <div>
                                <h3 className="np-card-title">Sales Channels</h3>
                                <p className="np-card-subtitle">Enable connected channels, map warehouse and price list, and override channel pricing when needed.</p>
                              </div>
                            </div>
                            
                            <div className="np-channel-row">
                              <div className="np-channel-info">
                                <h4 style={{margin: '0 0 4px', fontSize: 14}}>MyStore</h4>
                                <p className="body-sm text-muted" style={{margin: 0}}>Channel</p>
                              </div>
                              <div className="np-channel-toggles">
                                <div className="np-toggle-item">
                                  <span className="body-sm">Enabled</span>
                                  <label className="np-toggle-switch" style={{margin:0}}><input type="checkbox" checked={form.channel_enabled} onChange={(e) => setField('channel_enabled', e.target.checked)} /><span className="np-slider"></span></label>
                                </div>
                                <div className="np-toggle-item">
                                  <span className="body-sm">Sync Price</span>
                                  <label className="np-toggle-switch" style={{margin:0}}><input type="checkbox" checked={form.channel_sync_price} onChange={(e) => setField('channel_sync_price', e.target.checked)} /><span className="np-slider"></span></label>
                                </div>
                                <div className="np-toggle-item">
                                  <span className="body-sm">Sync Stock</span>
                                  <label className="np-toggle-switch" style={{margin:0}}><input type="checkbox" checked={form.channel_sync_stock} onChange={(e) => setField('channel_sync_stock', e.target.checked)} /><span className="np-slider black"></span></label>
                                </div>
                                <div className="np-toggle-item">
                                  <span className="body-sm">Allow Backorders</span>
                                  <label className="np-toggle-switch" style={{margin:0}}><input type="checkbox" checked={form.channel_allow_backorders} onChange={(e) => setField('channel_allow_backorders', e.target.checked)} /><span className="np-slider"></span></label>
                                </div>
                              </div>
                            </div>
                            
                            <div className="np-form-row four-cols">
                              <div className="input-container">
                                <label className="input-label label-md">Default Warehouse</label>
                                <select className="input-field"><option>Select an option</option></select>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Price List</label>
                                <select className="input-field"><option>Select an option</option></select>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Channel Selling Price</label>
                                <div className="input-with-prefix">
                                  <span className="input-prefix">$</span>
                                  <input className="input-field" type="number" />
                                </div>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Channel MRP</label>
                                <div className="input-with-prefix">
                                  <span className="input-prefix">$</span>
                                  <input className="input-field" type="number" />
                                </div>
                              </div>
                            </div>
                            <div className="np-form-row">
                              <div className="input-container" style={{maxWidth: '200px'}}>
                                <label className="input-label label-md">Stock Buffer</label>
                                <input className="input-field" type="number" />
                              </div>
                            </div>
                            <div className="np-channel-footer-toggle">
                              <span className="body-sm">Use Channel Price</span>
                              <label className="np-toggle-switch" style={{margin:0}}>
                                <input type="checkbox" checked={form.use_channel_price} onChange={(e) => setField('use_channel_price', e.target.checked)} />
                                <span className="np-slider"></span>
                              </label>
                            </div>
                          </Card>

                          <Card className="np-card np-card-shadow" style={{marginTop: 20}}>
                            <div className="np-card-header-icon">
                              <Tag size={20} className="np-card-header-icon-svg" />
                              <div>
                                <h3 className="np-card-title">OMS & Storefront</h3>
                                <p className="np-card-subtitle">Search visibility, returns policy and product recommendations.</p>
                              </div>
                            </div>
                            
                            <div className="np-form-row seo-row np-seo-row" style={{alignItems: 'flex-start', marginTop: 15}}>
                              <div className="input-container" style={{flex: 1, margin: 0}}>
                                <label className="input-label label-md np-inline-label" style={{justifyContent:'space-between'}}>SEO Meta Title <span className="text-muted">0/60</span></label>
                                <input className="input-field" type="text" value={form.seo_title} onChange={(e) => setField('seo_title', e.target.value)} />
                              </div>
                              <div className="np-returnable-toggle">
                                <div>
                                  <strong style={{fontSize: 14}}>Returnable</strong>
                                  <p className="body-sm text-muted" style={{margin: 0}}>Controls whether return workflows are allowed for this item.</p>
                                </div>
                                <label className="np-toggle-switch" style={{margin:0}}><input type="checkbox" checked={form.returnable} onChange={(e) => setField('returnable', e.target.checked)} /><span className="np-slider black"></span></label>
                              </div>
                            </div>
                            
                            <div className="input-container" style={{marginTop: 15}}>
                              <label className="input-label label-md">SEO Description</label>
                              <textarea className="input-field np-textarea np-seo-textarea" rows="4" placeholder="Write a search-friendly product summary..." value={form.seo_description} onChange={(e) => setField('seo_description', e.target.value)}></textarea>
                            </div>
                            
                            <div className="np-form-row two-cols" style={{marginTop: 15}}>
                              <div className="np-cross-sells" style={{border: '1px solid var(--color-outline)', padding: 15, borderRadius: 8}}>
                                <h4 style={{margin: '0 0 5px', fontSize: 14}}>Cross-sells</h4>
                                <p className="body-sm text-muted" style={{margin: '0 0 10px'}}>Recommend complementary products across all sales channels.</p>
                                <div className="input-with-icon">
                                  <input className="input-field" placeholder="Q Search by product name, SKU, or code..." />
                                </div>
                                <p className="text-muted body-sm" style={{marginTop: 10, marginBottom: 0}}>No cross-sell products selected yet.</p>
                              </div>
                              <div className="np-up-sells" style={{border: '1px solid var(--color-outline)', padding: 15, borderRadius: 8}}>
                                <h4 style={{margin: '0 0 5px', fontSize: 14}}>Up-sells</h4>
                                <p className="body-sm text-muted" style={{margin: '0 0 10px'}}>Recommend higher-value alternatives across all sales channels.</p>
                                <div className="input-with-icon">
                                  <input className="input-field" placeholder="Q Search by product name, SKU, or code..." />
                                </div>
                                <p className="text-muted body-sm" style={{marginTop: 10, marginBottom: 0}}>No up-sell products selected yet.</p>
                              </div>
                            </div>
                          </Card>
                        </>
                      )}

                      {visibleSection === 'manufacturing' && (
                        <Card className="np-card np-card-shadow">
                          <div className="np-card-header-icon">
                            <ShoppingCart size={20} className="np-card-header-icon-svg" />
                            <div>
                              <h3 className="np-card-title">Purchasing & Manufacturing</h3>
                              <p className="np-card-subtitle">How this item is sourced - purchased, manufactured, or both.</p>
                            </div>
                          </div>

                          <div className="np-procurement-panel">
                            <div className="input-container">
                              <label className="input-label label-md">Procurement Method</label>
                              <select className="input-field" value={form.procurement_method} onChange={(e) => setField('procurement_method', e.target.value)}>
                                <option value="buy">Buy</option>
                                <option value="make">Make</option>
                                <option value="both">Both</option>
                              </select>
                            </div>
                            <div className="np-procurement-note">
                              Choose whether this item should be purchased, manufactured, or supported by both flows.
                            </div>
                          </div>

                          <div className="np-defaults-card">
                            <div className="np-subsection-head">
                              <h4>Purchasing Defaults</h4>
                              <p>Preferred vendor item values will be saved to procurement vendor items for replenishment use.</p>
                            </div>
                            <div className="np-form-row four-cols np-defaults-grid">
                              <div className="input-container">
                                <label className="input-label label-md">Default Vendor</label>
                                <select className="input-field" value={form.default_vendor} onChange={(e) => setField('default_vendor', e.target.value)}>
                                  <option value="">Select an option</option>
                                </select>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Vendor SKU</label>
                                <input className="input-field" type="text" value={form.vendor_sku} onChange={(e) => setField('vendor_sku', e.target.value)} />
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Purchasing Lead Time (Days)</label>
                                <input className="input-field" type="number" value={form.purchasing_lead_time_days} onChange={(e) => setField('purchasing_lead_time_days', e.target.value)} />
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Minimum Order Quantity (MOQ)</label>
                                <input className="input-field" type="number" value={form.minimum_order_quantity} onChange={(e) => setField('minimum_order_quantity', e.target.value)} />
                              </div>
                            </div>
                          </div>
                        </Card>
                      )}

                      {visibleSection === 'inventory' && (
                        <div className="np-section-stack">
                          <Card className="np-card np-card-shadow">
                            <div className="np-card-header-icon">
                              <Box size={20} className="np-card-header-icon-svg" />
                              <div>
                                <h3 className="np-card-title">Inventory & Logistics</h3>
                                <p className="np-card-subtitle">Stock tracking, levels, valuation and warehouse handling.</p>
                              </div>
                            </div>

                            <div className="np-inventory-switch-row">
                              <div>
                                <h4 className="np-section-title-sm">Track Inventory</h4>
                                <p className="np-section-copy-sm">Maintain stock levels</p>
                              </div>
                              <label className="np-toggle-switch" style={{margin:0}}>
                                <input type="checkbox" checked={form.manage_stock} onChange={(e) => setField('manage_stock', e.target.checked)} />
                                <span className="np-slider"></span>
                              </label>
                            </div>
                          </Card>

                          <Card className="np-card np-card-shadow">
                            <div className="np-card-header-icon">
                              <Warehouse size={20} className="np-card-header-icon-svg" />
                              <div>
                                <h3 className="np-card-title">Physical Properties & Global Trade</h3>
                                <p className="np-card-subtitle">Weight, dimensions, packaging and customs details.</p>
                              </div>
                            </div>

                            <div className="np-form-row three-cols-pricing np-logistics-grid">
                              <div className="input-container">
                                <label className="input-label label-md">Weight</label>
                                <input className="input-field" type="number" value={form.weight_kg} onChange={(e) => setField('weight_kg', e.target.value)} />
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Weight Unit</label>
                                <select className="input-field" value={form.weight_unit} onChange={(e) => setField('weight_unit', e.target.value)}>
                                  <option>Kilogram (kg)</option>
                                  <option>Gram (g)</option>
                                  <option>Pound (lb)</option>
                                </select>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Length</label>
                                <input className="input-field" type="number" value={form.length_cm} onChange={(e) => setField('length_cm', e.target.value)} />
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Width</label>
                                <input className="input-field" type="number" value={form.width_cm} onChange={(e) => setField('width_cm', e.target.value)} />
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Height</label>
                                <input className="input-field" type="number" value={form.height_cm} onChange={(e) => setField('height_cm', e.target.value)} />
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Dimension Unit</label>
                                <select className="input-field" value={form.dimension_unit} onChange={(e) => setField('dimension_unit', e.target.value)}>
                                  <option>Centimeter (cm)</option>
                                  <option>Millimeter (mm)</option>
                                  <option>Inch (in)</option>
                                </select>
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Package Type</label>
                                <input className="input-field" type="text" value={form.package_type} onChange={(e) => setField('package_type', e.target.value)} />
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Shipping Class</label>
                                <input className="input-field" type="text" value={form.shipping_class} onChange={(e) => setField('shipping_class', e.target.value)} />
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">HS Code</label>
                                <input className="input-field" type="text" value={form.hsn_sac_code} onChange={(e) => setField('hsn_sac_code', e.target.value)} />
                              </div>
                              <div className="input-container">
                                <label className="input-label label-md">Country of Origin</label>
                                <select className="input-field" value={form.country_of_origin} onChange={(e) => setField('country_of_origin', e.target.value)}>
                                  <option value="">Select an option</option>
                                  <option value={user?.country || ''}>{user?.country || 'Country'}</option>
                                </select>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}

                      {visibleSection === 'media' && (
                        <div className="np-section-stack">
                          <Card className="np-card np-card-shadow">
                            <div className="np-card-header-icon">
                              <Image size={20} className="np-card-header-icon-svg" />
                              <div>
                                <h3 className="np-card-title">Item Images</h3>
                                <p className="np-card-subtitle">The first image is used as the main thumbnail. Up to 10 files.</p>
                              </div>
                            </div>

                            <label className="np-media-dropzone">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => uploadMediaFile(e.target.files?.[0])}
                              />
                              <Image size={34} className="np-media-dropzone-icon" />
                              <strong>Upload media</strong>
                              <span>Upload images or videos. Up to 10 files total.</span>
                              <small>{mediaUploading ? 'Uploading...' : '0/10 files'}</small>
                              <p>Choose one image as the primary thumbnail after upload.</p>
                            </label>
                            {mediaUploadError && <div className="np-media-error">{mediaUploadError}</div>}
                          </Card>

                          <Card className="np-card np-card-shadow">
                            <div className="np-card-header-icon">
                              <ListPlus size={20} className="np-card-header-icon-svg" />
                              <div>
                                <h3 className="np-card-title">Additional Notes</h3>
                                <p className="np-card-subtitle">Internal notes - not shown to customers.</p>
                              </div>
                            </div>
                            <textarea className="input-field np-notes-textarea" rows="9" placeholder="Internal notes not visible to customers" value={form.purchase_note} onChange={(e) => setField('purchase_note', e.target.value)}></textarea>
                          </Card>
                        </div>
                      )}
                    </div>

                    <div className="np-right-column">
                      <Card className="np-card np-preview-card np-card-shadow">
                        <div className="np-preview-header">
                          <span className="np-preview-eyebrow" style={{display: 'flex', alignItems: 'center'}}><LayoutGrid size={12} style={{marginRight: 4, opacity: 0.5}}/> LIVE PREVIEW</span>
                        </div>
                        <div className="np-preview-content">
                           <div className="np-preview-image">
                             {form.featured_image ? <img src={form.featured_image} alt="" /> : <Image size={24} style={{ color: 'var(--color-outline)', opacity: 0.3 }} />}
                           </div>
                           <div className="np-preview-details" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                             <div className="np-preview-name">{form.name || 'Untitled item'}</div>
                             <div className="np-preview-code text-muted">{form.item_code || buildNextItemCode()}</div>
                             <div className="np-preview-price text-muted" style={{marginTop: 4}}>
                               {form.sale_price || form.regular_price ? `$${form.sale_price || form.regular_price}` : 'No price set'}
                             </div>
                           </div>
                        </div>
                        <div className="np-preview-badges">
                          <span className={`np-badge ${form.is_active ? 'green' : 'draft'}`}>{form.is_active ? 'Active' : 'Draft'}</span>
                          <span className="np-badge gray">{form.inventoryType === 'service' ? 'Service' : 'Product'}</span>
                          {form.inventoryType === 'variable' && <span className="np-badge gray">Variable Product</span>}
                          {form.is_taxable && <span className="np-badge gray">Is Taxable</span>}
                        </div>
                      </Card>

                      {visibleSection === 'general' && (
                        <>
                          <Card className="np-card np-card-shadow np-sidebar-card">
                            <h3 className="np-card-title np-card-title-sm"><Tag size={16} style={{transform: 'rotate(90deg)', opacity: 0.5}}/> Classification</h3>
                             <div className="input-container" style={{marginBottom: 15}}>
                               <label className="input-label label-md">Category</label>
                               <div className="np-select-with-action">
                                 <select className="input-field" value={form.selectedCats[0] || ''} onChange={(e) => setField('selectedCats', e.target.value ? [parseInt(e.target.value, 10)] : [])}>
                                   <option value="">Select an option</option>
                                   {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                 </select>
                                 <Button type="button" variant="outline" className="np-icon-btn" onClick={() => setIsCategoryDrawerOpen(true)} aria-label="Create category">
                                   <Plus size={14}/>
                                 </Button>
                               </div>
                             </div>
                             <div className="input-container" style={{margin: 0}}>
                               <label className="input-label label-md">Brand</label>
                               <div className="np-select-with-action">
                                 <select className="input-field" value={form.brand_id} onChange={(e) => setField('brand_id', e.target.value)}>
                                   <option value="">Select an option</option>
                                   {brands.map((brand) => <option key={brand.id} value={String(brand.id)}>{brand.name}</option>)}
                                 </select>
                                 <Button type="button" variant="outline" className="np-icon-btn" onClick={() => setIsBrandDrawerOpen(true)} aria-label="Create brand">
                                   <Plus size={14}/>
                                 </Button>
                               </div>
                             </div>
                          </Card>

                          <Card className="np-card np-card-shadow np-sidebar-card">
                            <h3 className="np-card-title np-card-title-sm">Status</h3>
                            <div className="np-switch-stack">
                              <div className="np-switch-panel">
                                <div className="np-switch-label">
                                  <strong style={{display: 'block', fontSize: 13, marginBottom: 2}}>Is Taxable</strong>
                                  <span className="text-muted body-sm" style={{fontSize: 11}}>Enable tax selection</span>
                                </div>
                                <label className="np-toggle-switch" style={{margin: 0}}>
                                  <input type="checkbox" checked={form.is_taxable} onChange={(e) => setField('is_taxable', e.target.checked)} />
                                  <span className="np-slider black"></span>
                                </label>
                              </div>
                              <div className="np-switch-panel">
                                <div className="np-switch-label">
                                  <strong style={{display: 'block', fontSize: 13, marginBottom: 2}}>Sold individually</strong>
                                  <span className="text-muted body-sm" style={{fontSize: 11}}>Limit purchases to 1 item per order</span>
                                </div>
                                <label className="np-toggle-switch" style={{margin: 0}}>
                                  <input type="checkbox" checked={form.sold_individually} onChange={(e) => setField('sold_individually', e.target.checked)} />
                                  <span className="np-slider"></span>
                                </label>
                              </div>
                              <label className="np-status-check">
                                <input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
                                <span>
                                  <strong>Active</strong>
                                  <span>Item is visible and available for sale</span>
                                </span>
                              </label>
                            </div>
                          </Card>
                        </>
                      )}

                      {visibleSection === 'pricing' && (
                        <Card className="np-card np-card-shadow np-sidebar-card np-price-summary-card">
                          <h3 className="np-card-title np-card-title-sm"><CircleDollarSign size={16} style={{opacity: 0.5}}/> Price summary</h3>
                          <div className="np-summary-row">
                            <span className="text-muted" style={{fontSize: 13}}>Selling Price</span>
                            <strong style={{fontSize: 13}}>{form.regular_price ? `$${form.regular_price}` : '-'}</strong>
                          </div>
                          <div className="np-summary-row">
                            <span className="text-muted" style={{fontSize: 13}}>MRP</span>
                            <strong style={{fontSize: 13}}>{form.sale_price ? `$${form.sale_price}` : '-'}</strong>
                          </div>
                          <div className="np-summary-row">
                            <span className="text-muted" style={{fontSize: 13}}>Cost Price</span>
                            <strong style={{fontSize: 13}}>{form.cost_price ? `$${form.cost_price}` : '-'}</strong>
                          </div>
                          <div className="np-summary-row highlight">
                            <span className="text-muted" style={{fontSize: 13}}>Profit / unit</span>
                            <strong className="text-success" style={{color: 'var(--color-success)', fontSize: 13}}>-</strong>
                          </div>
                          <div className="np-summary-row">
                            <span className="text-muted" style={{fontSize: 13}}>Margin %</span>
                            <strong style={{fontSize: 13}}>{form.margin_percent ? `${form.margin_percent}%` : '-'}</strong>
                          </div>
                          <div className="np-summary-row np-summary-row-last">
                            <span className="text-muted" style={{fontSize: 13}}>Discount (%)</span>
                            <strong style={{fontSize: 13}}>{form.discount_percent ? `${form.discount_percent}%` : '-'}</strong>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                </form>
            </div>
          ) : (
            <div className="seller-products-catalog np-catalog-shell">
              <div className="np-catalog-header">
                <div>
                  <h2 className="np-catalog-title">Products</h2>
                  <p className="np-catalog-subtitle">Manage your products and services catalog</p>
                </div>
                <div className="np-catalog-header-actions">
                  <Button variant="outline" type="button" className="np-toolbar-btn"><ArrowDownToLine size={14} /> Import</Button>
                  <Button variant="outline" type="button" className="np-toolbar-btn"><ArrowUpToLine size={14} /> Export</Button>
                  <Button variant="primary" className="seller-add-product-btn" onClick={openCreate} disabled={sellerLocked}>
                    <Plus size={16} /> Add Item
                  </Button>
                </div>
              </div>

              <div className="np-stats-grid">
                <div className="np-stat-card">
                  <div className="np-stat-icon"><Box size={18} /></div>
                  <div>
                    <div className="np-stat-label">Total Products</div>
                    <div className="np-stat-value">{products.length}</div>
                  </div>
                </div>
                <div className="np-stat-card">
                  <div className="np-stat-icon green"><CheckCircle2 size={18} /></div>
                  <div>
                    <div className="np-stat-label">Active</div>
                    <div className="np-stat-value">{activeProductsCount}</div>
                  </div>
                </div>
                <div className="np-stat-card">
                  <div className="np-stat-icon purple"><PackageOpen size={18} /></div>
                  <div>
                    <div className="np-stat-label">Products</div>
                    <div className="np-stat-value">{standardProductsCount}</div>
                  </div>
                </div>
                <div className="np-stat-card">
                  <div className="np-stat-icon amber"><Wrench size={18} /></div>
                  <div>
                    <div className="np-stat-label">Services</div>
                    <div className="np-stat-value">{serviceProductsCount}</div>
                  </div>
                </div>
              </div>

              <div className="np-catalog-table-card">
                <div className="np-catalog-toolbar" ref={catalogToolbarRef}>
                  <div className="np-catalog-search">
                    <ScanSearch size={16} />
                    <input
                      type="text"
                      className="np-catalog-search-input"
                      placeholder="Search by name or code..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                    />
                  </div>
                  <div className="np-catalog-toolbar-actions">
                    <div className="np-toolbar-panel-wrap">
                      <Button
                        variant="outline"
                        type="button"
                        className={`np-toolbar-btn np-toolbar-ghost-btn ${showColumnMenu ? 'is-open' : ''}`}
                        onClick={() => {
                          setShowColumnMenu((current) => !current);
                          setShowFilters(false);
                        }}
                      >
                        <Columns3 size={14} />
                        Manage Columns
                        <span className="np-toolbar-count">{visibleCatalogColumnsCount}</span>
                      </Button>
                      {showColumnMenu && (
                        <div className="np-floating-panel np-columns-panel">
                          <div className="np-floating-panel-head">
                            <div>
                              <strong>Visible columns</strong>
                              <span>Choose what appears in the table.</span>
                            </div>
                          </div>
                          <div className="np-floating-panel-body">
                            {visibleCatalogColumnEntries.map(([key, label]) => (
                              <label className="np-floating-check" key={key}>
                                <input
                                  type="checkbox"
                                  checked={visibleCatalogColumns[key]}
                                  onChange={(event) => setVisibleCatalogColumns((current) => ({
                                    ...current,
                                    [key]: event.target.checked,
                                  }))}
                                />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="np-floating-panel-actions">
                            <button
                              type="button"
                              className="np-panel-link"
                              onClick={() => setVisibleCatalogColumns({
                                type: true,
                                price: true,
                                qty: true,
                                tax: true,
                                status: true,
                              })}
                            >
                              Reset
                            </button>
                            <button type="button" className="np-panel-link strong" onClick={() => setShowColumnMenu(false)}>
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="np-toolbar-panel-wrap">
                      <Button
                        variant="outline"
                        type="button"
                        className={`np-toolbar-btn np-toolbar-ghost-btn ${showFilters ? 'is-open' : ''}`}
                        onClick={() => {
                          setShowFilters((current) => !current);
                          setShowColumnMenu(false);
                        }}
                      >
                        <ListFilter size={14} />
                        Filters
                        {activeFilterCount > 0 && <span className="np-toolbar-count">{activeFilterCount}</span>}
                      </Button>
                      {showFilters && (
                        <div className="np-floating-panel np-filters-panel">
                          <div className="np-floating-panel-head">
                            <div>
                              <strong>Filter products</strong>
                              <span>Refine the list by category, item type, and status.</span>
                            </div>
                          </div>
                          <div className="np-floating-panel-grid">
                            <label className="np-filter-field">
                              <span>Category</span>
                              <select
                                className="input-field"
                                value={catalogFilters.category}
                                onChange={(event) => setCatalogFilters((current) => ({ ...current, category: event.target.value }))}
                              >
                                <option value="all">All categories</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={String(category.id)}>{category.name}</option>
                                ))}
                              </select>
                            </label>
                            <label className="np-filter-field">
                              <span>Type</span>
                              <select
                                className="input-field"
                                value={catalogFilters.type}
                                onChange={(event) => setCatalogFilters((current) => ({ ...current, type: event.target.value }))}
                              >
                                <option value="all">All types</option>
                                <option value="product">Products</option>
                                <option value="service">Services</option>
                              </select>
                            </label>
                            <label className="np-filter-field">
                              <span>Status</span>
                              <select
                                className="input-field"
                                value={catalogFilters.status}
                                onChange={(event) => setCatalogFilters((current) => ({ ...current, status: event.target.value }))}
                              >
                                <option value="all">All statuses</option>
                                <option value="published">Active</option>
                                <option value="draft">Draft</option>
                              </select>
                            </label>
                          </div>
                          <div className="np-floating-panel-actions">
                            <button
                              type="button"
                              className="np-panel-link"
                              onClick={() => setCatalogFilters({
                                category: 'all',
                                type: 'all',
                                status: 'all',
                              })}
                            >
                              Clear filters
                            </button>
                            <button type="button" className="np-panel-link strong" onClick={() => setShowFilters(false)}>
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="np-products-grid-wrap">
                  <div className="np-products-grid-head" style={{ gridTemplateColumns: tableColumnTemplate }}>
                    <div className="np-products-col checkbox"><input type="checkbox" disabled /></div>
                    <div className="np-products-col name">Product</div>
                    {visibleCatalogColumns.type && <div className="np-products-col type">Type</div>}
                    {visibleCatalogColumns.price && <div className="np-products-col price">Price</div>}
                    {visibleCatalogColumns.qty && <div className="np-products-col qty">Stock</div>}
                    {visibleCatalogColumns.tax && <div className="np-products-col tax">Tax</div>}
                    {visibleCatalogColumns.status && <div className="np-products-col status">Status</div>}
                    <div className="np-products-col actions">Actions</div>
                  </div>

                  <div className="np-products-grid-body">
                    {filteredProducts.length === 0 ? emptyCatalogMessage : filteredProducts.map((product) => (
                      <div className="np-products-row" style={{ gridTemplateColumns: tableColumnTemplate }} key={product.id}>
                        <div className="np-products-cell checkbox"><input type="checkbox" /></div>
                        <div className="np-products-cell name">
                          <div className="np-product-avatar">{(product.name || 'P').slice(0, 2).toUpperCase()}</div>
                          <div className="np-product-name-block">
                            <strong>{product.name}</strong>
                            <span>{product.mystore_product_id || 'Pending'}</span>
                            <em>{product.product_type || (product.type === 'service' ? 'Service Package' : 'Catalog Product')}</em>
                          </div>
                        </div>
                        {visibleCatalogColumns.type && (
                          <div className="np-products-cell type">
                            <span className="np-inline-pill type-pill">{product.type === 'service' ? 'Service' : 'Product'}</span>
                          </div>
                        )}
                        {visibleCatalogColumns.price && (
                          <div className="np-products-cell price">
                            <strong>{formatMoney(product.sale_price || product.regular_price)}</strong>
                          </div>
                        )}
                        {visibleCatalogColumns.qty && (
                          <div className="np-products-cell qty">
                            <span className={product.stock_quantity > 0 ? 'qty-normal' : 'qty-empty'}>{product.type === 'service' ? 'N/A' : product.stock_quantity}</span>
                          </div>
                        )}
                        {visibleCatalogColumns.tax && <div className="np-products-cell tax">18.00%</div>}
                        {visibleCatalogColumns.status && (
                          <div className="np-products-cell status">
                            <span className={`np-inline-pill ${product.status === 'published' ? 'status-pill-active' : 'status-pill-draft'}`}>{product.status === 'published' ? 'Active' : 'Draft'}</span>
                          </div>
                        )}
                        <div className="np-products-cell actions">
                          <Button variant="outline" type="button" className="np-grid-action-btn" onClick={() => openSavedPreview(product.id)} disabled={sellerLocked}><Eye size={14} /></Button>
                          <Button variant="outline" type="button" className="np-grid-action-btn" onClick={() => openEdit(product)} disabled={sellerLocked}><Edit size={14} /></Button>
                          <Button variant="outline" type="button" className="np-grid-action-btn danger" onClick={() => handleDelete(product.id)} disabled={sellerLocked}><Trash size={14} /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="np-products-grid-footer">
                  <span>Showing 1 to {filteredProducts.length} of {filteredProducts.length} results</span>
                  <div className="np-products-footer-page">
                    <span>Per page:</span>
                    <button type="button" className="np-page-btn">10</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <CategoryDrawer isOpen={isCategoryDrawerOpen} onClose={() => setIsCategoryDrawerOpen(false)} />
        <RightDrawer isOpen={isBrandDrawerOpen} onClose={() => setIsBrandDrawerOpen(false)} title="Create Brand">
          <p className="body-md np-drawer-copy">
            Add a new brand, then select it for this item right away.
          </p>
          {brandError && <div className="form-alert form-alert-error" style={{ marginBottom: 16 }}>{brandError}</div>}
          <form onSubmit={submitBrand} className="np-drawer-stack">
            <div className="input-container">
              <label className="input-label label-md">Brand Name</label>
              <input className="input-field" type="text" value={brandForm.name} onChange={(e) => setBrandForm((current) => ({ ...current, name: e.target.value }))} />
            </div>
            <div className="input-container">
              <label className="input-label label-md">Logo URL</label>
              <input className="input-field" type="url" placeholder="https://..." value={brandForm.logo} onChange={(e) => setBrandForm((current) => ({ ...current, logo: e.target.value }))} />
            </div>
            <div className="np-drawer-actions">
              <Button type="button" variant="secondary" onClick={() => setIsBrandDrawerOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={brandSubmitting}>{brandSubmitting ? 'Saving...' : 'Save Brand'}</Button>
            </div>
          </form>
        </RightDrawer>
      </div>
    </div>
  );
};

export default SellerProducts;
