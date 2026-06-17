import React, { useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { FolderTree, Tag, Plus, Layers, Sparkles, Edit2, Trash } from 'lucide-react';
import { RightDrawer } from './RightDrawer';
import { Button } from './Button';
import { Input } from './Input';
import '../pages/SellerCategories.css';

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

const CategoryTree = ({ categories, depth = 0, onEdit, onDelete }) => (
  <div className={depth === 0 ? 'seller-category-tree' : 'seller-category-children'}>
    {categories.map((category) => (
      <article className="seller-category-row" key={category.id} style={{ '--depth': depth }}>
        <div className="seller-category-row-main" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, fontSize: '15px' }}>{category.name}</h3>
          <span className="seller-category-slug" style={{ flexShrink: 0 }}>{category.slug || 'No slug'}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
          <button type="button" onClick={() => onEdit(category)} style={{ background: 'var(--color-surface-container)', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit">
            <Edit2 size={14} />
          </button>
          <button type="button" onClick={() => onDelete(category)} style={{ background: 'var(--color-error-container)', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete">
            <Trash size={14} />
          </button>
        </div>
        {category.children?.length > 0 && <CategoryTree categories={category.children} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />}
      </article>
    ))}
  </div>
);

export const CategoryDrawer = ({ isOpen, onClose }) => {
  const { props } = usePage();
  // Always keep categories in sync with the latest inertia props
  const categories = props.categories || [];
  
  const [form, setForm] = useState({ name: '', parent_id: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSuccess('');
      setError('');
      setEditId(null);
      setForm({ name: '', parent_id: '' });
    }
  }, [isOpen]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
    
    const payload = {
      name: form.name.trim(),
      parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
    };
    
    const options = {
      preserveScroll: true,
      preserveState: true,
      only: ['categories', 'flash'],
      onSuccess: () => {
        setForm({ name: '', parent_id: '' });
        setEditId(null);
        setSuccess(`Category ${editId ? 'updated' : 'saved'} successfully.`);
      },
      onError: (errors) => setError(Object.values(errors)[0] || `Category could not be ${editId ? 'updated' : 'saved'}.`),
      onFinish: () => setSubmitting(false),
    };

    if (editId) {
      router.put(`/categories/${editId}`, payload, options);
    } else {
      router.post('/categories', payload, options);
    }
  };

  const handleEdit = (category) => {
    setEditId(category.id);
    setForm({
      name: category.name,
      parent_id: category.parent_id || '',
    });
    setError('');
    setSuccess('');
    
    // Scroll to top of drawer
    const formElement = document.querySelector('.seller-category-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = (category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?\nAny subcategories will be moved up a level.`)) {
      router.delete(`/categories/${category.id}`, {
        preserveScroll: true,
        preserveState: true,
        only: ['categories', 'flash'],
        onSuccess: () => {
          setSuccess('Category deleted successfully.');
          if (editId === category.id) {
            setEditId(null);
            setForm({ name: '', parent_id: '' });
          }
        },
        onError: () => setError('Category could not be deleted.'),
      });
    }
  };

  return (
    <RightDrawer isOpen={isOpen} onClose={onClose} title="Manage Categories" wide>
        <p className="body-md" style={{ color: 'var(--color-outline)', marginBottom: 12 }}>
          Build your category tree and organize your products.
        </p>

        {(error || success) && (
          <div style={{ color: error ? 'var(--color-error)' : '#2e7d32', fontSize: '14px', fontWeight: 600, marginBottom: 16 }}>
            {error || success}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Add Form */}
          <form className="seller-category-form" onSubmit={submitCategory} style={{ position: 'static', padding: 24, gap: 16, boxShadow: 'none', border: '1px solid rgba(26,28,26,0.08)' }}>
            <div className="seller-category-form-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>{editId ? 'Edit Category' : 'Add New Category'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-outline)' }}>
                  {editId ? 'Update the category details.' : 'Create a top-level category or a subcategory.'}
                </p>
              </div>
              {editId && (
                <button 
                  type="button" 
                  onClick={() => { setEditId(null); setForm({ name: '', parent_id: '' }); }}
                  style={{ background: 'var(--color-surface-container)', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <Input
              label="Category Name *"
              placeholder="E.g. Electronics, Women's Clothing"
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

            <Button type="submit" disabled={submitting} className="seller-category-submit" style={{ width: '100%', justifyContent: 'center' }}>
              {submitting ? 'Saving...' : editId ? 'Update Category' : 'Save Category'}
            </Button>
          </form>

          {/* Tree Display */}
          <div className="seller-category-panel" style={{ padding: 24, boxShadow: 'none', border: '1px solid rgba(26,28,26,0.08)' }}>
            <div className="seller-category-panel-head" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>Category Hierarchy</h3>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              {tree.length > 0 ? (
                <CategoryTree categories={tree} onEdit={handleEdit} onDelete={handleDelete} />
              ) : (
                <div className="seller-category-empty" style={{ minHeight: 150 }}>
                  <FolderTree size={32} />
                  <h3 style={{ fontSize: 15, margin: '8px 0 4px' }}>No categories yet</h3>
                  <p style={{ fontSize: 13, margin: 0 }}>Add your first top-level category above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </RightDrawer>
  );
};
