import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, router, usePage } from '@inertiajs/react';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import { Input } from '../components/Input';
import { AlertTriangle, ChevronRight, Edit, Eye, Image, Layers, ListPlus, PackageOpen, Plus, ShieldCheck, Tag, Trash, Truck, Warehouse, X } from 'lucide-react';
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
  bullet_points: [{ title: 'Description', value: '' }],
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

  const fulfillmentChannels = useMemo(() => {
    const channels = Array.isArray(user?.fulfillment_channels) ? user.fulfillment_channels : [];
    return channels.length > 0 ? channels : [user?.default_fulfillment_channel || 'Seller Fulfilled'];
  }, [user?.default_fulfillment_channel, user?.fulfillment_channels]);

  useEffect(() => {
    setProducts(props.sellerProducts || []);
    setCategories(props.categories || []);
    setWarehouses(props.sellerWarehouses || []);
    setLoading(false);
    setFormSuccess(props.flash?.success || '');
    if (props.flash?.error) setFormError(props.flash.error);
  }, [props.categories, props.flash, props.sellerProducts, props.sellerWarehouses]);

  useEffect(() => {
    if (activeEditorSection === 'variations' && form.inventoryType !== 'variable') {
      setActiveEditorSection('overview');
    }
  }, [activeEditorSection, form.inventoryType]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    setEditId(null);
    setForm(defaultForm(user));
    setFormError('');
    setFormSuccess('');
    setActiveEditorSection('overview');
    setShowForm(true);
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
      bullet_points: listFrom(fullProd.bullet_points, [{ title: 'Description', value: '' }]),
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

    const payload = {
      name: form.name.trim(),
      description: form.description,
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
      bullet_points: form.bullet_points.filter((bullet) => bullet.title?.trim() || bullet.value?.trim()),
      size_chart: form.size_chart.needed ? { image_url: form.size_chart.image_url, notes: form.size_chart.notes } : null,
      safety_compliance: form.safety_compliance,
      seo_search_terms: cleanList(form.seo_search_terms),
      whats_inside_box: cleanList(form.whats_inside_box),
      menu_order: parseInt(form.menu_order, 10) || 0,
      type: form.inventoryType,
      grouped_product_ids: form.inventoryType === 'grouped'
        ? form.groupedProductIds.map((id) => parseInt(id, 10)).filter(Boolean)
        : [],
      external_url: form.inventoryType === 'external' ? form.externalUrl.trim() : null,
      external_button_text: form.inventoryType === 'external' ? form.externalButtonText.trim() || 'Buy on partner site' : null,
      attributes: form.inventoryType === 'variable' ? cleanedAttributes : null,
      variations: form.inventoryType === 'variable'
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
      preserveState: false,
      only: ['sellerProducts', 'categories', 'sellerWarehouses', 'flash'],
      onSuccess: () => {
        setFormSuccess(editId ? 'Product updated successfully!' : 'Product created successfully!');
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

  const emptyCatalogMessage = (
    <div className="empty-catalog-message flex-center">
      <PackageOpen size={44} className="empty-catalog-icon" />
      <h4 className="title-lg">Your Catalog is Empty</h4>
      <p className="body-md">Start listing items by clicking the Add New Product button above.</p>
    </div>
  );

  const columns = [
    {
      header: 'Product Info',
      render: (row) => (
        <div className="table-prod-info">
          <strong>{row.name}</strong>
          <span className="table-prod-sku">SKU: {row.sku || 'N/A'} | MyStore: {row.mystore_product_id || 'Pending'}</span>
          <span className="table-prod-sku">{inventoryTypeLabel(row.type)}{row.product_type ? ` | Catalog: ${row.product_type}` : ''}</span>
        </div>
      ),
    },
    { header: 'Price', render: (row) => <div>{renderPrice(row)}</div> },
    {
      header: 'Stock Status',
      render: (row) => (
        <span className={`table-stock-badge label-md ${row.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {getStockLabel(row)}
        </span>
      ),
    },
    { header: 'Brand', render: (row) => <span>{row.brand?.name || 'N/A'}</span> },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="table-actions flex-center" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" className="action-icon-btn" onClick={() => openSavedPreview(row.id)} disabled={sellerLocked}><Eye size={14} /></Button>
          <Button variant="secondary" className="action-icon-btn" onClick={() => openEdit(row)} disabled={sellerLocked}><Edit size={14} /></Button>
          <Button variant="ghost" className="action-icon-btn delete-btn" onClick={() => handleDelete(row.id)} disabled={sellerLocked}><Trash size={14} /></Button>
        </div>
      ),
    },
  ];

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
    { id: 'overview', label: 'Overview', hint: 'Type and core details', icon: PackageOpen },
    { id: 'media', label: 'Media & Copy', hint: 'Images and content', icon: Image },
    { id: 'pricing', label: 'Pricing & IDs', hint: 'Money and identifiers', icon: Tag },
    { id: 'inventory', label: 'Inventory', hint: 'Categories and stock', icon: Warehouse },
    { id: 'shipping', label: 'Shipping', hint: 'Dimensions and packaging', icon: Truck },
    { id: 'compliance', label: 'Compliance', hint: 'Safety and SEO', icon: ShieldCheck },
    ...(form.inventoryType === 'variable'
      ? [{ id: 'variations', label: 'Variations', hint: 'Attributes and child SKUs', icon: Layers }]
      : []),
  ];
  const selectedCategories = form.selectedCats
    .map((id) => categoryMap.get(id))
    .filter(Boolean);
  const summaryPriceLabel = form.inventoryType === 'external'
    ? 'External listing'
    : `$${Number.parseFloat(form.sale_price || form.regular_price || 0).toFixed(2)}`;
  const summaryType = inventoryTypeLabel(form.inventoryType);
  const visibleSection = editorSections.some((section) => section.id === activeEditorSection)
    ? activeEditorSection
    : 'overview';
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
        <div className="seller-dashboard-container container seller-products-page">
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
            <>
            <Card title={editId ? 'Edit Product Listing' : 'Add New Product Listing'} className="product-form-card">
              {formError && <div className="form-alert form-alert-error body-md">{formError}</div>}
              {formSuccess && <div className="form-alert form-alert-success body-md">{formSuccess}</div>}

              <form onSubmit={handleSubmit}>
                <div className="catalog-editor-shell">
                  <div className="catalog-editor-hero">
                    <div className="catalog-editor-hero-top">
                      <div className="catalog-editor-hero-top-left">
                        <span className="catalog-editor-type">{summaryType}</span>
                        <span className="catalog-editor-price">{summaryPriceLabel}</span>
                      </div>
                      <div className="catalog-editor-hero-top-actions">
                        <Button type="button" variant="secondary" size="sm" onClick={openDraftPreview}>
                          <Eye size={14} /> Preview
                        </Button>
                      </div>
                    </div>
                    <h3 className="catalog-editor-title">{form.name || 'Untitled product'}</h3>
                    <p className="catalog-editor-copy">
                      {productTypeNotes[form.inventoryType]}
                    </p>

                    <div className="catalog-primary-fields">
                      <Input label="Product Name *" type="text" placeholder="E.g. Wireless ANC Headphones" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
                      <Input label="Seller SKU" type="text" placeholder="Optional seller SKU" value={form.sku} onChange={(e) => setField('sku', e.target.value)} />
                      <div className="input-container">
                        <label className="input-label label-md">Short Description</label>
                        <textarea className="input-field" rows="3" placeholder="Short product summary" value={form.short_description} onChange={(e) => setField('short_description', e.target.value)} />
                      </div>
                    </div>

                    <div className="product-type-control">
                      <span className="product-type-label">Product type</span>
                      <div className="product-type-grid">
                        {PRODUCT_TYPE_OPTIONS.map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            className={`product-type-option ${form.inventoryType === value ? 'is-active' : ''}`}
                            onClick={() => updateInventoryType(value)}
                          >
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="catalog-editor-workspace">
                    <aside className="catalog-editor-nav">
                      <div className="catalog-nav-card">
                        <span className="catalog-nav-eyebrow">Listing sections</span>
                        <div className="catalog-nav-list">
                          {editorSections.map((section) => {
                            const Icon = section.icon;
                            const isActive = visibleSection === section.id;
                            return (
                              <button
                                key={section.id}
                                type="button"
                                className={`catalog-nav-button ${isActive ? 'is-active' : ''}`}
                                onClick={() => setActiveEditorSection(section.id)}
                              >
                                <span className="catalog-nav-icon"><Icon size={14} /></span>
                                <span className="catalog-nav-copy">
                                  <strong>{section.label}</strong>
                                  <small>{section.hint}</small>
                                </span>
                                <ChevronRight size={14} className="catalog-nav-chevron" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </aside>

                    <div className="catalog-editor-main">

                    {visibleSection === 'overview' && (
                      <section className="catalog-section">
                        <div className="catalog-section-head">
                          <div>
                            <span className="catalog-section-eyebrow">Overview</span>
                            <h5 className="catalog-section-title">Catalog details</h5>
                            <p className="catalog-section-copy">Add the item identifiers and buyer-facing classification details.</p>
                          </div>
                        </div>

                        <div className="catalog-stack">
                          <div className="form-subfields">
                            <Input label="Manufacturer" type="text" placeholder="Manufacturer or maker" value={form.manufacturer} onChange={(e) => setField('manufacturer', e.target.value)} />
                          </div>

                          {isElectronicsSelection && (
                            <div className="form-subfields">
                              <Input label="Model Number" type="text" placeholder="Electronics model number" value={form.model_number} onChange={(e) => setField('model_number', e.target.value)} />
                              <Input label="Country of Origin" type="text" value={form.country_of_origin || user?.country || ''} onChange={(e) => setField('country_of_origin', e.target.value)} readOnly />
                            </div>
                          )}

                          <div className="form-subfields">
                            <Input label="Catalog Type" type="text" placeholder="Headphones, stroller, kurti" value={form.product_type} onChange={(e) => setField('product_type', e.target.value)} />
                            <Input label="SEO Type Keyword" type="text" placeholder="wireless headphones" value={form.product_type_keyword} onChange={(e) => setField('product_type_keyword', e.target.value)} />
                          </div>

                          <div className="form-subfields">
                            <Input label="Target Gender" type="text" placeholder="Unisex" value={form.target_gender} onChange={(e) => setField('target_gender', e.target.value)} />
                            <Input label="Recommended Age" type="text" placeholder="12 years and up" value={form.recommended_age} onChange={(e) => setField('recommended_age', e.target.value)} />
                          </div>

                          <div className="form-subfields">
                            <div className="input-container">
                              <label className="input-label label-md">Condition</label>
                              <select className="input-field" value={form.condition} onChange={(e) => setField('condition', e.target.value)}>
                                {CONDITION_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                              </select>
                            </div>
                            <Input label="Menu Order" type="number" value={form.menu_order} onChange={(e) => setField('menu_order', e.target.value)} />
                          </div>
                        </div>
                      </section>
                    )}

                    {visibleSection === 'media' && (
                      <section className="catalog-section">
                        <div className="catalog-section-head">
                          <div>
                            <span className="catalog-section-eyebrow">Media & Copy</span>
                            <h5 className="catalog-section-title">Images and product story</h5>
                            <p className="catalog-section-copy">Use the strongest image first, then add the supporting angles and copy.</p>
                          </div>
                        </div>

                        <div className="catalog-stack">
                          <Input label="Main Image URL" type="url" placeholder="https://..." value={form.featured_image} onChange={(e) => setField('featured_image', e.target.value)} />
                          <div className="input-container">
                            <label className="input-label label-md">Brief Summary</label>
                            <input className="input-field" value={form.short_description} placeholder="Short product summary" onChange={(e) => setField('short_description', e.target.value)} />
                          </div>
                          <div className="input-container">
                            <label className="input-label label-md">Full Description</label>
                            <textarea className="input-field" rows="5" placeholder="Detailed product description" value={form.description} onChange={(e) => setField('description', e.target.value)} />
                          </div>
                          <div className="catalog-field-group">
                            <label className="input-label label-md">Bullet Points</label>
                            {form.bullet_points.map((bullet, index) => {
                              const titleIsCommon = BULLET_TITLE_OPTIONS.includes(bullet.title);
                              return (
                                <div className="bullet-row" key={`bullet-${index}`}>
                                  <select
                                    className="input-field"
                                    value={titleIsCommon ? bullet.title : 'Other'}
                                    onChange={(e) => {
                                      const next = [...form.bullet_points];
                                      next[index] = { ...bullet, title: e.target.value === 'Other' ? '' : e.target.value };
                                      setField('bullet_points', next);
                                    }}
                                  >
                                    {BULLET_TITLE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                                  </select>
                                  {!titleIsCommon && (
                                    <input
                                      className="input-field"
                                      placeholder="Custom title"
                                      value={bullet.title}
                                      onChange={(e) => {
                                        const next = [...form.bullet_points];
                                        next[index] = { ...bullet, title: e.target.value };
                                        setField('bullet_points', next);
                                      }}
                                    />
                                  )}
                                  <input
                                    className="input-field bullet-value"
                                    placeholder="Bullet text"
                                    value={bullet.value}
                                    onChange={(e) => {
                                      const next = [...form.bullet_points];
                                      next[index] = { ...bullet, value: e.target.value };
                                      setField('bullet_points', next);
                                    }}
                                  />
                                  <Button type="button" variant="ghost" className="catalog-icon-button" onClick={() => setField('bullet_points', form.bullet_points.filter((_, itemIndex) => itemIndex !== index))}><X size={15} /></Button>
                                </div>
                              );
                            })}
                            <Button type="button" variant="secondary" size="sm" onClick={() => setField('bullet_points', [...form.bullet_points, { title: 'Description', value: '' }])}>
                              <ListPlus size={14} /> Add Bullet
                            </Button>
                          </div>
                        </div>
                      </section>
                    )}

                    {visibleSection === 'pricing' && (
                      <section className="catalog-section">
                        <div className="catalog-section-head">
                          <div>
                            <span className="catalog-section-eyebrow">Pricing & IDs</span>
                            <h5 className="catalog-section-title">Money and identifiers</h5>
                            <p className="catalog-section-copy">Keep your SKU, menu order, and any special pricing logic in one place.</p>
                          </div>
                        </div>

                        <div className="catalog-stack">
                          <div className="form-subfields">
                            <Input label={form.inventoryType === 'grouped' ? 'Display Price From ($)' : 'Sale Price ($)'} type="number" step="0.01" placeholder="79.99" value={form.sale_price} onChange={(e) => setField('sale_price', e.target.value)} />
                            <Input label={form.inventoryType === 'grouped' ? 'Display Price To ($)' : 'Strike/List Price ($) *'} type="number" step="0.01" placeholder="99.99" value={form.regular_price} onChange={(e) => setField('regular_price', e.target.value)} required={form.inventoryType !== 'grouped' && form.inventoryType !== 'external'} />
                          </div>

                          <div className="form-subfields">
                            <Input label="Seller SKU" type="text" placeholder="Optional seller SKU" value={form.sku} onChange={(e) => setField('sku', e.target.value)} />
                            {form.inventoryType === 'variable' ? (
                              <Input label="Parent SKU ID" type="text" placeholder="Auto for variations" value={form.parent_sku_id} onChange={(e) => setField('parent_sku_id', e.target.value)} />
                            ) : (
                              <Input label="Menu Order" type="number" value={form.menu_order} onChange={(e) => setField('menu_order', e.target.value)} />
                            )}
                          </div>

                          {form.inventoryType === 'external' && (
                            <div className="form-subfields">
                              <Input label="External/Affiliate URL *" type="url" placeholder="https://partner-site.com/product" value={form.externalUrl} onChange={(e) => setField('externalUrl', e.target.value)} required />
                              <Input label="Button Text" type="text" placeholder="Buy on partner site" value={form.externalButtonText} onChange={(e) => setField('externalButtonText', e.target.value)} />
                            </div>
                          )}

                          {form.inventoryType === 'grouped' && (
                            <div className="input-container">
                              <label className="input-label label-md">Grouped Products</label>
                              <select
                                multiple
                                className="input-field grouped-products-select"
                                value={form.groupedProductIds}
                                onChange={(e) => setField('groupedProductIds', Array.from(e.target.selectedOptions).map((option) => option.value))}
                              >
                                {availableGroupedProducts.map((product) => (
                                  <option key={product.id} value={String(product.id)}>
                                    {product.name} ({product.sku || product.mystore_product_id || `ID ${product.id}`})
                                  </option>
                                ))}
                              </select>
                              <span className="grouped-products-help">Pick the child products buyers should see together under this grouped listing.</span>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {visibleSection === 'inventory' && (
                      <section className="catalog-section">
                        <div className="catalog-section-head">
                          <div>
                            <span className="catalog-section-eyebrow">Inventory</span>
                            <h5 className="catalog-section-title">Categories, stock, and fulfillment</h5>
                            <p className="catalog-section-copy">This is the operational layer buyers never see but sellers rely on every day.</p>
                          </div>
                        </div>

                        <div className="catalog-stack">
                          <div className="input-container">
                            <label className="input-label label-md">Select Categories</label>
                            <div className="cat-checkbox-list">
                              {renderCategoryTree(buildCategoryTree(categories))}
                              <label className="cat-checkbox-item body-md" style={{ borderTop: '1px solid var(--color-outline-variant)', marginTop: '8px', paddingTop: '8px' }}>
                                <input type="checkbox" checked={form.isOtherCat} onChange={(e) => setForm((prev) => ({ ...prev, isOtherCat: e.target.checked, new_category_name: e.target.checked ? prev.new_category_name : '' }))} />
                                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Other (Create New Category)</span>
                              </label>
                            </div>
                          </div>

                          {form.isOtherCat && <Input label="New Category Name *" type="text" value={form.new_category_name} onChange={(e) => setField('new_category_name', e.target.value)} required />}

                          <div className="input-container">
                            <label className="input-label label-md">Listing Fulfillment Channel</label>
                            <select className="input-field" value={form.fulfillment_channel} onChange={(e) => setField('fulfillment_channel', e.target.value)}>
                              <option value="">Seller profile default</option>
                              {fulfillmentChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
                            </select>
                          </div>

                          <label className="body-md catalog-check-row">
                            <input type="checkbox" checked={form.manage_stock} onChange={(e) => setField('manage_stock', e.target.checked)} />
                            Manage inventory stock levels
                          </label>

                          {form.manage_stock && (
                            <>
                              <div className="input-container">
                                <label className="input-label label-md">Select Warehouse</label>
                                <select className="input-field" value={form.warehouse_id} onChange={(e) => setField('warehouse_id', e.target.value)}>
                                  <option value="">Choose Warehouse</option>
                                  {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>)}
                                </select>
                              </div>
                              <div className="form-subfields">
                                <Input label="Stock Qty in Warehouse" type="number" value={form.warehouse_qty} onChange={(e) => setForm((prev) => ({ ...prev, warehouse_qty: e.target.value, stock_quantity: e.target.value }))} />
                                <Input label="Shelf Bin Location" type="text" placeholder="A-12" value={form.bin_location} onChange={(e) => setField('bin_location', e.target.value)} />
                              </div>
                            </>
                          )}
                        </div>
                      </section>
                    )}

                    {visibleSection === 'shipping' && (
                      <section className="catalog-section">
                        <div className="catalog-section-head">
                          <div>
                            <span className="catalog-section-eyebrow">Shipping</span>
                            <h5 className="catalog-section-title">Dimensions and packaging</h5>
                            <p className="catalog-section-copy">Use this section for dimensional accuracy, package weight, and size chart support.</p>
                          </div>
                        </div>

                        <div className="catalog-stack">
                          <div className="form-subfields product-dimensions-grid">
                            <Input label="Item Weight (kg)" type="number" step="0.01" value={form.weight_kg} onChange={(e) => setField('weight_kg', e.target.value)} />
                            <Input label="Item Length (cm)" type="number" step="0.1" value={form.length_cm} onChange={(e) => setField('length_cm', e.target.value)} />
                            <Input label="Item Width (cm)" type="number" step="0.1" value={form.width_cm} onChange={(e) => setField('width_cm', e.target.value)} />
                            <Input label="Item Height (cm)" type="number" step="0.1" value={form.height_cm} onChange={(e) => setField('height_cm', e.target.value)} />
                          </div>

                          <div className="form-subfields product-dimensions-grid">
                            <Input label="Package Weight (kg)" type="number" step="0.01" value={form.package_weight_kg} onChange={(e) => setField('package_weight_kg', e.target.value)} />
                            <Input label="Package Length (cm)" type="number" step="0.1" value={form.package_length_cm} onChange={(e) => setField('package_length_cm', e.target.value)} />
                            <Input label="Package Width (cm)" type="number" step="0.1" value={form.package_width_cm} onChange={(e) => setField('package_width_cm', e.target.value)} />
                            <Input label="Package Height (cm)" type="number" step="0.1" value={form.package_height_cm} onChange={(e) => setField('package_height_cm', e.target.value)} />
                          </div>

                          <label className="body-md catalog-check-row">
                            <input type="checkbox" checked={form.size_chart.needed} onChange={(e) => setField('size_chart', { ...form.size_chart, needed: e.target.checked })} />
                            Size chart needed
                          </label>

                          {form.size_chart.needed && (
                            <>
                              <Input label="Size Chart Image URL" type="url" placeholder="https://..." value={form.size_chart.image_url} onChange={(e) => setField('size_chart', { ...form.size_chart, image_url: e.target.value })} />
                              <div className="input-container">
                                <label className="input-label label-md">Size Chart Notes</label>
                                <textarea className="input-field" rows="3" value={form.size_chart.notes} onChange={(e) => setField('size_chart', { ...form.size_chart, notes: e.target.value })} />
                              </div>
                            </>
                          )}

                          {renderTextListEditor('whats_inside_box', "What's Inside Box", 'USB-C cable, manual, charger')}
                        </div>
                      </section>
                    )}

                    {visibleSection === 'compliance' && (
                      <section className="catalog-section">
                        <div className="catalog-section-head">
                          <div>
                            <span className="catalog-section-eyebrow">Compliance</span>
                            <h5 className="catalog-section-title">Safety and search terms</h5>
                            <p className="catalog-section-copy">Keep the technical and searchable details organized for later filtering and SEO.</p>
                          </div>
                        </div>

                        <div className="catalog-stack">
                          {Object.keys(defaultSafety).map((key) => (
                            <Input
                              key={key}
                              label={key.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')}
                              type="text"
                              value={form.safety_compliance[key] || ''}
                              onChange={(e) => setField('safety_compliance', { ...form.safety_compliance, [key]: e.target.value })}
                            />
                          ))}
                          {renderTextListEditor('seo_search_terms', 'SEO Search Terms', 'wireless, bluetooth, travel')}
                        </div>
                      </section>
                    )}

                    {visibleSection === 'variations' && form.inventoryType === 'variable' && (
                      <section className="catalog-section">
                        <div className="catalog-section-head">
                          <div>
                            <span className="catalog-section-eyebrow">Variations</span>
                            <h5 className="catalog-section-title">Attributes and child SKUs</h5>
                            <p className="catalog-section-copy">Define the variant attributes first, then generate each child variation below.</p>
                          </div>
                        </div>

                        <div className="catalog-stack">
                          <div className="attributes-config-section">
                            <div className="catalog-section-toolbar">
                              <span className="label-md">Variation Attributes</span>
                              <Button type="button" variant="secondary" size="sm" onClick={() => setField('attributesList', [...form.attributesList, { name: '', options: '' }])}>Add Attribute</Button>
                            </div>
                            {form.attributesList.map((attr, index) => (
                              <div className="dynamic-row" key={`attr-${index}`}>
                                <input className="input-field" placeholder="Attribute name" value={attr.name} onChange={(e) => {
                                  const next = [...form.attributesList];
                                  next[index] = { ...attr, name: e.target.value };
                                  setField('attributesList', next);
                                }} />
                                <input className="input-field" placeholder="Options: Red, Blue" value={Array.isArray(attr.options) ? attr.options.join(', ') : attr.options} onChange={(e) => {
                                  const next = [...form.attributesList];
                                  next[index] = { ...attr, options: e.target.value };
                                  setField('attributesList', next);
                                }} />
                                <Button type="button" variant="ghost" className="catalog-icon-button" onClick={() => setField('attributesList', form.attributesList.filter((_, itemIndex) => itemIndex !== index))}><X size={15} /></Button>
                              </div>
                            ))}
                          </div>

                          <div className="variations-config-section">
                            <div className="catalog-section-toolbar">
                              <span className="label-md">Child Variations</span>
                              <Button type="button" variant="secondary" size="sm" onClick={addVariation} disabled={form.attributesList.length === 0}>Add Variation</Button>
                            </div>
                            {form.variationsList.map((variant, index) => (
                              <div className="variation-card" key={`variant-${index}`}>
                                <div className="catalog-section-toolbar">
                                  <span className="label-md">Variation #{index + 1}</span>
                                  <Button type="button" variant="ghost" onClick={() => setField('variationsList', form.variationsList.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
                                </div>
                                <div className="variation-grid">
                                  {form.attributesList.map((attr) => {
                                    if (!attr.name) return null;
                                    const options = typeof attr.options === 'string' ? attr.options.split(',').map((option) => option.trim()).filter(Boolean) : (attr.options || []);
                                    return (
                                      <div key={attr.name} className="input-container">
                                        <label className="input-label label-md">{attr.name}</label>
                                        <select className="input-field" value={variant.attributes[attr.name] || ''} onChange={(e) => {
                                          const next = [...form.variationsList];
                                          next[index] = { ...variant, attributes: { ...variant.attributes, [attr.name]: e.target.value } };
                                          setField('variationsList', next);
                                        }}>
                                          <option value="">Select</option>
                                          {options.map((option) => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                      </div>
                                    );
                                  })}
                                  <Input label="Price ($) *" type="number" step="0.01" value={variant.regular_price} onChange={(e) => {
                                    const next = [...form.variationsList];
                                    next[index] = { ...variant, regular_price: e.target.value };
                                    setField('variationsList', next);
                                  }} required />
                                  <Input label="Sale Price ($)" type="number" step="0.01" value={variant.sale_price} onChange={(e) => {
                                    const next = [...form.variationsList];
                                    next[index] = { ...variant, sale_price: e.target.value };
                                    setField('variationsList', next);
                                  }} />
                                  <Input label="Variation SKU" type="text" value={variant.sku} onChange={(e) => {
                                    const next = [...form.variationsList];
                                    next[index] = { ...variant, sku: e.target.value };
                                    setField('variationsList', next);
                                  }} />
                                  <Input label="Stock Qty" type="number" value={variant.stock_quantity} onChange={(e) => {
                                    const next = [...form.variationsList];
                                    next[index] = { ...variant, stock_quantity: e.target.value };
                                    setField('variationsList', next);
                                  }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    )}

                    <div className="form-buttons-row">
                      <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                      <Button type="submit" variant="primary" disabled={loading}>{editId ? 'Save Product' : 'Create Product'}</Button>
                    </div>
                  </div>
                </div>
                </div>
              </form>
            </Card>
            </>
          ) : (
            <div className="seller-products-catalog">
              <DataTable className="seller-products-table-wrap" columns={columns} data={products} emptyMessage={emptyCatalogMessage} />

              <div className="seller-products-mobile-list">
                {products.length === 0 ? emptyCatalogMessage : products.map((product) => (
                  <article key={product.id} className="seller-product-card">
                    <div className="seller-product-card-top">
                      <div className="seller-product-card-title">
                        <h3>{product.name}</h3>
                        <span>SKU: {product.sku || 'N/A'} | MyStore: {product.mystore_product_id || 'Pending'}</span>
                      </div>
                      <span className={`table-stock-badge label-md ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>{getStockLabel(product)}</span>
                    </div>
                    <div className="seller-product-card-meta">
                      <div><span className="seller-product-meta-label">Price</span><strong>{renderPrice(product)}</strong></div>
                      <div><span className="seller-product-meta-label">Type</span><strong>{inventoryTypeLabel(product.type)}</strong></div>
                    </div>
                    <div className="seller-product-card-actions">
                      <Button variant="secondary" size="sm" onClick={() => openSavedPreview(product.id)} disabled={sellerLocked}><Eye size={14} /> Preview</Button>
                      <Button variant="secondary" size="sm" onClick={() => openEdit(product)} disabled={sellerLocked}><Edit size={14} /> Edit</Button>
                      <Button variant="outline" size="sm" className="seller-product-delete-action" onClick={() => handleDelete(product.id)} disabled={sellerLocked}><Trash size={14} /> Delete</Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProducts;
