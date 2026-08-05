import React, { useState, useEffect, useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { X, ChevronDown, LogOut, User, LogIn, UserPlus } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function SidebarMenu({ isOpen, onClose }) {
  const { user, logout } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [exploreExpanded, setExploreExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/categories');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching categories for sidebar:', err);
      }
    };
    fetchCategories();
  }, []);

  // Lock scroll when drawer is open
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

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 md:hidden ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform border-r border-neutral-100 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Top Area */}
        <div className="flex-1 flex flex-col overflow-y-auto px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <span className="font-sans font-black text-xl tracking-widest text-neutral-900">
              VAULT.CO
            </span>
            <button 
              onClick={onClose} 
              className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors duration-200"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="h-px bg-neutral-100 w-full mb-6" />

          {/* Navigation Links */}
          <nav className="flex flex-col gap-4 font-mono text-[11px] tracking-wider">
            <NavLink 
              to="/" 
              onClick={onClose}
              className={({ isActive }) => `py-2 transition-colors duration-200 ${isActive ? 'text-neutral-950 font-bold' : 'text-neutral-500'}`}
            >
              HOME
            </NavLink>

            {/* Accordion Trigger */}
            <div className="flex flex-col">
              <button 
                onClick={() => setExploreExpanded(!exploreExpanded)}
                className="py-2 text-neutral-500 flex items-center justify-between transition-colors duration-200 focus:outline-none"
              >
                <span>EXPLORE</span>
                <ChevronDown size={14} className={`transform transition-transform duration-300 ${exploreExpanded ? 'rotate-180 text-neutral-950' : 'text-neutral-400'}`} />
              </button>
              
              {/* Dynamic Categories Accordion Container */}
              <div className={`overflow-hidden transition-all duration-300 ${exploreExpanded ? 'max-h-[380px] mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-4 flex flex-col gap-3.5 border-l border-neutral-100 py-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/shop?category=${cat._id}`}
                      onClick={onClose}
                      className="text-neutral-400 hover:text-neutral-950 transition-colors duration-200 py-0.5"
                    >
                      {cat.name}
                    </Link>
                  ))}
                  {categories.length === 0 && (
                    <span className="text-neutral-400 italic">No categories loaded</span>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom Area (Authentication) */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50/50">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-neutral-900 truncate leading-none mb-1">{user.name}</span>
                  <span className="text-[9px] text-neutral-400 font-mono truncate">{user.email}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Link 
                  to="/profile" 
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-neutral-200 rounded-lg text-[10px] font-mono tracking-wider text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <User size={12} /> PROFILE
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-900 text-white rounded-lg text-[10px] font-mono tracking-wider hover:bg-neutral-800 transition-colors"
                >
                  <LogOut size={12} /> LOGOUT
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link 
                to="/login" 
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-900 text-white rounded-lg text-[10px] font-mono tracking-widest uppercase hover:bg-neutral-800 transition-all duration-200 active:scale-[0.98]"
              >
                <LogIn size={12} /> SIGN IN
              </Link>
              <Link 
                to="/register" 
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-neutral-200 text-neutral-900 rounded-lg text-[10px] font-mono tracking-widest uppercase hover:bg-neutral-50 transition-all duration-200 active:scale-[0.98]"
              >
                <UserPlus size={12} /> REGISTER
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
