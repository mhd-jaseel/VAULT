import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { Plus, Trash2, Edit2, Check, X, ShieldCheck } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AdminBrands() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/admin/brands?page=${page}&limit=5`);
      if (res.data.success) {
        setBrands(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching admin brands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [page]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setIsActive(true);
  };

  const handleEditClick = (brand) => {
    setEditingId(brand._id);
    setName(brand.name);
    setIsActive(brand.isActive);
  };

  const handleToggleActive = async (brand) => {
    try {
      const res = await axios.patch(`/admin/brands/${brand._id}`, {
        isActive: !brand.isActive
      });
      if (res.data.success) {
        toast.success('Brand status updated.');
        fetchBrands();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle brand status.');
    }
  };

  const handleDelete = async (id) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Brand?',
      text: 'Are you sure you want to delete this brand?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;
    try {
      const res = await axios.delete(`/admin/brands/${id}`);
      if (res.data.success) {
        toast.success('Brand deleted successfully.');
        fetchBrands();
        if (editingId === id) resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete brand.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.warning('Brand name is required.');
      return;
    }

    try {
      let res;
      if (editingId) {
        res = await axios.patch(`/admin/brands/${editingId}`, {
          name,
          isActive
        });
      } else {
        res = await axios.post('/admin/brands', {
          name,
          isActive
        });
      }

      if (res.data.success) {
        toast.success(editingId ? 'Brand updated successfully.' : 'New brand added successfully.');
        resetForm();
        fetchBrands();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save brand details.');
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary">
          Manage Brands
        </h1>
        <p className="text-xs text-text-secondary mt-1">Configure and manage brands linked to your catalog products.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Brands list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-1">
              Active Store Brands
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl shimmer-bg" />
                ))}
              </div>
            ) : brands.length === 0 ? (
              <div className="text-center py-10 text-text-secondary text-xs font-mono">
                NO BRANDS REGISTERED.
              </div>
            ) : (
              <div className="space-y-2">
                {brands.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between border border-border-light bg-neutral-50 p-3.5 rounded-2xl gap-4 hover:border-text-primary transition-all duration-300"
                  >
                    <div 
                      onClick={() => handleEditClick(b)}
                      className="min-w-0 cursor-pointer hover:bg-neutral-100 -mx-1.5 px-1.5 py-1 rounded transition-colors group"
                    >
                      <h4 className="font-bold text-xs uppercase tracking-wide text-text-primary group-hover:text-gold group-hover:underline transition-colors">{b.name}</h4>
                      <p className="text-[9px] font-mono text-text-secondary mt-0.5 uppercase group-hover:text-text-primary transition-colors">SLUG: {b.slug}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(b)}
                        className={`text-[9px] font-mono font-bold py-1 px-3.5 rounded-full border transition-all cursor-pointer ${b.isActive
                            ? 'bg-neutral-900 border-neutral-900 text-white'
                            : 'bg-white border-border-light text-neutral-400 hover:text-text-primary'
                          }`}
                      >
                        {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                      <button
                        onClick={() => handleEditClick(b)}
                        className="p-2 rounded-full bg-white border border-border-light text-text-primary hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Edit brand"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(b._id)}
                        className="p-2 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                        title="Delete brand"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              page={page}
              pages={pages}
              onPageChange={(newPage) => setSearchParams({ page: newPage })}
              loading={loading}
            />
          </div>
        </div>

        {/* Create / Edit Form */}
        <div className="glass-card flex flex-col gap-4">
          <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-1">
            {editingId ? 'Edit Brand' : 'Create Brand'}
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Brand Name</label>
              <input
                type="text"
                placeholder="e.g. Omega"
                className="form-input text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-neutral-900 border-border-light focus:ring-neutral-900"
              />
              <label htmlFor="isActive" className="text-[10px] font-mono text-text-primary uppercase font-bold select-none cursor-pointer">Active Brand</label>
            </div>

            <div className="flex gap-2.5 mt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-border-light text-[10px] font-mono tracking-wider text-text-secondary py-3.5 rounded-full hover:bg-neutral-50 hover:text-text-primary transition-colors cursor-pointer bg-white"
                >
                  CANCEL
                </button>
              )}
              <button
                type="submit"
                className="flex-1 btn-gold text-[10px] py-3.5"
              >
                {editingId ? 'UPDATE BRAND' : 'CREATE BRAND'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
