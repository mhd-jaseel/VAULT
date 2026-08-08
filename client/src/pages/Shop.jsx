import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, SlidersHorizontal, ArrowUpDown, RefreshCw, Heart, ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import Pagination from '../components/Pagination';
import CountdownTimer from '../components/CountdownTimer';
import ProductCard from '../components/ProductCard';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useContext(AuthContext);
  const [wishlistIds, setWishlistIds] = useState([]);

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

  const handleToggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.warning('Please login to save items to your wishlist.');
      return;
    }
    const isCurrentlyWishlisted = wishlistIds.includes(productId);
    try {
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
      console.error('Error toggling wishlist:', error);
    }
  };
  
  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStockOnly') === 'true');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pages, setPages] = useState(1);

  // Staged states for mobile filter panel
  const [tempCategory, setTempCategory] = useState(selectedCategory);
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);
  const [tempInStockOnly, setTempInStockOnly] = useState(inStockOnly);
  const [tempSort, setTempSort] = useState(sort);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  const handleOpenMobileFilters = () => {
    setTempCategory(selectedCategory);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempInStockOnly(inStockOnly);
    setTempSort(sort);
    setShowMobileFilters(true);
  };

  const handleApplyMobileFilters = () => {
    setSelectedCategory(tempCategory);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setInStockOnly(tempInStockOnly);
    setSort(tempSort);
    setPage(1);

    updateUrlParams({
      category: tempCategory,
      minPrice: tempMinPrice,
      maxPrice: tempMaxPrice,
      inStockOnly: tempInStockOnly ? 'true' : '',
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

  const sortOptions = [
    { value: 'newest', label: 'NEWEST ARRIVALS' },
    { value: 'price_asc', label: 'PRICE: LOW TO HIGH' },
    { value: 'price_desc', label: 'PRICE: HIGH TO LOW' },
    { value: 'name_asc', label: 'NAME: A TO Z' },
    { value: 'name_desc', label: 'NAME: Z TO A' },
  ];

  // Sync search parameters from URL on load
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setInStockOnly(searchParams.get('inStockOnly') === 'true');
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

  // Fetch products when filters change
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sort) params.append('sort', sort);
      if (inStockOnly) params.append('inStockOnly', 'true');
      params.append('page', page);
      params.append('limit', 9);

      const res = await axios.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, sort, minPrice, maxPrice, inStockOnly, page]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setInStockOnly(false);
    setPage(1);
    setSearchParams({});
  };

  const handleCategorySelect = (id) => {
    setSelectedCategory(id);
    updateUrlParams({ category: id, page: 1 });
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary">
            The Accessories Catalog
          </h1>
          <p className="text-xs text-text-secondary mt-1">Browse premium belts, watches, chains, wallets & more.</p>
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
            <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider mb-3">Categories</h4>
            <div className="flex flex-col gap-1.5">
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

          {/* Availability (In Stock Filter) */}
          <div className="glass-card !p-4">
            <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider mb-3">Availability</h4>
            <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  updateUrlParams({ inStockOnly: e.target.checked ? 'true' : '', page: 1 });
                }}
                className="w-4 h-4 rounded border-border-light text-[#141414] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs font-mono text-text-secondary uppercase">In Stock Only</span>
            </label>
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
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                <h3 className="font-mono font-bold text-sm text-[#111111] uppercase tracking-wider">Filters</h3>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="text-xs font-mono text-neutral-400 uppercase tracking-widest hover:text-[#111111]"
                >
                  CLOSE
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Categories */}
                <div className="space-y-3">
                  <button
                    onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                    className="w-full flex items-center justify-between font-mono font-bold text-xs text-text-primary uppercase tracking-wider text-left focus:outline-none cursor-pointer"
                  >
                    <span>Categories</span>
                    <ChevronDown 
                      size={14} 
                      className={`text-text-secondary transition-transform duration-200 ${mobileCategoriesOpen ? 'rotate-180' : 'rotate-0'}`} 
                    />
                  </button>
                  {mobileCategoriesOpen && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        onClick={() => setTempCategory('')}
                        className={`text-[10px] font-mono tracking-wide py-2 px-3 rounded-full transition-colors cursor-pointer border ${
                          !tempCategory 
                            ? 'bg-[#141414] text-white border-[#141414] font-bold' 
                            : 'text-text-secondary border-border-light bg-white hover:bg-neutral-50'
                        }`}
                      >
                        ALL ACCESSORIES
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => setTempCategory(cat._id)}
                          className={`text-[10px] font-mono tracking-wide py-2 px-3 rounded-full transition-colors cursor-pointer border truncate ${
                            tempCategory === cat._id 
                              ? 'bg-[#141414] text-white border-[#141414] font-bold' 
                              : 'text-text-secondary border-border-light bg-white hover:bg-neutral-50'
                          }`}
                        >
                          {cat.name.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider">Price Range</h4>
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

                {/* Availability */}
                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider">Availability</h4>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={tempInStockOnly}
                      onChange={(e) => setTempInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-border-light text-[#141414] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-text-secondary uppercase">In Stock Only</span>
                  </label>
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
  );
}
