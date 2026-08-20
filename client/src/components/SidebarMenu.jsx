import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { X, LogOut, User, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { resolveImage } from '../utils/imageHelper';
import VaultLogo from './VaultLogo';

// Cached storage outside component to persist product previews between open states
const previewCache = {};

// Memoized Product Preview item for performance
const ProductPreviewCard = React.memo(({ product }) => {
  return (
    <div className="flex flex-col gap-2 group cursor-pointer active:scale-[0.98] transition-transform duration-200">
      <div className="w-full aspect-square bg-[#FCFCFC] rounded-[18px] overflow-hidden border border-neutral-100/10 flex items-center justify-center p-1">
        {product.images && product.images.length > 0 ? (
          <img
            src={resolveImage(product.images[0])}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
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
          <VaultLogo size="mobile" theme="dark" />
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
            <div className="space-y-2 font-sans">
              {user.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-200"
                >
                  Back to Admin Dashboard
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-[10px] font-sans font-bold tracking-widest uppercase transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <LogOut size={12} /> LOGOUT
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[10px] sm:text-[11px] font-sans font-bold tracking-widest uppercase transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>SIGN IN WITH GOOGLE</span>
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
