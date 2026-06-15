import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { FolderTree, Layers, Plus, Sparkles, Tag } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import './SellerCategories.css';

const buildCategoryTree = (categories) => {
  const map = new Map();
  const roots = [];

  categories.forEach((category) => {
    map.set(category.id, { ...category, children: [] });
  });

  categories.forEach((category) => {
    const item = map.get(category.id);
    if (category.parent_id && map.has(category.parent_id)) {
      map.get(category.parent_id).children.push(item);
      return;
    }

    roots.push(item);
  });

  return roots;
};

const countChildren = (category) => (
  (category.children || []).reduce((total, child) => total + 1 + countChildren(child), 0)
);

const CategoryTree = ({ categories, depth = 0 }) => (
  <div className={depth === 0 ? 'seller-category-tree' : 'seller-category-children'}>
    {categories.map((category) => (
      <article className="seller-category-row" key={category.id} style={{ '--depth': depth }}>
        <div className="seller-category-row-main">
          <span className="seller-category-icon">
            {depth === 0 ? <FolderTree size={16} /> : <Tag size={15} />}
          </span>
          <div>
            <h3>{category.name}</h3>
            <p>{category.children?.length || 0} direct subcategories / {countChildren(category)} total nested</p>
          </div>
        </div>
        <span className="seller-category-slug">{category.slug || 'No slug'}</span>
        {category.children?.length > 0 && <CategoryTree categories={category.children} depth={depth + 1} />}
      </article>
    ))}
  </div>
);

export const SellerCategories = () => {
  const { props } = usePage();
  const [categories, setCategories] = useState(props.categories || []);
  const [form, setForm] = useState({ name: '', parent_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCategories(props.categories || []);
    setSuccess(props.flash?.success || '');
    setError(props.flash?.error || '');
    setSubmitting(false);
  }, [props.categories, props.flash]);

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const rootCount = tree.length;
  const childCount = categories.length - rootCount;

  const submitCategory = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('Add a category name first.');
      return;
    }

    setSubmitting(true);
    router.post('/categories', {
      name: form.name.trim(),
      parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
    }, {
      preserveScroll: true,
      only: ['categories', 'flash'],
      onSuccess: () => setForm({ name: '', parent_id: '' }),
      onError: (errors) => setError(Object.values(errors)[0] || 'Category could not be saved.'),
      onFinish: () => setSubmitting(false),
    });
  };

  return (
    <div className="seller-dashboard-layout">
      <Sidebar />

      <div className="seller-dashboard-content animate-fade-in">
        <div className="seller-dashboard-container container seller-categories-page">
          <div className="seller-page-header">
            <div className="seller-page-title-block">
              <span className="seller-categories-kicker">Seller catalog taxonomy</span>
              <h2 className="headline-lg">Categories</h2>
              <p className="body-md">
                Build your own category and subcategory tree, then assign products from the product editor.
              </p>
            </div>
          </div>

          {(error || success) && (
            <div className={`seller-category-alert ${error ? 'seller-category-alert-error' : 'seller-category-alert-success'}`}>
              {error || success}
            </div>
          )}

          <section className="seller-categories-layout">
            <form className="seller-category-form" onSubmit={submitCategory}>
              <div className="seller-category-form-head">
                <span><Plus size={16} /></span>
                <div>
                  <h3>Add category</h3>
                  <p>Create a top-level category or place it under an existing parent.</p>
                </div>
              </div>

              <Input
                label="Category Name"
                placeholder="Electronics, Women Clothing, Mobile Accessories"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />

              <div className="input-container">
                <label className="input-label label-md">Parent Category</label>
                <select
                  className="input-field"
                  value={form.parent_id}
                  onChange={(event) => setForm((current) => ({ ...current, parent_id: event.target.value }))}
                >
                  <option value="">Top-level category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.parent ? `${category.parent.name} / ` : ''}{category.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" variant="primary" disabled={submitting}>
                <Plus size={16} />
                {submitting ? 'Saving' : 'Save Category'}
              </Button>

              <Link href="/seller/products" className="seller-category-product-link">
                Go to products after creating categories
              </Link>
            </form>

            <section className="seller-category-overview">
              <div className="seller-category-stats">
                <div>
                  <Sparkles size={18} />
                  <strong>{categories.length}</strong>
                  <span>Total categories</span>
                </div>
                <div>
                  <FolderTree size={18} />
                  <strong>{rootCount}</strong>
                  <span>Top-level</span>
                </div>
                <div>
                  <Layers size={18} />
                  <strong>{childCount}</strong>
                  <span>Subcategories</span>
                </div>
              </div>

              <div className="seller-category-panel">
                <div className="seller-category-panel-head">
                  <div>
                    <span className="seller-categories-kicker">Your tree</span>
                    <h3>Category hierarchy</h3>
                  </div>
                </div>

                {tree.length === 0 ? (
                  <div className="seller-category-empty">
                    <FolderTree size={38} />
                    <h3>No categories yet</h3>
                    <p>Add your first top-level category, then add subcategories under it.</p>
                  </div>
                ) : (
                  <CategoryTree categories={tree} />
                )}
              </div>
            </section>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SellerCategories;
