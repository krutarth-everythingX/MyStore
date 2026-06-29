import React, { useEffect, useState } from 'react';
import { Image, Plus, Save, Upload, X, Tag } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { DismissibleAlert } from './DismissibleAlert';
import { SellerModalBackdrop } from './seller-workspace';
const emptyBrand = {
  name: '',
  website: '',
  logo: '',
  logoSource: 'auto'
};
const normalizeWebsiteUrl = value => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};
const faviconUrlFromWebsite = value => {
  const candidates = faviconCandidatesFromWebsite(value);
  return candidates[0] || '';
};
const faviconCandidatesFromWebsite = value => {
  try {
    const url = new URL(normalizeWebsiteUrl(value));
    return [`${url.origin}/favicon.ico`, `${url.origin}/favicon.svg`, `${url.origin}/apple-touch-icon.png`, `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url.hostname)}&sz=128`, `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`];
  } catch (error) {
    return [];
  }
};
export const BrandDrawer = ({
  isOpen,
  onClose,
  onCreated,
  editingBrand = null
}) => {
  const [form, setForm] = useState(emptyBrand);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [autoLogoIndex, setAutoLogoIndex] = useState(0);
  const [resolvedLogo, setResolvedLogo] = useState('');
  const [resolvedFallbacks, setResolvedFallbacks] = useState([]);
  const [resolvingLogo, setResolvingLogo] = useState(false);
  const autoLogoCandidates = form.logoSource === 'upload' ? [] : [...(resolvedLogo ? [resolvedLogo] : []), ...resolvedFallbacks, ...faviconCandidatesFromWebsite(form.website)].filter((value, index, list) => value && list.indexOf(value) === index);
  const previewLogo = form.logoSource === 'upload' ? form.logo : autoLogoCandidates[autoLogoIndex] || form.logo || '';
  useEffect(() => {
    if (isOpen && editingBrand) {
      setForm({
        name: editingBrand.name || '',
        website: editingBrand.website_url || '',
        logo: editingBrand.logo || '',
        logoSource: editingBrand.website_url ? 'auto' : 'upload'
      });
      setError('');
      setSuccess('');
      setSubmitting(false);
      setUploadingLogo(false);
      setAutoLogoIndex(0);
      setResolvedLogo('');
      setResolvedFallbacks([]);
      setResolvingLogo(false);
      return;
    }
    if (!isOpen) {
      setForm(emptyBrand);
      setError('');
      setSuccess('');
      setSubmitting(false);
      setUploadingLogo(false);
      setAutoLogoIndex(0);
      setResolvedLogo('');
      setResolvedFallbacks([]);
      setResolvingLogo(false);
    }
  }, [editingBrand, isOpen]);
  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(''), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);
  useEffect(() => {
    if (!isOpen || form.logoSource === 'upload' || !form.website.trim()) {
      setResolvingLogo(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setResolvingLogo(true);
      try {
        const response = await fetch(`/brands/resolve-logo?url=${encodeURIComponent(form.website)}`, {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'same-origin',
          signal: controller.signal
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && !controller.signal.aborted) {
          setResolvedLogo(data?.logo || '');
          setResolvedFallbacks(Array.isArray(data?.fallbacks) ? data.fallbacks : []);
          setAutoLogoIndex(0);
        }
      } catch (resolveError) {
        if (!controller.signal.aborted) {
          setResolvedLogo('');
          setResolvedFallbacks([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setResolvingLogo(false);
        }
      }
    }, 500);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.logoSource, form.website, isOpen]);
  const submitBrand = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim()) {
      setError('Brand name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const isEditing = Boolean(editingBrand?.id);
      const logo = form.logoSource === 'upload' ? form.logo.trim() : previewLogo;
      const response = await fetch(isEditing ? `/brands/${editingBrand.id}` : '/brands', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: form.name.trim(),
          logo: logo || null,
          website_url: normalizeWebsiteUrl(form.website) || null
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.errors ? Object.values(data.errors).flat()[0] : data?.message || 'Brand could not be created.';
        throw new Error(message);
      }
      const brand = {
        ...data,
        products_count: data.products_count || 0
      };
      onCreated?.(brand);
      setSuccess(isEditing ? 'Brand updated successfully.' : 'Brand created successfully.');
      if (!isEditing) {
        setForm(emptyBrand);
      }
    } catch (submitError) {
      setError(submitError.message || 'Brand could not be created.');
    } finally {
      setSubmitting(false);
    }
  };
  const uploadLogoFile = async file => {
    if (!file) return;
    setError('');
    setSuccess('');
    setUploadingLogo(true);
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
      if (!response.ok) throw new Error(data?.message || 'Logo upload failed.');
      setForm(current => ({
        ...current,
        logo: data?.url || '',
        logoSource: 'upload'
      }));
      setSuccess('Logo uploaded successfully.');
    } catch (uploadError) {
      setError(uploadError.message || 'Logo upload failed.');
    } finally {
      setUploadingLogo(false);
    }
  };
  if (!isOpen) return null;
  return <SellerModalBackdrop onClose={onClose}>
      <div className="w-full max-w-4xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm" onMouseDown={event => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-neutral-200 pb-5">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white text-neutral-950">
              <Tag size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-neutral-950">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h3>
              <p className="mt-1 text-sm leading-6 text-neutral-500">
                {editingBrand ? 'Update this brand name and logo.' : 'Add a brand website to auto-detect its logo, or upload your own image.'}
              </p>
            </div>
          </div>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950" onClick={onClose} aria-label="Close brand modal">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          {(error || success) && <DismissibleAlert onClose={() => {
          setError('');
          setSuccess('');
        }} role={error ? 'alert' : 'status'}>
              {error || success}
            </DismissibleAlert>}

          <form onSubmit={submitBrand} className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-5">
              <div className="border border-neutral-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center border border-neutral-200 bg-neutral-950 text-white">
                    {form.logo || faviconUrlFromWebsite(form.website) ? <img src={previewLogo} alt="" className="h-full w-full object-contain bg-white p-1" onError={() => setAutoLogoIndex(current => current < autoLogoCandidates.length - 1 ? current + 1 : current)} /> : <Image size={22} />}
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-base font-bold text-neutral-950">{form.name || 'Brand name'}</strong>
                    <small className="mt-1 block truncate text-sm text-neutral-500">{resolvingLogo ? 'Finding logo...' : previewLogo || 'No logo URL added'}</small>
                  </div>
                </div>

                <div className="flex min-h-[176px] items-center justify-center border border-dashed border-neutral-200 bg-neutral-50 p-4">
                  {form.logo || faviconUrlFromWebsite(form.website) ? <img src={previewLogo} alt="" className="max-h-36 w-auto max-w-full object-contain" onError={() => setAutoLogoIndex(current => current < autoLogoCandidates.length - 1 ? current + 1 : current)} /> : <div className="flex flex-col items-center gap-3 text-center text-neutral-400">
                      <Image size={30} />
                      <span className="text-sm">Logo preview will appear here</span>
                    </div>}
                </div>
              </div>

              <label className="block border border-neutral-200 bg-white p-4">
                <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-neutral-950">
                  <Upload size={16} />
                  {uploadingLogo ? 'Uploading logo...' : 'Upload Logo Image'}
                </span>
                <small className="block text-sm leading-6 text-neutral-500">PNG, JPG, GIF, WEBP, or SVG up to 2MB. Uploaded image overrides the website logo.</small>
                <input className="mt-4 block w-full text-sm text-neutral-600 file:mr-4 file:border file:border-neutral-950 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-neutral-950 hover:file:bg-neutral-50" type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml" disabled={uploadingLogo} onChange={event => uploadLogoFile(event.target.files?.[0])} />
              </label>
            </div>

            <div className="space-y-5">
              <div className="border border-neutral-200 bg-white p-5">
                <Input label="Brand Name" placeholder="Urban Loom" className="space-y-2" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500" inputClassName="h-12 rounded-none border border-neutral-200 px-3.5 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0" value={form.name} onChange={event => setForm(current => ({
                ...current,
                name: event.target.value
              }))} />

                <Input label="Brand Website URL" type="text" inputMode="url" className="mt-5 space-y-2" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500" inputClassName="h-12 rounded-none border border-neutral-200 px-3.5 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0" placeholder="brand.com" value={form.website} onChange={event => {
                const website = event.target.value;
                setAutoLogoIndex(0);
                setResolvedLogo('');
                setResolvedFallbacks([]);
                setForm(current => ({
                  ...current,
                  website,
                  logo: '',
                  logoSource: 'auto'
                }));
              }} />
              </div>

              <div className="flex justify-end gap-3 border-t border-neutral-200 pt-5">
                <Button type="button" variant="outline" className="min-h-11 rounded-none border border-neutral-200 px-4" onClick={onClose}>
                  <X size={14} />
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="min-h-11 rounded-none border border-neutral-200 px-4" disabled={submitting}>
                  {editingBrand ? <Save size={16} /> : <Plus size={16} />}
                  {submitting ? 'Saving...' : editingBrand ? 'Update Brand' : 'Create'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </SellerModalBackdrop>;
};
export default BrandDrawer;
