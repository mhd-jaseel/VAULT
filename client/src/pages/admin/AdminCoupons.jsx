import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { Plus, Edit2, Trash2, X, Tag, Check, Calendar, Percent, IndianRupee, RefreshCw, Sparkles } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AdminCoupons() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [minimumPurchase, setMinimumPurchase] = useState(0);
  const [maximumDiscount, setMaximumDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState(0);
  const [userLimit, setUserLimit] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [excludedProducts, setExcludedProducts] = useState([]);
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [status, setStatus] = useState('active');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const q = search ? `&search=${search}` : '';
      const res = await axios.get(`/admin/coupons?page=${page}&limit=8${q}`);
      if (res.data.success) {
        setCoupons(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const catRes = await axios.get('/categories');
      if (catRes.data.success) setCategories(catRes.data.data);

      const prodRes = await axios.get('/products?limit=100');
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, search]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const generateCode = async (prefix = 'VAULT') => {
    setGeneratingCode(true);
    try {
      const res = await axios.get(`/admin/coupons/generate-code?prefix=${prefix}`);
      if (res.data.success && res.data.code) {
        setCouponCode(res.data.code);
        return res.data.code;
      }
    } catch {
      // Client-side fallback unique generator if network error
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let rand = '';
      for (let i = 0; i < 5; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
      const code = `${prefix}${rand}`.toUpperCase();
      setCouponCode(code);
      return code;
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleOpenAdd = async () => {
    setIsEditing(false);
    setCurrentId(null);
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinimumPurchase(0);
    setMaximumDiscount('');
    setUsageLimit(0);
    setUserLimit(1);
    
    // Set default dates (today to +30 days)
    const today = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setStartDate(today.toISOString().split('T')[0]);
    setExpiryDate(future.toISOString().split('T')[0]);
    
    setSelectedCategories([]);
    setSelectedProducts([]);
    setExcludedProducts([]);
    setFirstOrderOnly(false);
    setFreeShipping(false);
    setStatus('active');
    setIsOpen(true);

    // Automatically generate clean unique code
    await generateCode('VAULT');
  };

  const handleOpenEdit = (cp) => {
    setIsEditing(true);
    setCurrentId(cp._id);
    setCouponCode(cp.couponCode);
    setDescription(cp.description);
    setDiscountType(cp.discountType);
    setDiscountValue(cp.discountValue);
    setMinimumPurchase(cp.minimumPurchase);
    setMaximumDiscount(cp.maximumDiscount || '');
    setUsageLimit(cp.usageLimit);
    setUserLimit(cp.userLimit);
    setStartDate(cp.startDate ? cp.startDate.substring(0, 10) : '');
    setExpiryDate(cp.expiryDate ? cp.expiryDate.substring(0, 10) : '');
    setSelectedCategories(cp.applicableCategories || []);
    setSelectedProducts(cp.applicableProducts || []);
    setExcludedProducts(cp.excludedProducts || []);
    setFirstOrderOnly(cp.firstOrderOnly || false);
    setFreeShipping(cp.freeShipping || false);
    setStatus(cp.status);
    setIsOpen(true);
  };

  const handleToggleStatus = async (cp) => {
    const nextStatus = cp.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await axios.patch(`/admin/coupons/${cp._id}/status`, { status: nextStatus });
      if (res.data.success) {
        toast.success(`Coupon status updated to ${nextStatus}`);
        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Coupon?',
      text: 'Are you sure you want to delete this coupon? This action is irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(`/admin/coupons/${id}`);
      if (res.data.success) {
        toast.success('Coupon deleted successfully');
        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!couponCode || !description || discountValue <= 0) {
      toast.error('Please complete all required fields.');
      return;
    }

    const start = new Date(startDate);
    const expiry = new Date(expiryDate);
    if (expiry <= start) {
      toast.error('Expiry date must be after the start date.');
      return;
    }

    const payload = {
      couponCode: couponCode.toUpperCase().trim(),
      description,
      discountType,
      discountValue: Number(discountValue),
      minimumPurchase: Number(minimumPurchase),
      maximumDiscount: discountType === 'percentage' ? Number(maximumDiscount) : undefined,
      usageLimit: Number(usageLimit),
      userLimit: Number(userLimit),
      startDate,
      expiryDate,
      applicableCategories: selectedCategories,
      applicableProducts: selectedProducts,
      excludedProducts,
      firstOrderOnly,
      freeShipping,
      status
    };

    try {
      setSaving(true);
      if (isEditing) {
        const res = await axios.put(`/admin/coupons/${currentId}`, payload);
        if (res.data.success) {
          toast.success('Coupon updated successfully');
          setIsOpen(false);
          fetchCoupons();
        }
      } else {
        const res = await axios.post('/admin/coupons', payload);
        if (res.data.success) {
          toast.success('Coupon created successfully');
          setIsOpen(false);
          fetchCoupons();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon details');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelection = (id, list, setList) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen text-gray-200">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-white font-display">
            Coupon Codes
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Configure user promo codes, percentage discounts, and order limitations.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-gold text-xs uppercase tracking-widest py-2.5 px-6 flex items-center gap-1.5"
        >
          <Plus size={14} /> Add Coupon
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search coupons..."
          className="form-input text-xs !py-2.5 !px-4 max-w-md bg-dark-card border-dark-border text-gray-200"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSearchParams({ page: 1, search: e.target.value });
          }}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl shimmer-bg" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-2xl">
          <Tag className="text-zinc-600 mb-3 mx-auto" size={32} />
          <p className="text-xs text-zinc-500 font-mono">NO ACTIVE PROMO COUPONS FOUND.</p>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-black/35 text-[10px] font-mono tracking-wider text-zinc-400 uppercase">
                  <th className="p-4">Code</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Min Spend</th>
                  <th className="p-4">Expires</th>
                  <th className="p-4">Used Count</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border text-xs text-zinc-300 font-mono">
                {coupons.map((cp) => (
                  <tr key={cp._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-white tracking-wide">{cp.couponCode}</td>
                    <td className="p-4 uppercase">{cp.discountType}</td>
                    <td className="p-4">
                      {cp.discountType === 'percentage' ? `${cp.discountValue}%` : `₹${cp.discountValue}`}
                    </td>
                    <td className="p-4">₹{cp.minimumPurchase}</td>
                    <td className="p-4 flex items-center gap-1">
                      <Calendar size={12} className="text-zinc-500" />
                      <span>{new Date(cp.expiryDate).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4">
                      {cp.usedCount} {cp.usageLimit > 0 ? `/ ${cp.usageLimit}` : 'used'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(cp)}
                        className={`text-[9px] font-mono font-bold py-1 px-3 rounded-full border transition-all cursor-pointer ${
                          cp.status === 'active'
                            ? 'bg-green-950/20 border-green-500/30 text-green-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                        }`}
                      >
                        {cp.status.toUpperCase()}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(cp)}
                          className="p-2 border border-zinc-800 rounded-lg text-gray-400 hover:text-gold hover:border-gold/30 cursor-pointer"
                          title="Edit coupon"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(cp._id)}
                          className="p-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 hover:border-red-950/40 cursor-pointer"
                          title="Delete coupon"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pages={pages}
            onPageChange={(newPage) => setSearchParams({ page: newPage, search })}
            loading={loading}
          />
        </div>
      )}

      {/* Coupon Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-2xl bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 z-10 text-gray-200">
            <div className="flex items-center justify-between border-b border-dark-border pb-3 mb-4">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white">
                {isEditing ? 'Modify Coupon' : 'Create Coupon'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-mono text-zinc-400 uppercase block">Coupon Code *</label>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => generateCode('VAULT')}
                        disabled={generatingCode}
                        className="text-[10px] font-mono text-gold hover:text-yellow-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        title="Generate a new unique coupon code"
                      >
                        <RefreshCw size={11} className={generatingCode ? 'animate-spin' : ''} />
                        <span>{generatingCode ? 'Generating...' : 'Regenerate'}</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      disabled={isEditing}
                      placeholder="e.g. VAULT500"
                      className={`form-input text-xs bg-black/30 border-dark-border text-white font-mono tracking-wider uppercase font-semibold pr-9 ${
                        isEditing ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    />
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => generateCode('VAULT')}
                        disabled={generatingCode}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-gold transition-colors cursor-pointer"
                        title="Regenerate unique code"
                      >
                        <Sparkles size={14} className={generatingCode ? 'animate-pulse text-gold' : ''} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Get 10% off on all leather goods"
                    className="form-input text-xs bg-black/30 border-dark-border text-white"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Discount Type</label>
                  <select
                    className="form-input text-xs bg-black/30 border-dark-border text-white font-mono cursor-pointer"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Discount value"
                    className="form-input text-xs bg-black/30 border-dark-border text-white"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Min Order Amount *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Min spend limit"
                    className="form-input text-xs bg-black/30 border-dark-border text-white"
                    value={minimumPurchase}
                    onChange={(e) => setMinimumPurchase(e.target.value)}
                  />
                </div>
              </div>

              {discountType === 'percentage' && (
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Max Discount Cap *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Cap amount in Rupees"
                    className="form-input text-xs bg-black/30 border-dark-border text-white"
                    value={maximumDiscount}
                    onChange={(e) => setMaximumDiscount(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Usage Limit (0 = Unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input text-xs bg-black/30 border-dark-border text-white"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Per User Limit</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input text-xs bg-black/30 border-dark-border text-white"
                    value={userLimit}
                    onChange={(e) => setUserLimit(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input text-xs bg-black/30 border-dark-border text-white font-mono"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input text-xs bg-black/30 border-dark-border text-white font-mono"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-dark-border pt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={firstOrderOnly}
                    onChange={(e) => setFirstOrderOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-border bg-black/30 text-gold focus:ring-0"
                  />
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">First Order Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={freeShipping}
                    onChange={(e) => setFreeShipping(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-border bg-black/30 text-gold focus:ring-0"
                  />
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Free Shipping</span>
                </label>
              </div>

              <div className="border-t border-dark-border pt-4">
                <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-2">Applicable To Categories</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto border border-dark-border p-2 rounded-xl bg-black/20">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => toggleSelection(cat._id, selectedCategories, setSelectedCategories)}
                      className={`py-1 px-3 rounded-full text-[9px] font-mono border cursor-pointer transition-colors ${
                        selectedCategories.includes(cat._id)
                          ? 'bg-gold border-gold text-black font-bold'
                          : 'bg-black/40 border-dark-border text-zinc-400'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-dark-border pt-4">
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-2">Eligible Products</label>
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto border border-dark-border p-2 rounded-xl bg-black/20 text-[10px] font-mono">
                    {products.map((prod) => (
                      <label key={prod._id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(prod._id)}
                          onChange={() => toggleSelection(prod._id, selectedProducts, setSelectedProducts)}
                          className="w-3 h-3 rounded border-dark-border text-gold bg-black/20"
                        />
                        <span className="truncate">{prod.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-2">Excluded Products</label>
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto border border-dark-border p-2 rounded-xl bg-black/20 text-[10px] font-mono">
                    {products.map((prod) => (
                      <label key={prod._id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={excludedProducts.includes(prod._id)}
                          onChange={() => toggleSelection(prod._id, excludedProducts, setExcludedProducts)}
                          className="w-3 h-3 rounded border-dark-border text-gold bg-black/20"
                        />
                        <span className="truncate">{prod.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-dark-border pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 px-6 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer font-mono text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-gold py-2.5 px-8 font-mono text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{isEditing ? 'SAVING...' : 'CREATING...'}</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Save Coupon' : 'Create Coupon'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
