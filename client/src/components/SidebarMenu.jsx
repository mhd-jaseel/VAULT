import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { X, LogOut, User, LogIn, UserPlus, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

// Cached storage outside component to persist product previews between open states
const previewCache = {};

// Memoized Product Preview item for performance
const ProductPreviewCard = React.memo(({ product }) => {
  return (
    <div className="flex flex-col gap-2 group cursor-pointer active:scale-[0.98] transition-transform duration-200">
      <div className="w-full aspect-square bg-[#FCFCFC] rounded-[18px] overflow-hidden border border-neutral-100/10 flex items-center justify-center">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].startsWith('/') ? `http://localhost:5000${product.images[0]}` : product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <span className="text-neutral-300 font-bold font-mono text-[8px]">VAULT</span>
        )}
      </div>
      <span className="font-sans text-[10px] font-medium text-neutral-800 group-hover:text-neutral-950 truncate w-full px-0.5 leading-none transition-colors duration-200">
        {product.name}
      </span>
    </div>
  );
});

ProductPreviewCard.displayName = 'ProductPreviewCard';

export default function SidebarMenu({ isOpen, onClose }) {
  const { user, logout } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [previewProducts, setPreviewProducts] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exploreExpanded, setExploreExpanded] = useState(true);
  const navigate = useNavigate();

  // Load Explore expanded default state every time menu opens
  useEffect(() => {
    if (isOpen) {
      setExploreExpanded(true);
    }
  }, [isOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Load all categories dynamically
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/categories');
        if (res.data.success) {
          const sorted = res.data.data.sort((a, b) => a.name.localeCompare(b.name));
          setCategories(sorted);
          if (sorted.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(sorted[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching categories for sidebar:', err);
      }
    };
    fetchCategories();
  }, [selectedCategoryId]);

  // Load latest 10 products for the selected category with caching
  useEffect(() => {
    if (!selectedCategoryId) return;

    if (previewCache[selectedCategoryId]) {
      setPreviewProducts(previewCache[selectedCategoryId]);
      return;
    }

    const fetchLatestProducts = async () => {
      setPreviewLoading(true);
      try {
        const res = await axios.get(`/products?category=${selectedCategoryId}&limit=10&sort=createdAt_desc`);
        if (res.data.success) {
          const fetched = res.data.data;
          previewCache[selectedCategoryId] = fetched;
          setPreviewProducts(fetched);
        }
      } catch (err) {
        console.error('Error loading sidebar preview products:', err);
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchLatestProducts();
  }, [selectedCategoryId]);

  const handleLogout = useCallback(() => {
    logout();
    onClose();
    navigate('/login');
  }, [logout, onClose, navigate]);

  const selectedCategoryName = useMemo(() => {
    const match = categories.find(c => c._id === selectedCategoryId);
    return match ? match.name : '';
  }, [categories, selectedCategoryId]);

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 md:hidden ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`absolute inset-y-0 left-0 w-[92vw] max-w-[420px] bg-white shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform border-r border-neutral-100 will-change-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Top Header */}
        <div className="px-5 pt-6 pb-4 border-b border-neutral-100 flex items-center justify-between select-none">
          <span className="font-sans font-black text-lg tracking-widest text-neutral-900">
            VAULT.CO
          </span>
          <button 
            onClick={onClose} 
            className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors duration-200 focus:outline-none"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Navigation Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          
          {/* Main Top Nav links */}
          <nav className="flex flex-col px-5 py-4 border-b border-neutral-100 gap-1.5 font-sans text-sm font-semibold tracking-wide select-none">
            <NavLink 
              to="/" 
              onClick={onClose}
              className={({ isActive }) => `flex items-center justify-between py-2.5 px-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-neutral-50 text-neutral-950 font-bold' : 'text-neutral-600 hover:bg-neutral-50/50'}`}
            >
              Home
            </NavLink>
            
            {/* Explore Title Accordion */}
            <div className="flex flex-col">
              <button
                onClick={() => setExploreExpanded(!exploreExpanded)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-neutral-600 hover:bg-neutral-50/50 transition-all duration-200 focus:outline-none"
              >
                <span className="font-sans font-semibold">Explore</span>
                <ChevronRight size={16} className={`transform transition-transform duration-250 ${exploreExpanded ? 'rotate-90 text-neutral-900' : 'text-neutral-400'}`} />
              </button>
            </div>
          </nav>

          {/* Explore Expanded: Categories & Products Split Grid (Height transitions dynamically) */}
          <div className={`transition-all duration-300 ease-out overflow-hidden flex flex-col flex-1 ${exploreExpanded ? 'opacity-100 max-h-[800px]' : 'opacity-0 max-h-0 pointer-events-none'}`}>
            <div className="flex flex-1 min-h-[300px]">
              
              {/* Left Column: Category selector list */}
              <div className="w-[38%] border-r border-neutral-100 overflow-y-auto bg-neutral-50/40 select-none py-2">
                <div className="flex flex-col gap-0.5 px-1.5">
                  {categories.map((cat) => {
                    const isSelected = cat._id === selectedCategoryId;
                    return (
                      <button
                        key={cat._id}
                        onClick={() => setSelectedCategoryId(cat._id)}
                        className={`w-full text-left py-3 px-3 rounded-xl text-[11px] font-sans font-bold uppercase tracking-wider transition-all duration-200 break-words ${isSelected ? 'bg-neutral-950 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100/50'}`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Dynamic Category Product Preview */}
              <div className="w-[62%] overflow-y-auto px-4 py-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-sans text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                    Latest {selectedCategoryName}
                  </h3>

                  {previewLoading ? (
                    <div className="grid grid-cols-2 gap-3.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <div className="w-full aspect-square rounded-[18px] shimmer-bg" />
                          <div className="h-2 w-10 shimmer-bg rounded" />
                        </div>
                      ))}
                    </div>
                  ) : previewProducts.length === 0 ? (
                    <span className="text-[10px] text-neutral-400 font-sans italic">No products found</span>
                  ) : (
                    <div className="grid grid-cols-2 gap-3.5 opacity-100 transition-opacity duration-200">
                      {previewProducts.map((prod) => (
                        <ProductPreviewCard key={prod._id} product={prod} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Show All Nav link */}
                {selectedCategoryId && previewProducts.length > 0 && (
                  <div className="pt-6 pb-2 mt-auto border-t border-neutral-50 flex justify-end">
                    <Link
                      to={`/shop?category=${selectedCategoryId}`}
                      onClick={onClose}
                      className="group/showall text-[11px] font-sans font-bold text-neutral-900 flex items-center gap-1 hover:text-neutral-950"
                      aria-label={`View all products in ${selectedCategoryName}`}
                    >
                      Show All {selectedCategoryName} <span className="inline-block transform transition-transform duration-200 group-hover/showall:translate-x-1">→</span>
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Area (Authentication controls tailored to VAULT.CO) */}
        <div className="p-5 border-t border-neutral-100 bg-neutral-50/50 select-none">
          {user ? (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-[10px] font-sans font-bold tracking-widest uppercase transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <LogOut size={12} /> LOGOUT
            </button>
          ) : (
            <div className="flex gap-3">
              <Link 
                to="/login" 
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-neutral-900 text-white rounded-xl text-[10px] font-sans font-bold tracking-widest uppercase hover:bg-neutral-800 transition-all duration-250 active:scale-[0.98]"
              >
                <LogIn size={12} /> Sign In
              </Link>
              <Link 
                to="/register" 
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-white border border-neutral-200 text-neutral-900 rounded-xl text-[10px] font-sans font-bold tracking-widest uppercase hover:bg-neutral-50 transition-all duration-250 active:scale-[0.98]"
              >
                <UserPlus size={12} /> Register
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
