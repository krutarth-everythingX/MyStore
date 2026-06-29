import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Sidebar } from '../components/Sidebar';
import { SellerPageShell, SellerPageHeader } from '../components/seller-workspace';
import { Button } from '../components/Button';
import { Plus, Users, Warehouse, Search, Building2, Package, X, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function SellerProcurement() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('vendors');
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Vendor Form State
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorForm, setVendorForm] = useState({ name: '', reference_code: '', email: '', phone: '', contact_person: '' });

  // New Warehouse Form State
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: '', code: '', type: 'fulfillment', address: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vendorsRes, warehousesRes] = await Promise.all([
        window.axios.get(`/api/vendors?_t=${Date.now()}`),
        window.axios.get(`/api/warehouses?_t=${Date.now()}`)
      ]);
      setVendors(vendorsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      showToast('Failed to load procurement data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitVendor = async (e) => {
    e.preventDefault();
    try {
      if (vendorForm.id) {
        const res = await window.axios.put(`/api/vendors/${vendorForm.id}`, vendorForm);
        setVendors(vendors.map(v => v.id === res.data.id ? res.data : v));
        showToast('Vendor updated successfully', 'success');
      } else {
        const res = await window.axios.post('/api/vendors', vendorForm);
        setVendors([res.data, ...vendors]);
        showToast('Vendor added successfully', 'success');
      }
      setShowVendorForm(false);
      setVendorForm({ name: '', reference_code: '', email: '', phone: '', contact_person: '' });
    } catch (error) {
      showToast('Failed to save vendor', 'error');
    }
  };

  const deleteVendor = async (id) => {
    if (!confirm('Are you sure you want to remove this vendor?')) return;
    try {
      await window.axios.delete(`/api/vendors/${id}`);
      setVendors(vendors.filter(v => v.id !== id));
      showToast('Vendor removed successfully', 'success');
    } catch (error) {
      showToast('Failed to remove vendor', 'error');
    }
  };

  const submitWarehouse = async (e) => {
    e.preventDefault();
    try {
      if (warehouseForm.id) {
        const res = await window.axios.put(`/api/warehouses/${warehouseForm.id}`, warehouseForm);
        setWarehouses(warehouses.map(w => w.id === res.data.id ? res.data : w));
        showToast('Warehouse updated successfully', 'success');
      } else {
        const res = await window.axios.post('/api/warehouses', warehouseForm);
        setWarehouses([res.data, ...warehouses]);
        showToast('Warehouse added successfully', 'success');
      }
      setShowWarehouseForm(false);
      setWarehouseForm({ name: '', code: '', type: 'fulfillment', address: '' });
    } catch (error) {
      showToast('Failed to save warehouse', 'error');
    }
  };

  const deleteWarehouse = async (id) => {
    if (!confirm('Are you sure you want to remove this warehouse?')) return;
    try {
      await window.axios.delete(`/api/warehouses/${id}`);
      setWarehouses(warehouses.filter(w => w.id !== id));
      showToast('Warehouse removed successfully', 'success');
    } catch (error) {
      showToast('Failed to remove warehouse', 'error');
    }
  };

  const fieldClassName = "w-full border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-950";

  return (
    <>
      <Sidebar />
      <SellerPageShell>
      <Head title="Vendors & Warehouses" />
      
      <SellerPageHeader 
        title="Vendors & Warehouses" 
        description="Manage your subcontractors, suppliers, and fulfillment locations."
        action={
          <div className="flex gap-2">
            <Button onClick={() => setActiveTab('vendors')} variant={activeTab === 'vendors' ? 'primary' : 'outline'} className="min-h-10 rounded-none border border-neutral-200 px-4">
              <Users size={16} className="mr-2" /> Vendors
            </Button>
            <Button onClick={() => setActiveTab('warehouses')} variant={activeTab === 'warehouses' ? 'primary' : 'outline'} className="min-h-10 rounded-none border border-neutral-200 px-4">
              <Warehouse size={16} className="mr-2" /> Warehouses
            </Button>
          </div>
        }
      />

      <div className="mt-6 border border-neutral-200 bg-white shadow-sm">
        {activeTab === 'vendors' && (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-950">Subcontractors & Vendors</h2>
              {!showVendorForm && (
                <Button onClick={() => setShowVendorForm(true)} className="rounded-none">
                  <Plus size={16} className="mr-2" /> Add Vendor
                </Button>
              )}
            </div>

            {showVendorForm && (
              <div className="fixed inset-0 z-[90] flex items-center justify-center bg-neutral-950/35 px-4 py-6" onMouseDown={() => { setShowVendorForm(false); setVendorForm({ name: '', reference_code: '', email: '', phone: '', contact_person: '' }); }}>
                <div className="relative flex w-full max-w-lg flex-col border border-neutral-200 bg-white p-6 shadow-xl" onMouseDown={e => e.stopPropagation()}>
                  <div className="mb-6 flex items-start justify-between">
                    <h3 className="text-xl font-bold text-neutral-950">{vendorForm.id ? 'Edit Vendor' : 'Add New Vendor'}</h3>
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950" onClick={() => { setShowVendorForm(false); setVendorForm({ name: '', reference_code: '', email: '', phone: '', contact_person: '' }); }}>
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={submitVendor}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Vendor / Subcontractor Name *</label>
                        <input className={fieldClassName} required value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Reference Code</label>
                        <input className={fieldClassName} value={vendorForm.reference_code} onChange={e => setVendorForm({...vendorForm, reference_code: e.target.value})} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Contact Email</label>
                        <input type="email" className={fieldClassName} value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Phone</label>
                        <input className={fieldClassName} value={vendorForm.phone} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3 border-t border-neutral-200 pt-5">
                      <Button type="button" variant="outline" className="rounded-none border-neutral-200" onClick={() => { setShowVendorForm(false); setVendorForm({ name: '', reference_code: '', email: '', phone: '', contact_person: '' }); }}>Cancel</Button>
                      <Button type="submit" className="rounded-none">Save Vendor</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-sm text-neutral-500">Loading vendors...</p>
            ) : vendors.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vendors.map(vendor => (
                  <div key={vendor.id} className="border border-neutral-200 bg-white p-4 flex flex-col">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <strong className="text-lg font-bold text-neutral-950">{vendor.name}</strong>
                        {vendor.reference_code && <span className="bg-neutral-100 px-2 py-1 text-xs font-semibold uppercase text-neutral-600">{vendor.reference_code}</span>}
                      </div>
                      {vendor.email && <p className="text-sm text-neutral-600">{vendor.email}</p>}
                      {vendor.phone && <p className="text-sm text-neutral-600">{vendor.phone}</p>}
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-4 border-t border-neutral-100 pt-3">
                      <button onClick={() => { setVendorForm(vendor); setShowVendorForm(true); }} className="text-sm font-semibold text-neutral-500 hover:text-neutral-950 flex items-center gap-1.5 transition"><Edit size={14}/> Edit</button>
                      <button onClick={() => deleteVendor(vendor.id)} className="text-sm font-semibold text-red-500 hover:text-red-700 flex items-center gap-1.5 transition"><Trash2 size={14}/> Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 size={48} className="mb-4 text-neutral-300" />
                <p className="text-lg font-bold text-neutral-950">No vendors added yet</p>
                <p className="mt-1 text-sm text-neutral-500">Add your first subcontractor or supplier to use in your product catalog.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'warehouses' && (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-950">Fulfillment Locations</h2>
              {!showWarehouseForm && (
                <Button onClick={() => setShowWarehouseForm(true)} className="rounded-none">
                  <Plus size={16} className="mr-2" /> Add Warehouse
                </Button>
              )}
            </div>

            {showWarehouseForm && (
              <div className="fixed inset-0 z-[90] flex items-center justify-center bg-neutral-950/35 px-4 py-6" onMouseDown={() => { setShowWarehouseForm(false); setWarehouseForm({ name: '', code: '', type: 'fulfillment', address: '' }); }}>
                <div className="relative flex w-full max-w-lg flex-col border border-neutral-200 bg-white p-6 shadow-xl" onMouseDown={e => e.stopPropagation()}>
                  <div className="mb-6 flex items-start justify-between">
                    <h3 className="text-xl font-bold text-neutral-950">{warehouseForm.id ? 'Edit Warehouse' : 'Add New Warehouse'}</h3>
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950" onClick={() => { setShowWarehouseForm(false); setWarehouseForm({ name: '', code: '', type: 'fulfillment', address: '' }); }}>
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={submitWarehouse}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Location Name *</label>
                        <input className={fieldClassName} required value={warehouseForm.name} onChange={e => setWarehouseForm({...warehouseForm, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Location Code</label>
                        <input className={fieldClassName} value={warehouseForm.code} onChange={e => setWarehouseForm({...warehouseForm, code: e.target.value})} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-neutral-950">Address</label>
                        <input className={fieldClassName} value={warehouseForm.address} onChange={e => setWarehouseForm({...warehouseForm, address: e.target.value})} />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3 border-t border-neutral-200 pt-5">
                      <Button type="button" variant="outline" className="rounded-none border-neutral-200" onClick={() => { setShowWarehouseForm(false); setWarehouseForm({ name: '', code: '', type: 'fulfillment', address: '' }); }}>Cancel</Button>
                      <Button type="submit" className="rounded-none">Save Warehouse</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-sm text-neutral-500">Loading warehouses...</p>
            ) : warehouses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {warehouses.map(wh => (
                  <div key={wh.id} className="border border-neutral-200 bg-white p-4 flex flex-col">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <strong className="text-lg font-bold text-neutral-950">{wh.name}</strong>
                        {wh.code && <span className="bg-neutral-100 px-2 py-1 text-xs font-semibold uppercase text-neutral-600">{wh.code}</span>}
                      </div>
                      {wh.address && <p className="text-sm text-neutral-600">{wh.address}</p>}
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-4 border-t border-neutral-100 pt-3">
                      <button onClick={() => { setWarehouseForm(wh); setShowWarehouseForm(true); }} className="text-sm font-semibold text-neutral-500 hover:text-neutral-950 flex items-center gap-1.5 transition"><Edit size={14}/> Edit</button>
                      <button onClick={() => deleteWarehouse(wh.id)} className="text-sm font-semibold text-red-500 hover:text-red-700 flex items-center gap-1.5 transition"><Trash2 size={14}/> Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package size={48} className="mb-4 text-neutral-300" />
                <p className="text-lg font-bold text-neutral-950">No warehouses added yet</p>
                <p className="mt-1 text-sm text-neutral-500">Create fulfillment locations to manage stock and channel synchronization.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </SellerPageShell>
    </>
  );
}
