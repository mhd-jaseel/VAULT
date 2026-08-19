import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { Plus, Edit2, Trash2, X, Tag, Check, Calendar, Percent, IndianRupee, RefreshCw, Sparkles, Search, Layers, Ban } from 'lucide-react';
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
  const [discountValue, setDiscountValue] = useState(10);
  const [minimumPurchase, setMinimumPurchase] = useState(0);
  const [maximumDiscount, setMaximumDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState(0);
  const [userLimit, setUserLimit] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [excludedProducts, setExcludedProducts] = useState([]);
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [status, setStatus] = useState('active');

  // Product exclusion search filter
  const [excludedSearch, setExcludedSearch] = useState('');

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

      const prodRes = await axios.get('/products?limit=200');
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
    
    setSelectedCategories([]); // Empty means "ALL PRODUCTS"
    setExcludedProducts([]);
    setExcludedSearch('');
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
    setExcludedProducts(cp.excludedProducts || []);
    setExcludedSearch('');
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

  // Category selection handlers with ALL PRODUCTS logic
  const handleSelectAllProducts = () => {
    setSelectedCategories([]); // Empty array represents ALL PRODUCTS
  };

  const handleToggleCategory = (catId) => {
    const idStr = String(catId);
    if (selectedCategories.includes(idStr)) {
      const next = selectedCategories.filter(id => id !== idStr);
      setSelectedCategories(next);
    } else {
      setSelectedCategories([...selectedCategories, idStr]);
    }
  };

  const toggleExcludedProduct = (prodId) => {
    const idStr = String(prodId);
    if (excludedProducts.includes(idStr)) {
      setExcludedProducts(excludedProducts.filter(id => id !== idStr));
    } else {
      setExcludedProducts([...excludedProducts, idStr]);
    }
  };

  // Filtered excluded products for search in modal
  const filteredProductsForExclusion = useMemo(() => {
    if (!excludedSearch.trim()) return products;
    const q = excludedSearch.toLowerCase();
    return products.filter(p => p.name && p.name.toLowerCase().includes(q));
  }, [products, excludedSearch]);

  const isAllProductsSelected = selectedCategories.length === 0;

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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6 z-10 text-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                  <Tag size={15} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider text-neutral-900">
                    {isEditing ? 'Modify Coupon' : 'Create Coupon'}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {isEditing ? 'Update coupon rules, discounts and categories' : 'Configure new promo voucher for customer checkout'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[76vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono font-semibold text-neutral-700 uppercase block">Coupon Code *</label>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => generateCode('VAULT')}
                        disabled={generatingCode}
                        className="text-[10px] font-mono font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
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
                      className={`form-input text-xs bg-neutral-50 border-neutral-300 text-neutral-900 font-mono tracking-wider uppercase font-bold pr-9 focus:bg-white ${
                        isEditing ? 'opacity-70 cursor-not-allowed bg-neutral-100' : ''
                      }`}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    />
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => generateCode('VAULT')}
                        disabled={generatingCode}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
                        title="Regenerate unique code"
                      >
                        <Sparkles size={14} className={generatingCode ? 'animate-pulse text-amber-500' : ''} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-semibold text-neutral-700 uppercase block mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Get 10% off on premium accessories"
                    className="form-input text-xs bg-neutral-50 border-neutral-300 text-neutral-900 focus:bg-white"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-semibold text-neutral-700 uppercase block mb-1">Discount Type</label>
                  <select
                    className="form-input text-xs bg-neutral-50 border-neutral-300 text-neutral-900 font-mono cursor-pointer focus:bg-white"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-semibold text-neutral-700 uppercase block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder="Discount value"
                    className="form-input text-xs bg-neutral-50 border-neutral-300 text-neutral-900 font-mono focus:bg-white"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-semibold text-neutral-700 uppercase block mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Min spend limit"
                    className="form-input text-xs bg-neutral-50 border-neutral-300 text-neutral-900 font-mono focus:bg-white"
                    value={minimumPurchase}
                    onChange={(e) => setMinimumPurchase(e.target.value)}
                  />
                </div>
              </div>

              {discountType === 'percentage' && (
                <div>
                  <label className="text-[10px] font-mono font-semibold text-neutral-700 uppercase block mb-1">Max Discount Cap (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Maximum discount cap amount in Rupees"
                    className="form-input text-xs bg-neutral-50 border-neutral-300 text-neutral-900 font-mono focus:bg-white"
                    value={maximumDiscount}
                    onChange={(e) => setMaximumDiscount(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-semibold text-neutral-700 uppercase block mb-1">Usage Limit (0 = Unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input text-xs bg-neutral-50 border-neutral-300 text-neutral-900 font-mono focus:bg-white"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-semibold text-neutral-700 uppercase block mb-1">Per User Limit</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input text-xs bg-neutral-50 border-neutral-300 text-neutral-900 font-mono focus:bg-white"
                    value={userLimit}
                    onChange={(e) => setUserLimit(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-semibold text-neutral-700 uppercase block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input text-xs bg-neutral-50 border-neutral-300 text-neutral-900 font-mono focus:bg-white"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-semibold text-neutral-700 uppercase block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input text-xs bg-neutral-50 border-neutral-300 text-neutral-900 font-mono focus:bg-white"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 pt-3">
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer select-none hover:bg-neutral-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={firstOrderOnly}
                    onChange={(e) => setFirstOrderOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-neutral-900 uppercase block">First Order Only</span>
                    <span className="text-[9px] text-neutral-500 font-mono block">New customers only</span>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer select-none hover:bg-neutral-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={freeShipping}
                    onChange={(e) => setFreeShipping(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-neutral-900 uppercase block">Free Shipping</span>
                    <span className="text-[9px] text-neutral-500 font-mono block">Waives delivery fees</span>
                  </div>
                </label>
              </div>

              {/* Category Selection Container - High Contrast Light Theme */}
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Layers size={14} className="text-neutral-700" />
                    <label className="text-[10px] font-mono font-bold text-neutral-800 uppercase tracking-wider">
                      Applicable to Categories
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {isAllProductsSelected
                      ? 'Applies to all products'
                      : `${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'} selected`}
                  </span>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 shadow-inner">
                  <div className="flex flex-wrap gap-2">
                    {/* ALL PRODUCTS Chip */}
                    <button
                      type="button"
                      onClick={handleSelectAllProducts}
                      className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer border ${
                        isAllProductsSelected
                          ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                          : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100'
                      }`}
                    >
                      {isAllProductsSelected && <Check size={12} strokeWidth={3} />}
                      <span>ALL PRODUCTS</span>
                    </button>

                    {/* Dynamic Category Chips */}
                    {categories.map((cat) => {
                      const isSelected = selectedCategories.includes(String(cat._id));
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => handleToggleCategory(cat._id)}
                          className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                              : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Excluded Products Section - High Contrast Light Theme */}
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Ban size={14} className="text-neutral-700" />
                    <label className="text-[10px] font-mono font-bold text-neutral-800 uppercase tracking-wider">
                      Excluded Products (Optional)
                    </label>
                  </div>
                  {excludedProducts.length > 0 && (
                    <span className="text-[10px] font-mono text-neutral-500">
                      {excludedProducts.length} product{excludedProducts.length === 1 ? '' : 's'} excluded
                    </span>
                  )}
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 space-y-2.5">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search products to exclude..."
                      className="w-full bg-white border border-neutral-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 font-mono"
                      value={excludedSearch}
                      onChange={(e) => setExcludedSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1 divide-y divide-neutral-100">
                    {filteredProductsForExclusion.length === 0 ? (
                      <p className="text-[10px] text-neutral-400 font-mono text-center py-4">No matching products found.</p>
                    ) : (
                      filteredProductsForExclusion.map((prod) => {
                        const isExcluded = excludedProducts.includes(String(prod._id));
                        return (
                          <label
                            key={prod._id}
                            className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                              isExcluded ? 'bg-neutral-200/70' : 'hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isExcluded}
                                onChange={() => toggleExcludedProduct(prod._id)}
                                className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer shrink-0"
                              />
                              <span className={`text-[11px] font-mono truncate ${isExcluded ? 'font-bold text-neutral-900' : 'text-neutral-700'}`}>
                                {prod.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                              ₹{prod.price}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 px-6 border border-neutral-300 rounded-full text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-all cursor-pointer font-mono text-xs uppercase font-semibold"
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

