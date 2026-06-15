import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, router, usePage } from '@inertiajs/react';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import { Input } from '../components/Input';
import { Edit, Trash, Plus, X, PackageOpen, AlertTriangle } from 'lucide-react';
import './SellerProducts.css';

export const SellerProducts = () => {
  const { user } = useAuth();
  const { props } = usePage();
  
  const [products, setProducts] = useState(props.sellerProducts || []);
  const [categories, setCategories] = useState(props.categories || []);
  const [warehouses, setWarehouses] = useState(props.sellerWarehouses || []);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [regPrice, setRegPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [sku, setSku] = useState('');
  const [manageStock, setManageStock] = useState(false);
  const [stockQty, setStockQty] = useState(0);
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedWh, setSelectedWh] = useState('');
  const [whQty, setWhQty] = useState(0);
  const [binLocation, setBinLocation] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');

  // Product variation states
  const [productType, setProductType] = useState('simple');
  const [attributesList, setAttributesList] = useState([]);
  const [variationsList, setVariationsList] = useState([]);

  const [isOtherCat, setIsOtherCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    setProducts(props.sellerProducts || []);
    setCategories(props.categories || []);
    setWarehouses(props.sellerWarehouses || []);
    setLoading(false);
    setFormSuccess(props.flash?.success || '');
    if (props.flash?.error) {
      setFormError(props.flash.error);
    }
  }, [props.categories, props.flash, props.sellerProducts, props.sellerWarehouses]);

  const buildCategoryTree = (list) => {
    const map = {};
    const tree = [];
    list.forEach(c => {
      map[c.id] = { ...c, children: [] };
    });
    list.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].children.push(map[c.id]);
      } else {
        tree.push(map[c.id]);
      }
    });
    return tree;
  };

  const renderCategoryTree = (nodes, depth = 0) => {
    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <label className={`cat-checkbox-item body-md depth-${depth}`} style={{ paddingLeft: `${depth * 16}px` }}>
          <input
            type="checkbox"
            checked={selectedCats.includes(node.id)}
            onChange={() => handleCatCheckbox(node.id)}
          />
          {node.name}
        </label>
        {node.children && node.children.length > 0 && renderCategoryTree(node.children, depth + 1)}
      </React.Fragment>
    ));
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setShortDesc('');
    setRegPrice('');
    setSalePrice('');
    setSku('');
    setManageStock(false);
    setStockQty(0);
    setSelectedCats([]);
    setSelectedWh('');
    setWhQty(0);
    setBinLocation('');
    setWeightKg('');
    setLengthCm('');
    setWidthCm('');
    setHeightCm('');
    setProductType('simple');
    setAttributesList([]);
    setVariationsList([]);
    setIsOtherCat(false);
    setNewCatName('');
    setFormError('');
    setFormSuccess('');
    setShowForm(true);
  };

  const handleOpenEdit = async (prod) => {
    setLoading(true);
    const fullProd = props.sellerProducts?.find((item) => item.id === prod.id) || prod;

    setEditId(fullProd.id);
    setName(fullProd.name || '');
    setDescription(fullProd.description || '');
    setShortDesc(fullProd.short_description || '');
    setRegPrice(fullProd.regular_price || '');
    setSalePrice(fullProd.sale_price || '');
    setSku(fullProd.sku || '');
    setManageStock(!!fullProd.manage_stock);
    setStockQty(fullProd.stock_quantity || 0);
    setSelectedCats(fullProd.categories?.map(c => c.id) || []);

    if (fullProd.warehouses && fullProd.warehouses.length > 0) {
      const mainWh = fullProd.warehouses[0];
      setSelectedWh(mainWh.id || '');
      setWhQty(mainWh.pivot?.quantity || 0);
      setBinLocation(mainWh.pivot?.bin_location || '');
    } else {
      setSelectedWh('');
      setWhQty(0);
      setBinLocation('');
    }

    setWeightKg(fullProd.weight_kg || '');
    setLengthCm(fullProd.length_cm || '');
    setWidthCm(fullProd.width_cm || '');
    setHeightCm(fullProd.height_cm || '');

    setProductType(fullProd.type || 'simple');
    setAttributesList(fullProd.attributes || []);
    setVariationsList(fullProd.variations?.map(v => ({
      id: v.id,
      attributes: v.attributes || {},
      regular_price: v.regular_price || '',
      sale_price: v.sale_price || '',
      sku: v.sku || '',
      manage_stock: !!v.manage_stock,
      stock_quantity: v.stock_quantity || 0
    })) || []);

    setIsOtherCat(false);
    setNewCatName('');
    setFormError('');
    setFormSuccess('');
    setShowForm(true);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      router.delete(`/products/${id}`, {
        preserveScroll: true,
        preserveState: false,
        only: ['sellerProducts', 'categories', 'sellerWarehouses', 'flash'],
      });
    }
  };

  const handleCatCheckbox = (id) => {
    setSelectedCats(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      }
      return [...prev, id];
    });
  };

  const handleAddVariationPlaceholder = () => {
    const initialAttrs = {};
    attributesList.forEach(attr => {
      if (attr.name.trim()) {
        initialAttrs[attr.name.trim()] = '';
      }
    });
    setVariationsList(prev => [
      ...prev,
      {
        id: null,
        attributes: initialAttrs,
        regular_price: regPrice || '',
        sale_price: '',
        sku: '',
        manage_stock: true,
        stock_quantity: 0
      }
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name || !regPrice) {
      setFormError('Please fill out all required fields.');
      return;
    }

    if (isOtherCat && !newCatName.trim()) {
      setFormError('Please enter a name for the new category.');
      return;
    }

    const cleanedAttributes = attributesList.map(attr => ({
      name: attr.name.trim(),
      options: typeof attr.options === 'string'
        ? attr.options.split(',').map(o => o.trim()).filter(Boolean)
        : (attr.options || [])
    }));

    const payload = {
      name,
      description,
      short_description: shortDesc,
      regular_price: parseFloat(regPrice),
      sale_price: salePrice ? parseFloat(salePrice) : null,
      sku,
      manage_stock: manageStock,
      stock_quantity: parseInt(stockQty) || 0,
      categories: selectedCats,
      new_category_name: isOtherCat ? newCatName.trim() : '',
      warehouse_id: selectedWh ? parseInt(selectedWh) : null,
      warehouse_qty: selectedWh ? parseInt(whQty) : null,
      bin_location: binLocation,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      length_cm: lengthCm ? parseFloat(lengthCm) : null,
      width_cm: widthCm ? parseFloat(widthCm) : null,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      type: productType,
      attributes: productType === 'variable' ? cleanedAttributes : null,
      variations: productType === 'variable' ? variationsList.map(v => ({
        ...v,
        regular_price: parseFloat(v.regular_price),
        sale_price: v.sale_price ? parseFloat(v.sale_price) : null,
        stock_quantity: parseInt(v.stock_quantity) || 0
      })) : null
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
      onError: (errors) => {
        setFormError(Object.values(errors)[0] || 'An error occurred.');
      },
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

  const getStockLabel = (row) => (
    row.stock_quantity > 0 ? `${row.stock_quantity} available` : 'Out of Stock'
  );

  const emptyCatalogMessage = (
    <div className="empty-catalog-message flex-center">
      <PackageOpen size={44} className="empty-catalog-icon" />
      <h4 className="title-lg">Your Catalog is Empty</h4>
      <p className="body-md">
        Start listing items by clicking the Add New Product button above.
      </p>
    </div>
  );

  const columns = [
    {
      header: 'Product Info',
      render: (row) => (
        <div className="table-prod-info">
          <strong>{row.name}</strong>
          <span className="table-prod-sku">SKU: {row.sku || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Price',
      render: (row) => <div>{renderPrice(row)}</div>
    },
    {
      header: 'Stock Status',
      render: (row) => (
        <span className={`table-stock-badge label-md ${row.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {getStockLabel(row)}
        </span>
      )
    },
    {
      header: 'Brand',
      render: (row) => <span>{row.brand?.name || 'N/A'}</span>
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="table-actions flex-center" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" className="action-icon-btn" onClick={() => handleOpenEdit(row)} disabled={sellerLocked}>
            <Edit size={14} />
          </Button>
          <Button variant="ghost" className="action-icon-btn delete-btn" onClick={() => handleDelete(row.id)} disabled={sellerLocked}>
            <Trash size={14} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="seller-dashboard-layout">
      <Sidebar />

      <div className="seller-dashboard-content animate-fade-in">
        <div className="seller-dashboard-container container">
          {/* Header */}
          <div className="seller-page-header">
            <div className="seller-page-title-block seller-products-title-block">
              <h2 className="headline-lg">Product Catalog</h2>
              <p className="body-md" style={{ color: 'var(--color-outline)' }}>
                Create, update, and manage your inventory products.
              </p>
            </div>
            {!showForm && (
              <Button variant="primary" className="seller-add-product-btn" onClick={handleOpenCreate} disabled={sellerLocked}>
                <Plus size={16} style={{ marginRight: 6 }} />
                Add New Product
              </Button>
            )}
          </div>

          {user && !user.email_verified_at && (
            <div className="form-alert form-alert-error body-md" style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <AlertTriangle size={18} style={{ marginRight: 8 }} />
              <span>
                <strong>Email Verification Required:</strong> Please verify your email address to add, edit or manage products. <Link href="/seller/profile" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Verify email now</Link>.
              </span>
            </div>
          )}

          {showForm ? (
            /* Product Editor Form */
            <Card title={editId ? 'Edit Product' : 'Add New Product'} className="product-form-card">
              {formError && <div className="form-alert form-alert-error body-md">{formError}</div>}
              {formSuccess && <div className="form-alert form-alert-success body-md">{formSuccess}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-column">
                    <h5 className="form-section-title label-md">General Details</h5>
                    <Input
                      label="Product Name *"
                      type="text"
                      placeholder="E.g. Wireless Mouse"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />

                    <div className="input-container">
                      <label className="input-label label-md">Brief Summary / Short Description</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Enter short description"
                        value={shortDesc}
                        onChange={(e) => setShortDesc(e.target.value)}
                      />
                    </div>

                    <div className="input-container">
                      <label className="input-label label-md">Full Description</label>
                      <textarea
                        className="input-field"
                        rows="4"
                        placeholder="Enter detailed product specifications"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="form-subfields">
                      <Input
                        label="Regular Price ($) *"
                        type="number"
                        step="0.01"
                        placeholder="99.99"
                        value={regPrice}
                        onChange={(e) => setRegPrice(e.target.value)}
                        required
                      />
                      <Input
                        label="Sale Price ($)"
                        type="number"
                        step="0.01"
                        placeholder="79.99"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                      />
                    </div>

                    <Input
                      label="SKU Code"
                      type="text"
                      placeholder="E.g. WM-BLUE-01"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />

                    <div className="form-subfields product-dimensions-grid">
                      <Input
                        label="Weight (kg) *"
                        type="number"
                        step="0.01"
                        placeholder="0.50"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        required
                      />
                      <Input
                        label="Length (cm)"
                        type="number"
                        step="0.1"
                        placeholder="10"
                        value={lengthCm}
                        onChange={(e) => setLengthCm(e.target.value)}
                      />
                      <Input
                        label="Width (cm)"
                        type="number"
                        step="0.1"
                        placeholder="10"
                        value={widthCm}
                        onChange={(e) => setWidthCm(e.target.value)}
                      />
                      <Input
                        label="Height (cm)"
                        type="number"
                        step="0.1"
                        placeholder="10"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                      />
                    </div>

                    <div className="input-container" style={{ marginTop: 16 }}>
                      <label className="input-label label-md">Product Type</label>
                      <select 
                        className="input-field" 
                        value={productType} 
                        onChange={(e) => setProductType(e.target.value)}
                      >
                        <option value="simple">Simple Product</option>
                        <option value="variable">Variable Product</option>
                      </select>
                    </div>

                    {productType === 'variable' && (
                      <>
                        {/* Attributes configuration */}
                        <div className="attributes-config-section" style={{ marginTop: 16, border: '1px solid var(--color-outline-variant)', padding: 16, borderRadius: 8, backgroundColor: 'var(--color-surface-container-low)' }}>
                          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span className="label-md" style={{ fontWeight: 600 }}>Defined Attributes</span>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => setAttributesList(prev => [...prev, { name: '', options: '' }])}
                            >
                              Add Attribute
                            </Button>
                          </div>
                          {attributesList.length === 0 ? (
                            <p className="body-md" style={{ color: 'var(--color-outline)', fontStyle: 'italic' }}>No attributes defined. Add color or size options.</p>
                          ) : (
                            attributesList.map((attr, index) => (
                              <div key={index} className="flex-center" style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                  <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Attribute Name</label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={attr.name}
                                    onChange={(e) => {
                                      const updated = [...attributesList];
                                      updated[index].name = e.target.value;
                                      setAttributesList(updated);
                                    }}
                                    placeholder="Color"
                                    required
                                  />
                                </div>
                                <div style={{ flex: 2 }}>
                                  <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Options (comma-separated)</label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={attr.options instanceof Array ? attr.options.join(', ') : attr.options}
                                    onChange={(e) => {
                                      const updated = [...attributesList];
                                      updated[index].options = e.target.value;
                                      setAttributesList(updated);
                                    }}
                                    placeholder="Red, Blue"
                                    required
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  style={{ color: 'var(--color-error)' }}
                                  onClick={() => setAttributesList(prev => prev.filter((_, idx) => idx !== index))}
                                >
                                  <X size={16} />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Variations list configuration */}
                        <div className="variations-config-section" style={{ marginTop: 16, border: '1px solid var(--color-outline-variant)', padding: 16, borderRadius: 8, backgroundColor: 'var(--color-surface-container-low)' }}>
                          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span className="label-md" style={{ fontWeight: 600 }}>Product Variations</span>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm" 
                              onClick={handleAddVariationPlaceholder}
                              disabled={attributesList.length === 0}
                            >
                              Add Variation
                            </Button>
                          </div>
                          {variationsList.length === 0 ? (
                            <p className="body-md" style={{ color: 'var(--color-outline)', fontStyle: 'italic' }}>No variations defined. Click Add Variation to configure.</p>
                          ) : (
                            variationsList.map((variant, index) => (
                              <div key={index} style={{ borderBottom: index < variationsList.length - 1 ? '1px dashed var(--color-outline-variant)' : 'none', paddingBottom: 16, marginBottom: 16 }}>
                                <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <span className="label-sm" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Variation #{index + 1}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    style={{ color: 'var(--color-error)' }}
                                    onClick={() => setVariationsList(prev => prev.filter((_, idx) => idx !== index))}
                                  >
                                    Remove
                                  </Button>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 12 }}>
                                  {attributesList.map((attr) => {
                                    if (!attr.name) return null;
                                    const optionsArr = typeof attr.options === 'string' 
                                      ? attr.options.split(',').map(o => o.trim())
                                      : (attr.options || []);
                                    return (
                                      <div key={attr.name}>
                                        <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>{attr.name}</label>
                                        <select
                                          className="input-field"
                                          value={variant.attributes[attr.name] || ''}
                                          onChange={(e) => {
                                            const updated = [...variationsList];
                                            updated[index].attributes = {
                                              ...updated[index].attributes,
                                              [attr.name]: e.target.value
                                            };
                                            setVariationsList(updated);
                                          }}
                                          required
                                        >
                                          <option value="">-- Select --</option>
                                          {optionsArr.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12 }}>
                                  <div>
                                    <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Price ($) *</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="input-field"
                                      value={variant.regular_price}
                                      onChange={(e) => {
                                        const updated = [...variationsList];
                                        updated[index].regular_price = e.target.value;
                                        setVariationsList(updated);
                                      }}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Sale Price ($)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="input-field"
                                      value={variant.sale_price}
                                      onChange={(e) => {
                                        const updated = [...variationsList];
                                        updated[index].sale_price = e.target.value;
                                        setVariationsList(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>SKU</label>
                                    <input
                                      type="text"
                                      className="input-field"
                                      value={variant.sku}
                                      onChange={(e) => {
                                        const updated = [...variationsList];
                                        updated[index].sku = e.target.value;
                                        setVariationsList(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Stock Qty *</label>
                                    <input
                                      type="number"
                                      className="input-field"
                                      value={variant.stock_quantity}
                                      onChange={(e) => {
                                        const updated = [...variationsList];
                                        updated[index].stock_quantity = e.target.value;
                                        setVariationsList(updated);
                                      }}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="form-column">
                    <h5 className="form-section-title label-md">Metadata & Categories</h5>
                    
                    <div className="input-container">
                      <label className="input-label label-md">Select Categories</label>
                      <div className="cat-checkbox-list">
                        {renderCategoryTree(buildCategoryTree(categories))}
                        
                        <label className="cat-checkbox-item body-md" style={{ borderTop: '1px solid var(--color-outline-variant)', marginTop: '8px', paddingTop: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isOtherCat}
                            onChange={(e) => {
                              setIsOtherCat(e.target.checked);
                              if (!e.target.checked) setNewCatName('');
                            }}
                          />
                          <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>Other (Create New Category)</span>
                        </label>
                      </div>
                    </div>

                    {isOtherCat && (
                      <Input
                        label="New Category Name *"
                        type="text"
                        placeholder="Enter category name"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        required
                      />
                    )}

                    <h5 className="form-section-title label-md" style={{ marginTop: 24 }}>Warehouse Stock Allocation</h5>
                    <div className="form-stock-switch">
                      <label className="body-md flex-center" style={{ gap: 8, cursor: 'pointer', justifyContent: 'flex-start' }}>
                        <input
                          type="checkbox"
                          checked={manageStock}
                          onChange={(e) => setManageStock(e.target.checked)}
                        />
                        Manage Inventory Stock levels
                      </label>
                    </div>

                    {manageStock && (
                      <>
                        <div className="input-container">
                          <label className="input-label label-md">Select Warehouse</label>
                          <select
                            className="input-field"
                            value={selectedWh}
                            onChange={(e) => setSelectedWh(e.target.value)}
                          >
                            <option value="">-- Choose Warehouse --</option>
                            {warehouses.map(wh => (
                              <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-subfields">
                          <Input
                            label="Stock Qty in Warehouse"
                            type="number"
                            placeholder="50"
                            value={whQty}
                            onChange={(e) => {
                              setWhQty(e.target.value);
                              setStockQty(e.target.value); // Sync overall stock
                            }}
                          />
                          <Input
                            label="Shelf Bin Location"
                            type="text"
                            placeholder="A-12"
                            value={binLocation}
                            onChange={(e) => setBinLocation(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="form-buttons-row">
                  <Button variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {editId ? 'Save Product' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            /* Products Table */
            <div className="seller-products-catalog">
              <DataTable
                className="seller-products-table-wrap"
                columns={columns}
                data={products}
                emptyMessage={emptyCatalogMessage}
              />

              <div className="seller-products-mobile-list">
                {products.length === 0 ? (
                  emptyCatalogMessage
                ) : (
                  products.map((product) => (
                    <article key={product.id} className="seller-product-card">
                      <div className="seller-product-card-top">
                        <div className="seller-product-card-title">
                          <h3>{product.name}</h3>
                          <span>SKU: {product.sku || 'N/A'}</span>
                        </div>
                        <span className={`table-stock-badge label-md ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                          {getStockLabel(product)}
                        </span>
                      </div>

                      <div className="seller-product-card-meta">
                        <div>
                          <span className="seller-product-meta-label">Price</span>
                          <strong>{renderPrice(product)}</strong>
                        </div>
                      </div>

                      <div className="seller-product-card-actions">
                        <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(product)} disabled={sellerLocked}>
                          <Edit size={14} />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="seller-product-delete-action" onClick={() => handleDelete(product.id)} disabled={sellerLocked}>
                          <Trash size={14} />
                          Delete
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SellerProducts;
