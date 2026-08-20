import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, SlidersHorizontal, ArrowUpDown, RefreshCw, Heart, ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import Pagination from '../components/Pagination';
import CountdownTimer from '../components/CountdownTimer';
import ProductCard from '../components/ProductCard';
import LoginRequiredModal from '../components/LoginRequiredModal';
import VaultSelect from '../components/VaultSelect';
import { setDocumentSEO } from '../utils/seoHelper';

// Stock filter options
const SHOP_STOCK_OPTIONS = [
  { value: 'all', label: 'All Stock' },
  { value: 'in_stock', label: 'In Stock Only' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useContext(AuthContext);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loginModal, setLoginModal] = useState({ open: false, message: '' });

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/wishlist');
      if (res.data.success) {
        setWishlistIds(res.data.data.products.map(p => p._id));
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const [wishlistPendingId, setWishlistPendingId] = useState(null);

  const handleToggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (authLoading || wishlistPendingId === productId) return;
    if (!user) {
      setLoginModal({ open: true, message: 'Please login to add products to your wishlist.' });
      return;
    }
    const isCurrentlyWishlisted = wishlistIds.includes(productId);
    try {
      setWishlistPendingId(productId);
      if (isCurrentlyWishlisted) {
        const res = await axios.delete(`/wishlist/${productId}`);
        if (res.data.success) {
          setWishlistIds(prev => prev.filter(id => id !== productId));
          toast.success('Removed from wishlist');
        }
      } else {
        const res = await axios.post('/wishlist', { productId });
        if (res.data.success) {
          setWishlistIds(prev => [...prev, productId]);
          toast.success('Added to wishlist');
        }
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistPendingId(null);
    }
  };
  
  const sortOptions = [
    { value: 'newest', label: 'NEWEST ARRIVALS' },
    { value: 'price_asc', label: 'PRICE: LOW TO HIGH' },
    { value: 'price_desc', label: 'PRICE: HIGH TO LOW' },
    { value: 'name_asc', label: 'NAME: A TO Z' },
    { value: 'name_desc', label: 'NAME: Z TO A' },
  ];

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Initial stock filter parse (supports legacy inStockOnly=true or stock=in_stock/out_of_stock)
  const initialStockParam = searchParams.get('stock') || (searchParams.get('inStockOnly') === 'true' ? 'in_stock' : 'all');
  const [stockFilter, setStockFilter] = useState(initialStockParam);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pages, setPages] = useState(1);

  // Staged states for mobile filter panel
  const [tempCategory, setTempCategory] = useState(selectedCategory);
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);
  const [tempStockFilter, setTempStockFilter] = useState(stockFilter);
  const [tempSort, setTempSort] = useState(sort);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [desktopCategoriesOpen, setDesktopCategoriesOpen] = useState(false);

  const handleOpenMobileFilters = () => {
    setTempCategory(selectedCategory);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempStockFilter(stockFilter);
    setTempSort(sort);
    setShowMobileFilters(true);
  };

  const handleApplyMobileFilters = () => {
    setSelectedCategory(tempCategory);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setStockFilter(tempStockFilter);
    setSort(tempSort);
    setPage(1);

    updateUrlParams({
      category: tempCategory,
      minPrice: tempMinPrice,
      maxPrice: tempMaxPrice,
      stock: tempStockFilter !== 'all' ? tempStockFilter : '',
      sort: tempSort,
      page: 1
    });

    setShowMobileFilters(false);
  };

  const updateUrlParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    setSearchParams(updated);
  };

  // Sync search parameters from URL on load
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
    const currentStock = searchParams.get('stock') || (searchParams.get('inStockOnly') === 'true' ? 'in_stock' : 'all');
    setStockFilter(currentStock);
    setPage(Number(searchParams.get('page')) || 1);
    setSort(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  // Fetch categories
  useEffect(() => {
    axios.get('/categories')
      .then((res) => {
        if (res.data.success) setCategories(res.data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Replacement Mode State
  const mode = searchParams.get('mode');
  const returnIdParam = searchParams.get('returnId');
  const isReplacementMode = mode === 'replacement' && Boolean(returnIdParam);
  const [replacementContext, setReplacementContext] = useState(null);

  // Debounced search state to prevent spamming backend requests on each keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== (searchParams.get('search') || '')) {
        updateUrlParams({ search, page: 1 });
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch products when filters change
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategory) params.append('category', selectedCategory);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sort) params.append('sort', sort);
      if (stockFilter === 'in_stock') {
        params.append('inStockOnly', 'in_stock');
      } else if (stockFilter === 'out_of_stock') {
        params.append('inStockOnly', 'out_of_stock');
      }
      if (isReplacementMode) params.append('returnId', returnIdParam);
      params.append('page', page);
      params.append('limit', 21);

      const res = await axios.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data);
        setPages(res.data.pages || 1);
        if (res.data.replacementContext) {
          setReplacementContext(res.data.replacementContext);
        } else if (isReplacementMode) {
          setReplacementContext(null);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const currentCat = categories.find((c) => c._id === selectedCategory);
    const catName = currentCat ? currentCat.name : null;

    const pageTitle = catName
      ? `Premium ${catName} Online | Vault.Co`
      : debouncedSearch
      ? `Search: "${debouncedSearch}" | Vault.Co`
      : 'Shop Premium Accessories Online | Vault.Co';

    const pageDesc = catName
      ? `Explore our collection of ${catName.toLowerCase()} at Vault.Co. Crafted with style, quality materials, and timeless appeal.`
      : 'Explore Vault.Co\'s collection of premium watches, wallets, belts, rings, glasses, chains, caps, earrings and stylish accessories.';

    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: catName || 'Shop', url: selectedCategory ? `/shop?category=${selectedCategory}` : '/shop' },
    ];

    setDocumentSEO({
      title: pageTitle,
      description: pageDesc,
      canonicalPath: selectedCategory ? `/shop?category=${selectedCategory}` : '/shop',
      breadcrumbList: breadcrumbs,
    });
  }, [debouncedSearch, selectedCategory, sort, minPrice, maxPrice, stockFilter, page, mode, returnIdParam, categories]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setStockFilter('all');
    setPage(1);
    setSearchParams({});
  };

  const handleCategorySelect = (id) => {
    setSelectedCategory(id);
    updateUrlParams({ category: id, page: 1 });
  };

  return (
    <>
      <LoginRequiredModal
        isOpen={loginModal.open}
        onClose={() => setLoginModal({ open: false, message: '' })}
        message={loginModal.message}
      />
      {/* ── ADMIN PREVIEW MODE BANNER ── */}
      {user && user.role === 'admin' && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 py-3 px-6 md:px-12 flex items-center justify-between font-mono text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-mono">
              PREVIEW MODE
            </span>
            <span>You are previewing the customer Shop page. Shopping actions (cart, wishlist, checkout) are disabled.</span>
          </div>
          <Link to="/admin/dashboard" className="text-[10px] font-bold uppercase underline hover:text-black">
            Back to Dashboard
          </Link>
        </div>
      )}
      <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {isReplacementMode && replacementContext && (
        <div className="mb-6 bg-[#111111] text-white p-4 rounded-2xl border border-neutral-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                REPLACEMENT MODE ACTIVE
              </span>
              <span className="text-[10px] text-neutral-400">Return #{replacementContext.returnCode}</span>
            </div>
            <h2 className="text-sm font-bold font-sans uppercase text-white">
              Choose Replacement for {replacementContext.orderItemName}
            </h2>
            <p className="text-xs text-neutral-300">
              Vault Store Credit: <strong className="text-white">₹{replacementContext.unitOriginalPaid?.toLocaleString('en-IN')}</strong> · Choose any eligible Vault product.
              {replacementContext.walletCreditStatus === 'CREDITED' ? (
                <span className="text-emerald-400 font-bold ml-1.5">(CREDIT AVAILABLE)</span>
              ) : (
                <span className="text-amber-400 font-bold ml-1.5">(STORE CREDIT PENDING APPROVAL)</span>
              )}
            </p>
          </div>

          <Link
            to="/my-returns"
            className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-all flex-shrink-0"
          >
            Cancel Replacement
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary">
            {isReplacementMode ? 'Eligible Replacement Catalog' : 'The Accessories Catalog'}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {isReplacementMode ? 'Select any item below to replace your original product.' : 'Browse premium belts, watches, chains, wallets & more.'}
          </p>
        </div>

        {/* Global Catalog Search */}
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-80">
            <input
              type="text"
              placeholder="Search accessories..."
              className="form-input text-xs py-2.5 pl-10 pr-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-text-secondary" />
          </div>
          
          <button 
            onClick={handleOpenMobileFilters} 
            className="md:hidden flex items-center gap-1 bg-white border border-border-light text-xs text-text-primary py-2.5 px-4 rounded-xl cursor-pointer"
          >
            <SlidersHorizontal size={14} /> Filter
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden md:block md:w-64 flex-shrink-0 space-y-4">
          {/* Categories */}
          <div className="glass-card !p-4">
            <button
              type="button"
              onClick={() => setDesktopCategoriesOpen(!desktopCategoriesOpen)}
              className="w-full flex items-center justify-between font-mono font-bold text-xs text-text-primary uppercase tracking-wider text-left focus:outline-none cursor-pointer"
            >
              <span>Categories</span>
              <ChevronDown 
                size={14} 
                className={`text-text-secondary transition-transform duration-200 ${desktopCategoriesOpen ? 'rotate-180' : 'rotate-0'}`} 
              />
            </button>
            {!desktopCategoriesOpen && (
              <div className="mt-2 pt-2 border-t border-border-light/60 flex items-center justify-between">
                <span className="text-[9px] font-mono text-text-secondary uppercase">Active:</span>
                <span className="text-[10px] font-mono font-bold bg-[#141414] text-white px-2.5 py-1 rounded-full truncate max-w-[130px]">
                  {selectedCategory 
                    ? (categories.find(c => c._id === selectedCategory)?.name.toUpperCase() || 'CATEGORY') 
                    : 'ALL ACCESSORIES'}
                </span>
              </div>
            )}
            {desktopCategoriesOpen && (
              <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-border-light">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`text-left text-[10px] font-mono tracking-wide py-2 px-3 rounded-full transition-colors cursor-pointer ${
                    !selectedCategory 
                      ? 'bg-[#141414] text-white font-bold' 
                      : 'text-text-secondary hover:bg-neutral-50 hover:text-text-primary border border-border-light bg-white'
                  }`}
                >
                  ALL ACCESSORIES
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => handleCategorySelect(cat._id)}
                    className={`text-left text-[10px] font-mono tracking-wide py-2 px-3 rounded-full transition-colors cursor-pointer truncate ${
                      selectedCategory === cat._id 
                        ? 'bg-[#141414] text-white font-bold' 
                        : 'text-text-secondary hover:bg-neutral-50 hover:text-text-primary border border-border-light bg-white'
                    }`}
                  >
                    {cat.name.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Filters */}
          <div className="glass-card !p-4">
            <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider mb-3">Price Range</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                className="form-input text-xs !py-2 !px-3"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  updateUrlParams({ minPrice: e.target.value, page: 1 });
                }}
              />
              <span className="text-text-secondary">-</span>
              <input
                type="number"
                placeholder="Max"
                className="form-input text-xs !py-2 !px-3"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  updateUrlParams({ maxPrice: e.target.value, page: 1 });
                }}
              />
            </div>
          </div>

          {/* Availability (Stock Filter) */}
          <div className="glass-card !p-4">
            <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider mb-3">Availability</h4>
            <div className="space-y-1.5 font-mono text-xs">
              {SHOP_STOCK_OPTIONS.map((opt) => {
                const isSelected = stockFilter === opt.value;
                return (
                  <label
                    key={opt.value}
                    onClick={() => {
                      setStockFilter(opt.value);
                      updateUrlParams({ stock: opt.value !== 'all' ? opt.value : '', inStockOnly: '', page: 1 });
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#111111] text-white border-[#111111] font-bold shadow-xs'
                        : 'bg-white text-text-secondary border-border-light hover:bg-neutral-50 hover:text-text-primary'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Sorting */}
          <div className="glass-card !p-4 relative">
            <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider mb-3">Sort By</h4>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="w-full flex items-center justify-between form-input text-xs !py-2.5 !px-3 cursor-pointer font-mono bg-white text-left text-text-primary border border-border-light rounded-xl hover:border-text-primary transition-all focus:outline-none"
              >
                <span>{sortOptions.find(o => o.value === sort)?.label || 'SORT'}</span>
                <span 
                  className="text-text-secondary transition-transform duration-200 text-[10px]" 
                  style={{ transform: sortDropdownOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}
                >
                  ▼
                </span>
              </button>
              {sortDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-border-light rounded-xl shadow-lg z-30 overflow-hidden">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        updateUrlParams({ sort: opt.value, page: 1 });
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-mono transition-colors hover:bg-neutral-50 cursor-pointer ${
                        sort === opt.value 
                          ? 'bg-[#141414] text-white hover:bg-[#141414] font-bold' 
                          : 'text-text-secondary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={handleClearFilters}
            className="w-full flex items-center justify-center gap-2 border border-border-light text-[10px] font-mono tracking-wider text-text-secondary py-3 rounded-full hover:bg-neutral-50 hover:text-text-primary transition-colors cursor-pointer bg-white"
          >
            <RefreshCw size={12} /> RESET FILTERS
          </button>
        </aside>

        {/* Mobile Filter Drawer Overlay */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 bg-[#111111]/40 backdrop-blur-sm flex justify-end md:hidden">
            <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl animate-slide-in">
              {/* Drawer Header */}
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <span className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary">FILTERS</span>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="text-xs font-mono text-text-secondary hover:text-text-primary uppercase tracking-wider"
                >
                  ✕ CLOSE
                </button>
              </div>
              
              {/* Drawer Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                {/* Categories */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                    className="w-full flex items-center justify-between font-mono font-bold text-xs text-text-primary uppercase tracking-wider select-none"
                  >
                    <span>Categories</span>
                    <ChevronDown 
                      size={14} 
                      className={`text-text-secondary transition-transform duration-200 ${mobileCategoriesOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  {mobileCategoriesOpen && (
                    <div className="space-y-1.5 pl-1 animate-in fade-in duration-150">
                      <button
                        type="button"
                        onClick={() => setTempCategory('')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors ${
                          tempCategory === ''
                            ? 'bg-[#141414] text-white font-bold'
                            : 'text-text-secondary hover:bg-neutral-50'
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => setTempCategory(cat._id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors ${
                            tempCategory === cat._id
                              ? 'bg-[#141414] text-white font-bold'
                              : 'text-text-secondary hover:bg-neutral-50'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider">Price (₹)</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="form-input text-xs !py-2.5 !px-3"
                      value={tempMinPrice}
                      onChange={(e) => setTempMinPrice(e.target.value)}
                    />
                    <span className="text-text-secondary">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="form-input text-xs !py-2.5 !px-3"
                      value={tempMaxPrice}
                      onChange={(e) => setTempMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Availability (Mobile Stock Options) */}
                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider">Availability</h4>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                    {SHOP_STOCK_OPTIONS.map((opt) => {
                      const isSelected = tempStockFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTempStockFilter(opt.value)}
                          className={`p-2.5 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                              : 'bg-white text-text-secondary border-border-light hover:bg-neutral-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sorting */}
                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider">Sort By</h4>
                  <select
                    value={tempSort}
                    onChange={(e) => setTempSort(e.target.value)}
                    className="w-full form-input text-xs !py-2.5 !px-3 font-mono bg-white text-text-primary border border-border-light rounded-xl cursor-pointer"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sticky Done Button Footer */}
              <div className="p-4 border-t border-neutral-100 flex gap-2">
                <button
                  onClick={() => {
                    handleClearFilters();
                    setShowMobileFilters(false);
                  }}
                  className="flex-1 border border-border-light text-[10px] font-mono tracking-wider text-text-secondary py-3.5 rounded-full hover:bg-neutral-50 transition-colors cursor-pointer bg-white"
                >
                  RESET
                </button>
                <button
                  onClick={handleApplyMobileFilters}
                  className="flex-1 bg-[#111111] hover:bg-neutral-800 text-white text-[10px] font-mono tracking-wider py-3.5 rounded-full transition-colors cursor-pointer uppercase font-bold"
                >
                  DONE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Catalog Grid */}
        <div className="flex-1">
          {/* Dynamic Category & Catalog Header */}
          <div className="mb-6 bg-white border border-border-light rounded-2xl p-4 sm:p-6 shadow-xs">
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-neutral-900 uppercase tracking-tight">
              {selectedCategory 
                ? (categories.find(c => c._id === selectedCategory)?.name || 'Shop Collection')
                : 'Shop Premium Accessories'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1.5 leading-relaxed max-w-2xl">
              {selectedCategory
                ? `Explore our curated selection of ${categories.find(c => c._id === selectedCategory)?.name?.toLowerCase() || 'accessories'} designed with exceptional craft and everyday refinement.`
                : 'Explore Vault.Co\'s complete collection of premium watches, wallets, belts, rings, glasses, chains, caps, earrings, and lifestyle accessories.'}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl shimmer-bg" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-white border border-border-light rounded-2xl">
              <SlidersHorizontal className="text-text-secondary mb-3" size={32} />
              <h3 className="font-bold text-sm text-text-primary uppercase tracking-wide">No Accessories Found</h3>
              <p className="text-[11px] text-text-secondary mt-1 max-w-xs leading-relaxed">
                We couldn't find matches. Try adjusting your search query or reset filter configurations.
              </p>
              <button 
                onClick={handleClearFilters} 
                className="btn-gold text-[10px] py-2.5 px-6 mt-4 uppercase tracking-widest"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod, idx) => (
                <ProductCard
                  key={prod._id}
                  product={prod}
                  index={idx}
                  wishlistIds={wishlistIds}
                  onToggleWishlist={handleToggleWishlist}
                  user={user}
                  isReplacementMode={isReplacementMode}
                  replacementContext={replacementContext}
                />
              ))}
            </div>
          )}

          {/* Pagination Component */}
          <Pagination 
            page={page} 
            pages={pages} 
            onPageChange={(newPage) => updateUrlParams({ page: newPage })} 
            loading={loading} 
          />
        </div>
      </div>
    </div>
    </>
  );
}
