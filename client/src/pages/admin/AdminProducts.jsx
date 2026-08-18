import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  Star,
  Search,
  ArrowUpDown,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import AdminDetailsDrawer from '../../components/admin/AdminDetailsDrawer';
import ProductDetailsView from '../../components/admin/drawers/ProductDetailsView';
import VaultSelect from '../../components/VaultSelect';
import { resolveImage } from '../../utils/imageHelper';

// Sort options for products
const PRODUCT_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'Product Name A → Z' },
  { value: 'name_desc', label: 'Product Name Z → A' },
  { value: 'stock_desc', label: 'Stock: Highest First' },
  { value: 'stock_asc', label: 'Stock: Lowest / Out First' },
  { value: 'featured', label: 'Featured Products First' },
];

// Stock options for products
const STOCK_OPTIONS = [
  { value: 'all', label: 'All Stock' },
  { value: 'in_stock', label: 'In Stock Only' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const categoryParam = searchParams.get('category') || 'all';
  const inStockParam = searchParams.get('inStockOnly') || searchParams.get('stock') || 'all';

  const [pages, setPages] = useState(1);
  const [searchInput, setSearchInput] = useState(searchParam);
  const searchDebounceRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mobile Drawers
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState(categoryParam);
  const [tempStock, setTempStock] = useState(inStockParam);

  // Modal toggle states
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Quick View Drawer state
  const [drawer, setDrawer] = useState({ isOpen: false, entityId: null });

  const openDrawer = (entityId) => {
    setDrawer({ isOpen: true, entityId });
  };

  const closeDrawer = () => {
    setDrawer({ isOpen: false, entityId: null });
  };

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  
  // Image handling
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (searchParam.trim()) params.set('search', searchParam.trim());
      if (sortParam !== 'newest') params.set('sort', sortParam);
      if (categoryParam !== 'all') params.set('category', categoryParam);
      if (inStockParam === 'in_stock') {
        params.set('inStockOnly', 'in_stock');
      } else if (inStockParam === 'out_of_stock') {
        params.set('inStockOnly', 'out_of_stock');
      }

      const res = await axios.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await axios.get('/brands');
      if (res.data.success) setBrands(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchParam, sortParam, categoryParam, inStockParam]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (isMobileFilterOpen || isMobileSortOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen, isMobileSortOpen]);

  const updateQueryParam = (updates, resetPage = true) => {
    const nextParams = new URLSearchParams(searchParams);
    if (resetPage) nextParams.set('page', '1');
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all' || (key === 'sort' && value === 'newest')) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    setSearchParams(nextParams);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      updateQueryParam({ search: val.trim() });
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateQueryParam({ search: '' });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams({});
    setTempCategory('all');
    setTempStock('all');
    setIsMobileFilterOpen(false);
    setIsMobileSortOpen(false);
  };

  const handleOpenMobileFilter = () => {
    setTempCategory(categoryParam);
    setTempStock(inStockParam);
    setIsMobileFilterOpen(true);
  };

  const handleApplyMobileFilter = () => {
    updateQueryParam({
      category: tempCategory,
      inStockOnly: tempStock,
    });
    setIsMobileFilterOpen(false);
  };

  const handleSelectSort = (sortVal) => {
    updateQueryParam({ sort: sortVal }, false);
    setIsMobileSortOpen(false);
  };

  const activeFiltersCount = [
    categoryParam !== 'all',
    inStockParam !== 'all',
    Boolean(searchParam.trim()),
  ].filter(Boolean).length;

  const isFiltered = activeFiltersCount > 0 || sortParam !== 'newest';
  const currentSortLabel = PRODUCT_SORT_OPTIONS.find((s) => s.value === sortParam)?.label || 'Newest First';
  const currentCategoryName = categories.find((c) => c._id === categoryParam)?.name || 'All Categories';

  // Open modal for editing if queried in URL (e.g. from Restock button in dashboard)
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && products.length > 0) {
      const prod = products.find((p) => p._id === editId);
      if (prod) handleOpenEdit(prod);
    }
  }, [searchParams, products]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setName('');
    setDescription('');
    setPrice('');
    setCategory(categories[0]?._id || '');
    setBrand(brands[0]?._id || '');
    setStock('');
    setIsFeatured(false);
    setDiscountType('percentage');
    setDiscountValue('');
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setIsOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setIsEditing(true);
    setCurrentId(prod._id);
    setName(prod.name);
    setDescription(prod.description);
    setPrice(prod.price);
    setCategory(prod.category?._id || '');
    setBrand(prod.brand?._id || prod.brand || '');
    setStock(prod.stock !== undefined ? String(prod.stock) : '');
    setIsFeatured(prod.isFeatured || false);
    setDiscountType(prod.discountType || 'percentage');
    setDiscountValue(prod.discountValue ? String(prod.discountValue) : '');
    setExistingImages(prod.images || []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setIsOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImageFiles((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveExistingImage = (path) => {
    setExistingImages((prev) => prev.filter((img) => img !== path));
  };

  const handleRemoveNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveExisting = (index, direction) => {
    const updated = [...existingImages];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setExistingImages(updated);
  };

  const handleMoveNew = (index, direction) => {
    const updatedFiles = [...newImageFiles];
    const updatedPreviews = [...newImagePreviews];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= updatedFiles.length) return;
    const tempFile = updatedFiles[index];
    updatedFiles[index] = updatedFiles[newIndex];
    updatedFiles[newIndex] = tempFile;
    const tempPreview = updatedPreviews[index];
    updatedPreviews[index] = updatedPreviews[newIndex];
    updatedPreviews[newIndex] = tempPreview;
    setNewImageFiles(updatedFiles);
    setNewImagePreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Product title is required.');
      return;
    }

    if (!category) {
      toast.error('Category is required.');
      return;
    }

    if (!brand) {
      toast.error('Brand is required. Please select a brand.');
      return;
    }

    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      toast.error('Enter a valid price greater than 0.');
      return;
    }

    if (stock === '' || stock === undefined || stock === null) {
      toast.error('Stock quantity is required.');
      return;
    }

    const stockNum = Number(stock);
    if (!Number.isFinite(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
      toast.error('Stock quantity must be a valid non-negative integer.');
      return;
    }

    if (!description.trim()) {
      toast.error('Product description is required.');
      return;
    }

    const numPrice = Number(price);
    const numDiscount = discountValue !== '' ? Number(discountValue) : 0;

    if (numDiscount < 0) {
      toast.error('Discount cannot be negative.');
      return;
    }
    if (discountType === 'percentage' && numDiscount > 100) {
      toast.error('Percentage discount cannot exceed 100%.');
      return;
    }
    if (discountType === 'fixed' && numDiscount > numPrice) {
      toast.error('Fixed discount cannot exceed product price.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', String(price));
      formData.append('category', category);
      formData.append('brand', brand);
      formData.append('stock', String(stockNum));
      formData.append('stockQty', String(stockNum));
      formData.append('countInStock', String(stockNum));
      formData.append('isFeatured', String(isFeatured));
      formData.append('discountType', numDiscount > 0 ? discountType : '');
      formData.append('discountValue', String(numDiscount));
      if (isEditing) {
        formData.append('keepImages', JSON.stringify(existingImages));
      }
      newImageFiles.forEach((file) => {
        formData.append('images', file);
      });
      let res;
      if (isEditing) {
        res = await axios.put(`/products/${currentId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axios.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      if (res.data.success) {
        toast.success(isEditing ? 'Product updated successfully.' : 'Product created successfully.');
        setIsOpen(false);
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Product?',
      text: 'Are you sure you want to remove this product from the inventory?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      const res = await axios.delete(`/products/${id}`);
      if (res.data.success) {
        toast.success('Product deleted successfully.');
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans text-[#111111] min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
            Manage Products
          </h1>
          <p className="text-xs text-[#6b7280] font-mono mt-1">
            Configure luxury watch, wallet, belt, and jewelry stocks.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#111111] hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden space-y-3 font-mono">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-9 pr-8 py-2 text-xs text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#111111]"
            value={searchInput}
            onChange={handleSearchChange}
          />
          {searchInput && (
            <button onClick={handleClearSearch} className="absolute right-2.5 top-2.5 text-[#9ca3af] hover:text-[#111111] cursor-pointer">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setIsMobileSortOpen(true)} className="flex items-center justify-between px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl text-xs font-bold text-[#111111] hover:bg-[#f9fafb] cursor-pointer shadow-xs">
            <span className="flex items-center gap-1.5 truncate">
              <ArrowUpDown size={12} className="text-[#6b7280]" />
              <span className="text-[10px] uppercase text-[#6b7280]">SORT:</span>
              <span className="truncate">{currentSortLabel}</span>
            </span>
          </button>
          <button onClick={handleOpenMobileFilter} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-xs ${activeFiltersCount > 0 ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#111111] border-[#e5e5e5] hover:bg-[#f9fafb]'}`}>
            <span className="flex items-center gap-1.5">
              <Filter size={12} className={activeFiltersCount > 0 ? 'text-amber-400' : 'text-[#6b7280]'} />
              <span>FILTER</span>
            </span>
            {activeFiltersCount > 0 ? (
              <span className="bg-amber-400 text-[#111111] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">{activeFiltersCount}</span>
            ) : (
              <span className="text-[10px] text-[#6b7280] uppercase truncate">{currentCategoryName}</span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Toolbar */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-[#e5e5e5] rounded-2xl shadow-xs font-mono text-xs">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-2.5 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl pl-9 pr-8 py-1.5 text-xs text-[#111111] placeholder-[#9ca3af] focus:bg-white focus:outline-none focus:border-[#111111]"
            value={searchInput}
            onChange={handleSearchChange}
          />
          {searchInput && (
            <button onClick={handleClearSearch} className="absolute right-2.5 top-2 text-[#9ca3af] hover:text-[#111111] cursor-pointer">
              <X size={14} />
            </button>
          )}
        </div>
        {/* Right: Dropdowns toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <VaultSelect
            label="Category:"
            value={categoryParam}
            onChange={(val) => updateQueryParam({ category: val })}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((c) => ({ value: c._id, label: c.name })),
            ]}
          />

          {/* Stock Filter */}
          <VaultSelect
            label="Stock:"
            value={inStockParam}
            onChange={(val) => updateQueryParam({ inStockOnly: val })}
            options={STOCK_OPTIONS}
          />

          {/* Sort By Dropdown */}
          <VaultSelect
            label="Sort:"
            value={sortParam}
            onChange={(val) => updateQueryParam({ sort: val }, false)}
            options={PRODUCT_SORT_OPTIONS}
          />

          {/* Clear Filters Button */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-xl text-xs font-bold hover:bg-[#fee2e2] transition-colors cursor-pointer flex items-center gap-1"
              title="Reset all filters"
            >
              <RotateCcw size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Product List Content */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#6b7280] font-mono bg-white border border-[#e5e5e5] rounded-2xl">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#e5e5e5] rounded-2xl">No products found.</div>
      ) : (
        <>
          {/* Desktop Table View (md+) */}
          <div className="hidden md:block overflow-x-auto bg-white border border-[#e5e5e5] rounded-2xl shadow-xs font-mono">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                  <th className="p-3.5">Product Info</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Stock Status</th>
                  <th className="p-3.5">Featured</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-[#f9fafb] transition-colors group">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f9fafb] flex-shrink-0 flex items-center justify-center border border-[#e5e5e5]">
                          {prod.images && prod.images.length > 0 ? (
                            <img 
                              src={resolveImage(prod.images[0])} 
                              alt={prod.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[#9ca3af] font-bold text-[9px]">VAULT</span>
                          )}
                        </div>
                        <button 
                          onClick={() => openDrawer(prod._id)}
                          className="font-bold text-[#111111] truncate max-w-[200px] text-left hover:text-[#d97706] hover:underline transition-colors focus:outline-none cursor-pointer"
                        >
                          {prod.name}
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-[#374151] font-sans">
                      <span 
                        onClick={() => openDrawer(prod._id)}
                        className="cursor-pointer hover:text-[#d97706] hover:underline transition-colors text-xs font-medium"
                      >
                        {prod.category?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div 
                        onClick={() => openDrawer(prod._id)}
                        className="cursor-pointer flex flex-col gap-0.5 group"
                      >
                        {prod.isDiscounted ? (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[#111111] font-bold text-sm font-mono group-hover:text-[#d97706] transition-colors">
                                ₹{(prod.finalPrice ?? prod.price).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[#9ca3af] font-mono text-[11px] line-through">
                                ₹{(prod.originalPrice ?? prod.price).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="bg-red-50 text-red-600 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-red-200/60 leading-none">
                                {prod.discountType === 'percentage'
                                  ? `${prod.discountValue}% OFF`
                                  : `₹${prod.discountValue} OFF`}
                              </span>
                              {prod.discountAmount > 0 && (
                                <span className="text-[10px] text-[#16a34a] font-medium font-sans">
                                  Save ₹{Math.round(prod.discountAmount).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-[#111111] font-bold text-sm font-mono group-hover:text-[#d97706] group-hover:underline decoration-dashed transition-colors">
                            ₹{prod.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span 
                        onClick={() => openDrawer(prod._id)}
                        className="cursor-pointer hover:opacity-80 transition-opacity inline-block"
                      >
                        {prod.stock === 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[#fef2f2] border-[#fecaca] text-[#dc2626]">
                            Out of stock
                          </span>
                        ) : prod.stock < 5 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[#fffbeb] border-[#fde68a] text-[#d97706]">
                            Low Stock ({prod.stock})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]">
                            {prod.stock} Units
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span 
                        onClick={() => openDrawer(prod._id)}
                        className="cursor-pointer hover:opacity-80 transition-opacity inline-block"
                      >
                        {prod.isFeatured ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-50 border-amber-200 text-amber-700 inline-flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> Featured
                          </span>
                        ) : (
                          <span className="text-[#9ca3af] text-[10px] uppercase font-bold">—</span>
                        )}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 border border-[#e5e5e5] bg-white hover:bg-[#f9fafb] rounded-lg text-[#111111] hover:border-[#111111] cursor-pointer shadow-xs"
                          title="Edit Product"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(prod._id)}
                          className="p-1.5 border border-[#fecaca] bg-[#fef2f2] hover:bg-[#fee2e2] rounded-lg text-[#dc2626] cursor-pointer shadow-xs"
                          title="Delete Product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (< md) */}
          <div className="md:hidden space-y-3 font-mono">
            {products.map((prod) => (
              <div
                key={prod._id}
                className="bg-white border border-[#e5e5e5] rounded-2xl p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f9fafb] flex-shrink-0 flex items-center justify-center border border-[#e5e5e5]">
                    {prod.images && prod.images.length > 0 ? (
                      <img 
                        src={resolveImage(prod.images[0])} 
                        alt={prod.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[#9ca3af] font-bold text-[9px]">VAULT</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      onClick={() => openDrawer(prod._id)}
                      className="font-bold text-[#111111] text-xs truncate cursor-pointer hover:text-[#d97706]"
                    >
                      {prod.name}
                    </h3>
                    <p className="text-[11px] text-[#6b7280] font-sans mt-0.5">{prod.category?.name || 'Unassigned'}</p>
                    <p className="text-sm font-extrabold text-[#111111] mt-0.5">₹{prod.price.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f3f4f6] text-[11px]">
                  <div>
                    <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Stock</span>
                    {prod.stock === 0 ? (
                      <span className="text-[#dc2626] font-bold text-[10px]">Out of stock</span>
                    ) : prod.stock < 5 ? (
                      <span className="text-[#d97706] font-bold text-[10px]">Low ({prod.stock})</span>
                    ) : (
                      <span className="text-[#16a34a] font-bold text-[10px]">{prod.stock} Units</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Featured</span>
                    <span className="text-xs font-bold text-[#111111]">
                      {prod.isFeatured ? '★ Featured' : 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e5e5e5] flex items-center justify-between gap-2">
                  <button
                    onClick={() => openDrawer(prod._id)}
                    className="px-3 py-1.5 bg-[#f9fafb] border border-[#e5e5e5] hover:bg-[#f3f4f6] text-[#111111] rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    View Details
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="p-1.5 border border-[#e5e5e5] bg-white hover:bg-[#f9fafb] rounded-xl text-[#111111] cursor-pointer shadow-xs"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(prod._id)}
                      className="p-1.5 border border-[#fecaca] bg-[#fef2f2] hover:bg-[#fee2e2] rounded-xl text-[#dc2626] cursor-pointer shadow-xs"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        onPageChange={(newPage) => updateQueryParam({ page: newPage }, false)}
        loading={loading}
      />

      {/* REUSABLE DETAILS DRAWER */}
      <AdminDetailsDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        title="Product Details"
        subtitle="Quick View"
      >
        {drawer.isOpen && <ProductDetailsView productId={drawer.entityId} />}
      </AdminDetailsDrawer>

      {/* Editor Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-xl bg-dark-card border border-dark-border rounded-2xl shadow-xl p-6 z-10 text-gray-200">
            <div className="flex items-center justify-between border-b border-dark-border pb-3 mb-4">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white">
                {isEditing ? 'Modify Product' : 'Add Product'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Minimalist Gold Chain"
                    className="form-input text-xs"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Category selector */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">
                    Category
                  </label>
                  <select
                    className="form-input text-xs cursor-pointer !py-2.5"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Brand selector */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">
                    Brand
                  </label>
                  <select
                    className="form-input text-xs cursor-pointer !py-2.5"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select brand</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="MRP price"
                    className="form-input text-xs"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">
                    Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Quantity in vault"
                    className="form-input text-xs"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>

                {/* Discount Configuration Section */}
                <div className="col-span-2 p-3.5 bg-neutral-100/90 border border-border-light rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-primary">
                      Product Discount (Optional)
                    </span>
                    {discountValue !== '' && Number(discountValue) > 0 && Number(price) > 0 && (
                      <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Final Price: ₹
                        {Math.max(
                          0,
                          Math.round(
                            discountType === 'percentage'
                              ? Number(price) - (Number(price) * Math.min(100, Number(discountValue))) / 100
                              : Number(price) - Number(discountValue)
                          )
                        ).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-wider block mb-1">
                        Discount Type
                      </label>
                      <select
                        className="form-input text-xs cursor-pointer !py-2 bg-white text-text-primary border-border-light"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-wider block mb-1">
                        {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'percentage' ? '100' : price || undefined}
                        placeholder={discountType === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
                        className="form-input text-xs bg-white text-text-primary border-border-light placeholder-neutral-400"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-text-secondary font-mono leading-relaxed">
                    * If a category or campaign discount also applies, the system automatically awards the customer the single highest benefit discount.
                  </p>
                </div>

                {/* Featured checkbox */}
                <div className="col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="featured_chk"
                    className="w-4 h-4 accent-gold cursor-pointer"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <label htmlFor="featured_chk" className="text-xs text-zinc-300 font-medium cursor-pointer">
                    Feature on Homepage
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">
                  Detailed Description
                </label>
                <textarea
                  placeholder="Material specs, sizing details, packaging..."
                  className="form-input text-xs min-h-[70px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Images */}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-2">Product Images</label>
                
                {/* Images grid preview */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {/* Existing Images */}
                  {existingImages.map((img, i) => (
                    <div key={`exist-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-black border border-dark-border">
                      <img src={resolveImage(img)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img)}
                        className="absolute -top-1 -right-1 bg-red-900 border border-red-500 text-white rounded-full p-0.5 cursor-pointer z-10"
                      >
                        <X size={10} />
                      </button>
                      <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between bg-black/70 rounded px-1 py-0.5 z-10">
                        <button
                          type="button"
                          disabled={i === 0}
                          onClick={() => handleMoveExisting(i, -1)}
                          className="text-[8px] hover:text-gold disabled:opacity-30 cursor-pointer text-zinc-400"
                        >
                          ◀
                        </button>
                        <span className="text-[7px] text-zinc-500 self-center">#{i+1}</span>
                        <button
                          type="button"
                          disabled={i === existingImages.length - 1}
                          onClick={() => handleMoveExisting(i, 1)}
                          className="text-[8px] hover:text-gold disabled:opacity-30 cursor-pointer text-zinc-400"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* New Image Previews */}
                  {newImagePreviews.map((preview, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden bg-black border border-dark-border">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(idx)}
                        className="absolute -top-1 -right-1 bg-red-955 border border-red-500 text-white rounded-full p-0.5 cursor-pointer z-10"
                      >
                        <X size={10} />
                      </button>
                      <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between bg-black/70 rounded px-1 py-0.5 z-10">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveNew(idx, -1)}
                          className="text-[8px] hover:text-gold disabled:opacity-30 cursor-pointer text-zinc-400"
                        >
                          ◀
                        </button>
                        <span className="text-[7px] text-zinc-500 self-center">#{idx+1}</span>
                        <button
                          type="button"
                          disabled={idx === newImageFiles.length - 1}
                          onClick={() => handleMoveNew(idx, 1)}
                          className="text-[8px] hover:text-gold disabled:opacity-30 cursor-pointer text-zinc-400"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  <label className="flex flex-col items-center justify-center aspect-square rounded-lg border border-dashed border-dark-border bg-dark-input hover:border-gold/40 cursor-pointer p-1.5">
                    <Upload className="text-zinc-500" size={16} />
                    <span className="text-[8px] font-semibold text-gray-400 mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-gold text-xs uppercase tracking-widest py-3 mt-4 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>SAVING PRODUCT...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Save Product Details' : 'Create Product'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
