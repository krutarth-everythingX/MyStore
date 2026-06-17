import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Tag, Plus, Trash, Edit2 } from 'lucide-react';
import { RightDrawer } from './RightDrawer';
import { Button } from './Button';
import { Input } from './Input';
import '../pages/SellerCategories.css';

export const AttributeDrawer = ({ isOpen, onClose }) => {
  const { props } = usePage();
  const attributes = props.attributes || [];
  
  const [form, setForm] = useState({ name: '', options: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSuccess('');
      setError('');
      setEditId(null);
      setForm({ name: '', options: '' });
    }
  }, [isOpen]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const submitAttribute = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('Add an attribute name first.');
      return;
    }

    const optionsList = form.options.split(',').map((opt) => opt.trim()).filter(Boolean);

    setSubmitting(true);
    
    const payload = {
      name: form.name.trim(),
      options: optionsList.length > 0 ? optionsList : null,
    };
    
    const requestOptions = {
      preserveScroll: true,
      preserveState: true,
      only: ['attributes', 'flash'],
      onSuccess: () => {
        setForm({ name: '', options: '' });
        setEditId(null);
        setSuccess(`Attribute ${editId ? 'updated' : 'saved'} successfully.`);
      },
      onError: (errors) => setError(Object.values(errors)[0] || `Attribute could not be ${editId ? 'updated' : 'saved'}.`),
      onFinish: () => setSubmitting(false),
    };

    if (editId) {
      router.put(`/seller/attributes/${editId}`, payload, requestOptions);
    } else {
      router.post('/seller/attributes', payload, requestOptions);
    }
  };

  const handleEdit = (attr) => {
    setEditId(attr.id);
    setForm({
      name: attr.name,
      options: (attr.options || []).join(', '),
    });
    setError('');
    setSuccess('');
    
    const formElement = document.querySelector('.seller-category-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const deleteAttribute = (id) => {
    if (!window.confirm('Are you sure you want to delete this attribute?')) return;
    
    router.delete(`/seller/attributes/${id}`, {
      preserveScroll: true,
      preserveState: true,
      only: ['attributes', 'flash'],
    });
  };

  return (
    <RightDrawer isOpen={isOpen} onClose={onClose} title="Manage Attributes" wide>
        <p className="body-md" style={{ color: 'var(--color-outline)', marginBottom: 12 }}>
          Create global product attributes like Size, Color, or Material.
        </p>

        {(error || success) && (
          <div style={{ color: error ? 'var(--color-error)' : '#2e7d32', fontSize: '14px', fontWeight: 600, marginBottom: 16 }}>
            {error || success}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Add Form */}
          <form className="seller-category-form" onSubmit={submitAttribute} style={{ position: 'static', padding: 24, gap: 16, boxShadow: 'none', border: '1px solid rgba(26,28,26,0.08)' }}>
            <div className="seller-category-form-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>{editId ? 'Edit Attribute' : 'Add New Attribute'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-outline)' }}>
                  {editId ? 'Update the attribute details.' : 'Define a new attribute and its default options.'}
                </p>
              </div>
              {editId && (
                <button 
                  type="button" 
                  onClick={() => { setEditId(null); setForm({ name: '', options: '' }); }}
                  style={{ background: 'var(--color-surface-container)', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <Input
                label="Attribute Name *"
                placeholder="E.g. Color, Size, Material"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />

              <div className="input-container" style={{ marginBottom: 0 }}>
                <label className="input-label label-md">Options (comma-separated)</label>
                <textarea
                  className="input-field"
                  rows="1"
                  style={{ minHeight: '44px', padding: '10px 14px' }}
                  placeholder="E.g. Red, Blue, Green"
                  value={form.options}
                  onChange={(event) => setForm((current) => ({ ...current, options: event.target.value }))}
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="seller-category-submit" style={{ width: '100%', justifyContent: 'center' }}>
              {submitting ? 'Saving...' : editId ? 'Update Attribute' : 'Save Attribute'}
            </Button>
          </form>

          {/* List Display */}
          <div className="seller-category-panel" style={{ padding: 24, boxShadow: 'none', border: '1px solid rgba(26,28,26,0.08)' }}>
            <div className="seller-category-panel-head" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>Existing Attributes</h3>
              </div>
            </div>

            {attributes.length === 0 ? (
              <div className="seller-category-empty" style={{ minHeight: 150 }}>
                <Tag size={32} />
                <h3 style={{ fontSize: 15, margin: '8px 0 4px' }}>No attributes yet</h3>
                <p style={{ fontSize: 13, margin: 0 }}>Add your first global attribute above.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attributes.map((attr) => (
                  <article key={attr.id} style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-surface-container)', padding: '16px', borderRadius: '12px', width: '100%', gap: '12px', border: '1px solid rgba(26,28,26,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-on-surface)' }}>{attr.name}</h3>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button type="button" onClick={() => handleEdit(attr)} style={{ background: '#fff', padding: '6px', borderRadius: '6px', border: '1px solid var(--color-outline-variant)', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button type="button" onClick={() => deleteAttribute(attr.id)} style={{ background: 'var(--color-error-container)', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete">
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                    {attr.options?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-outline-variant)' }}>
                        {attr.options.map((opt, i) => (
                          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', color: 'var(--color-on-surface)' }}>
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
    </RightDrawer>
  );
};
