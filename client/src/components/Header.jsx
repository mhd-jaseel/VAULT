import React, { useContext, useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import AnnouncementBar from './AnnouncementBar';
import { 
  ShoppingBag, 
  User, 
  Heart, 
  Search, 
  LogOut,
  LayoutDashboard,
  Menu,
  Wallet
} from 'lucide-react';
import VaultLogo from './VaultLogo';

export default function Header({ onMenuClick }) {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewModal, setPreviewModal] = useState({ open: false, title: '', message: '' });
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full flex flex-col">
      <div className="bg-white/95 backdrop-blur-md border-b border-border-light py-4 px-6 md:px-12 flex items-center justify-between">
      {/* Mobile-only view header items */}
      <div className="flex md:hidden w-full items-center justify-between">
        {/* Left: Hamburger menu */}
        <button 
          onClick={onMenuClick} 
          className="p-2 text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors active:scale-95 duration-200"
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>

        {/* Center: Stylish typography logo */}
        <VaultLogo to="/" size="mobile" theme="dark" />

        {/* Right: Wishlist Icon */}
        <button 
          onClick={(e) => {
            if (user && user.role === 'admin') {
              e.preventDefault();
              setPreviewModal({
                open: true,
                title: 'Wishlist Unavailable',
                message: 'Wishlist is unavailable while previewing the customer website.',
              });
            } else {
              navigate('/wishlist');
            }
          }}
          className="p-2 text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors active:scale-95 duration-200 cursor-pointer"
          aria-label="Wishlist"
        >
          <Heart size={20} />
        </button>
      </div>

      {/* Desktop-only Logo */}
      <div className="hidden md:flex items-center">
        <VaultLogo to="/" size="large" theme="dark" />
      </div>

      {/* Center Nav Links (Desktop) */}
      <nav className="hidden md:flex items-center gap-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => `px-4 py-2 text-[11px] font-mono tracking-wider rounded-full transition-colors ${isActive ? 'bg-[#141414] text-white' : 'text-[#6b7280] hover:text-[#111111]'}`}
        >
          HOME
        </NavLink>
        <NavLink 
          to="/shop" 
          className={({ isActive }) => `px-4 py-2 text-[11px] font-mono tracking-wider rounded-full transition-colors ${isActive ? 'bg-[#141414] text-white' : 'text-[#6b7280] hover:text-[#111111]'}`}
        >
          SHOP
        </NavLink>
        <button
          onClick={(e) => {
            if (user && user.role === 'admin') {
              e.preventDefault();
              setPreviewModal({
                open: true,
                title: 'Wishlist Unavailable',
                message: 'Wishlist is unavailable while previewing the customer website.',
              });
            } else {
              navigate('/wishlist');
            }
          }}
          className="px-4 py-2 text-[11px] font-mono tracking-wider rounded-full text-[#6b7280] hover:text-[#111111] transition-colors cursor-pointer"
        >
          WISHLIST
        </button>
        <button
          onClick={(e) => {
            if (user && user.role === 'admin') {
              e.preventDefault();
              setPreviewModal({
                open: true,
                title: 'Cart & Checkout Unavailable',
                message: 'Cart and checkout are unavailable while previewing the customer website.',
              });
            } else {
              navigate('/cart');
            }
          }}
          className="px-4 py-2 text-[11px] font-mono tracking-wider rounded-full text-[#6b7280] hover:text-[#111111] transition-colors cursor-pointer"
        >
          CART
        </button>
        <NavLink 
          to="/about" 
          className={({ isActive }) => `px-4 py-2 text-[11px] font-mono tracking-wider rounded-full transition-colors ${isActive ? 'bg-[#141414] text-white' : 'text-[#6b7280] hover:text-[#111111]'}`}
        >
          ABOUT
        </NavLink>
      </nav>

      {/* Navigation Icons & Actions (Desktop) */}
      <div className="hidden md:flex items-center gap-3">
        {/* Search Input (desktop) */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center bg-neutral-100 border border-border-light rounded-full px-4 py-1.5 w-60 mr-2">
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs w-full text-text-primary focus:outline-none placeholder-neutral-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="text-text-secondary hover:text-text-primary transition-colors">
            <Search size={14} />
          </button>
        </form>

        {/* Wishlist */}
        <button
          onClick={(e) => {
            if (user && user.role === 'admin') {
              e.preventDefault();
              setPreviewModal({
                open: true,
                title: 'Wishlist Unavailable',
                message: 'Wishlist features are disabled while previewing the customer storefront.',
              });
            } else {
              navigate('/wishlist');
            }
          }}
          className="relative p-2.5 rounded-full bg-neutral-100 text-[#111111] hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          <Heart size={18} />
        </button>

        {/* Cart */}
        <button
          onClick={(e) => {
            if (user && user.role === 'admin') {
              e.preventDefault();
              setPreviewModal({
                open: true,
                title: 'Cart & Checkout Unavailable',
                message: 'Cart, checkout, and purchasing features are disabled while previewing the customer storefront.',
              });
            } else {
              navigate('/cart');
            }
          }}
          className="relative p-2.5 rounded-full bg-neutral-100 text-[#111111] hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          <ShoppingBag size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#141414] text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
              {cartCount}
            </span>
          )}
        </button>

        {/* Profile / Account Dropdown */}
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              className="flex items-center gap-1.5 p-2.5 rounded-full bg-neutral-100 text-[#111111] hover:bg-neutral-200 transition-colors cursor-pointer"
              title="Account Menu"
            >
              <User size={18} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-border-light rounded-2xl shadow-lg py-2.5 z-50 text-xs font-mono">
                <div className="px-4 py-2 border-b border-neutral-100 text-[10px] text-neutral-400 font-bold uppercase">
                  ACCOUNT MENU
                </div>
                <Link 
                  to="/profile" 
                  onClick={() => setDropdownOpen(false)} 
                  className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-neutral-50"
                >
                  <User size={13} /> MY PROFILE
                </Link>
                {user.role !== 'admin' && (
                  <Link 
                    to="/my-wallet" 
                    onClick={() => setDropdownOpen(false)} 
                    className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-neutral-50"
                  >
                    <Wallet size={13} /> STORE CREDIT
                  </Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <div className="my-1 border-t border-neutral-100" />
                    <Link 
                      to="/admin/dashboard" 
                      onClick={() => setDropdownOpen(false)} 
                      className="flex items-center gap-2 px-4 py-2 text-amber-700 font-bold hover:bg-amber-50"
                    >
                      <LayoutDashboard size={13} /> Back to Admin Dashboard
                    </Link>
                  </>
                )}
                <div className="my-1 border-t border-neutral-100" />
                <button 
                  onClick={() => { logout(); setDropdownOpen(false); navigate('/login'); }} 
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut size={13} /> LOGOUT
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="btn-dark py-2 px-4 text-[9px] tracking-wider font-mono uppercase">
            Login
          </Link>
        )}
      </div>
      </div>
      <AnnouncementBar />

      {/* Admin Preview Mode Modal */}
      {previewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                PREVIEW MODE
              </span>
              <h3 className="font-sans font-bold text-sm uppercase text-[#111111]">
                {previewModal.title || 'Action Unavailable'}
              </h3>
            </div>
            <p className="text-xs text-[#4b5563] leading-relaxed font-sans font-normal">
              {previewModal.message}
            </p>
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => setPreviewModal({ open: false, title: '', message: '' })}
                className="text-xs font-bold uppercase text-[#6b7280] hover:text-[#111111] px-4 py-2 rounded-xl border border-[#e5e5e5] hover:bg-[#f9fafb]"
              >
                Close Preview
              </button>
              <Link
                to="/admin/dashboard"
                onClick={() => setPreviewModal({ open: false, title: '', message: '' })}
                className="bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase px-4 py-2 rounded-xl transition-all"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
