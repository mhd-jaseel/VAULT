import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { Plus, Edit2, Trash2, X, Tag, Check, Calendar, Percent, IndianRupee } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AdminDiscounts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  const [discounts, setDiscounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [discountName, setDiscountName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [applyType, setApplyType] = useState('product');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');
  const [showOnHomepage, setShowOnHomepage] = useState(false);
  const [priority, setPriority] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const q = search ? `&search=${search}` : '';
      const res = await axios.get(`/admin/discounts?page=${page}&limit=8${q}`);
      if (res.data.success) {
        setDiscounts(res.data.data);
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
    fetchDiscounts();
  }, [page, search]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setDiscountName('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(0);
    setApplyType('product');
    setSelectedProduct('');
    setSelectedCategory('');
    setSelectedProducts([]);
    setStartDate('');
    setEndDate('');
    setStatus('active');
    setShowOnHomepage(false);
    setPriority(0);
    setShowCountdown(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (ds) => {
    setIsEditing(true);
    setCurrentId(ds._id);
    setDiscountName(ds.discountName);
    setDescription(ds.description);
    setDiscountType(ds.discountType);
    setDiscountValue(ds.discountValue);
    setApplyType(ds.applyType);
    setSelectedProduct(ds.product?._id || ds.product || '');
    setSelectedCategory(ds.category?._id || ds.category || '');
    setSelectedProducts(ds.selectedProducts || []);
    setStartDate(ds.startDate ? ds.startDate.substring(0, 10) : '');
    setEndDate(ds.endDate ? ds.endDate.substring(0, 10) : '');
    setStatus(ds.status);
    setShowOnHomepage(ds.showOnHomepage || false);
    setPriority(ds.priority || 0);
    setShowCountdown(ds.showCountdown || false);
    setIsOpen(true);
  };

  const handleToggleStatus = async (ds) => {
    const nextStatus = ds.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await axios.patch(`/admin/discounts/${ds._id}/status`, { status: nextStatus });
      if (res.data.success) {
        toast.success(`Discount status updated to ${nextStatus}`);
        fetchDiscounts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Discount?',
      text: 'Are you sure you want to delete this discount setting? Product prices will recalculate immediately.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(`/admin/discounts/${id}`);
      if (res.data.success) {
        toast.success('Discount removed successfully');
        fetchDiscounts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete discount');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!discountName || !description || discountValue <= 0) {
      toast.error('Please complete all required fields.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (endDate && end <= start) {
      toast.error('End date must be after the start date.');
      return;
    }

    if (showCountdown === true && !endDate) {
      toast.error('End Date is required when Countdown Timer is enabled.');
      return;
    }

    // Apply validations based on type
    if (applyType === 'product' && !selectedProduct) {
      toast.error('Please select a target product.');
      return;
    }
    if (applyType === 'category' && !selectedCategory) {
      toast.error('Please select a target category.');
      return;
    }
    if (applyType === 'selectedProducts' && selectedProducts.length === 0) {
      toast.error('Please select at least one product.');
      return;
    }

    const payload = {
      discountName,
      description,
      discountType,
      discountValue: Number(discountValue),
      applyType,
      product: applyType === 'product' ? selectedProduct : undefined,
      category: applyType === 'category' ? selectedCategory : undefined,
      selectedProducts: applyType === 'selectedProducts' ? selectedProducts : undefined,
      startDate,
      endDate,
      status,
      showOnHomepage,
      priority: Number(priority),
      showCountdown
    };

    try {
      if (isEditing) {
        const res = await axios.put(`/admin/discounts/${currentId}`, payload);
        if (res.data.success) {
          toast.success('Discount updated successfully');
          setIsOpen(false);
          fetchDiscounts();
        }
      } else {
        const res = await axios.post('/admin/discounts', payload);
        if (res.data.success) {
          toast.success('Discount created successfully');
          setIsOpen(false);
          fetchDiscounts();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save discount details');
    }
  };

  const toggleSelection = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen text-gray-200">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-white font-display">
            Active Store Discounts
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Setup flash sales, category markdowns, or special individual product discounts.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-gold text-xs uppercase tracking-widest py-2.5 px-6 flex items-center gap-1.5"
        >
          <Plus size={14} /> Create Offer
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search discounts..."
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
      ) : discounts.length === 0 ? (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-2xl">
          <Tag className="text-zinc-600 mb-3 mx-auto" size={32} />
          <p className="text-xs text-zinc-500 font-mono">NO ACTIVE CAMPAIGN OFFERS FOUND.</p>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-black/35 text-[10px] font-mono tracking-wider text-zinc-400 uppercase">
                  <th className="p-4">Offer Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Scope</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4">Home</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border text-xs text-zinc-300 font-mono">
                {discounts.map((ds) => (
                  <tr key={ds._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-white tracking-wide">{ds.discountName}</td>
                    <td className="p-4 uppercase">{ds.discountType}</td>
                    <td className="p-4">
                      {ds.discountType === 'percentage' ? `${ds.discountValue}%` : `₹${ds.discountValue}`}
                    </td>
                    <td className="p-4 uppercase text-[10px]">
                      {ds.applyType === 'product' && `Product: ${ds.product?.name || 'Selected Item'}`}
                      {ds.applyType === 'category' && `Category: ${ds.category?.name || 'Selected Section'}`}
                      {ds.applyType === 'selectedProducts' && 'Selected Products'}
                    </td>
                    <td className="p-4 flex items-center gap-1">
                      <Calendar size={12} className="text-zinc-500" />
                      <span>{new Date(ds.endDate).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4">{ds.showOnHomepage ? 'YES' : 'NO'}</td>
                    <td className="p-4">{ds.priority}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(ds)}
                        className={`text-[9px] font-mono font-bold py-1 px-3 rounded-full border transition-all cursor-pointer ${
                          ds.status === 'active'
                            ? 'bg-green-950/20 border-green-500/30 text-green-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                        }`}
                      >
                        {ds.status.toUpperCase()}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(ds)}
                          className="p-2 border border-zinc-800 rounded-lg text-gray-400 hover:text-gold hover:border-gold/30 cursor-pointer"
                          title="Edit discount"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(ds._id)}
                          className="p-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 hover:border-red-950/40 cursor-pointer"
                          title="Delete discount"
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

      {/* Discount Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-2xl bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 z-10 text-gray-200">
            <div className="flex items-center justify-between border-b border-dark-border pb-3 mb-4">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white">
                {isEditing ? 'Modify Discount Campaign' : 'Create Discount Campaign'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Discount Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLASH SALE 20"
                    className="form-input text-xs bg-black/30 border-dark-border text-white"
                    value={discountName}
                    onChange={(e) => setDiscountName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20% off on all luxury chronographs"
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
                    <option value="fixed">Fixed Reduction (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Value"
                    className="form-input text-xs bg-black/30 border-dark-border text-white"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Priority Rank (0 = default)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input text-xs bg-black/30 border-dark-border text-white font-mono"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
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
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">End Date</label>
                  <input
                    type="date"
                    className="form-input text-xs bg-black/30 border-dark-border text-white font-mono"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 pb-1 select-none cursor-pointer">
                <input
                  type="checkbox"
                  id="show_countdown"
                  checked={showCountdown}
                  onChange={(e) => setShowCountdown(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-border bg-black/30 text-gold focus:ring-0"
                />
                <div>
                  <label htmlFor="show_countdown" className="text-[10px] font-mono text-zinc-400 uppercase cursor-pointer block font-bold">
                    Show Countdown Timer
                  </label>
                  <span className="text-[8px] text-zinc-500 block -mt-0.5">
                    Display a live countdown timer on the Home Page for this discount.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-dark-border pt-4">
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Scope Mapping</label>
                  <select
                    className="form-input text-xs bg-black/30 border-dark-border text-white font-mono cursor-pointer"
                    value={applyType}
                    onChange={(e) => setApplyType(e.target.value)}
                  >
                    <option value="product">Single Product</option>
                    <option value="category">Category-wide</option>
                    <option value="selectedProducts">Multiple Selected Products</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showOnHomepage}
                      onChange={(e) => setShowOnHomepage(e.target.checked)}
                      className="w-4 h-4 rounded border-dark-border bg-black/30 text-gold focus:ring-0"
                    />
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">Show on Homepage Deals</span>
                  </label>
                </div>
              </div>

              {applyType === 'product' && (
                <div className="border-t border-dark-border pt-4">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Select Product *</label>
                  <select
                    required
                    className="form-input text-xs bg-black/30 border-dark-border text-white font-mono cursor-pointer"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">-- CHOOSE A PRODUCT --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
                    ))}
                  </select>
                </div>
              )}

              {applyType === 'category' && (
                <div className="border-t border-dark-border pt-4">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Select Category *</label>
                  <select
                    required
                    className="form-input text-xs bg-black/30 border-dark-border text-white font-mono cursor-pointer"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">-- CHOOSE A CATEGORY --</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {applyType === 'selectedProducts' && (
                <div className="border-t border-dark-border pt-4">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-2">Select Products *</label>
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-dark-border p-2 rounded-xl bg-black/20 text-[10px] font-mono">
                    {products.map((prod) => (
                      <label key={prod._id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(prod._id)}
                          onChange={() => toggleSelection(prod._id)}
                          className="w-3.5 h-3.5 rounded border-dark-border text-gold bg-black/20"
                        />
                        <span className="truncate">{prod.name} (₹{prod.price})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                  className="btn-gold py-2.5 px-8 font-mono text-xs uppercase tracking-widest"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
