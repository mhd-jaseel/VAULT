import React, { useContext, useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { 
  ShoppingBag, 
  User, 
  Heart, 
  Search, 
  LogOut,
  LayoutDashboard,
  Menu
} from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border-light py-4 px-6 md:px-12 flex items-center justify-between">
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
        <Link to="/" className="flex items-center">
          <span className="font-sans font-black text-lg tracking-[0.25em] text-neutral-900 select-none">
            VAULT.CO
          </span>
        </Link>

        {/* Right: Wishlist Icon */}
        <Link 
          to="/wishlist" 
          className="p-2 text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors active:scale-95 duration-200"
          aria-label="Wishlist"
        >
          <Heart size={20} />
        </Link>
      </div>

      {/* Desktop-only Logo */}
      <Link to="/" className="hidden md:flex items-center gap-2">
        <span className="font-sans font-extrabold text-2xl tracking-widest text-[#111111]">
          VAULT<span className="text-neutral-900">.</span>
        </span>
      </Link>

      {/* Center Nav Links (Desktop) */}
      {(!user || user.role !== 'admin') && (
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
          {(!user || user.role !== 'admin') && (
            <NavLink 
              to="/wishlist" 
              className={({ isActive }) => `px-4 py-2 text-[11px] font-mono tracking-wider rounded-full transition-colors ${isActive ? 'bg-[#141414] text-white' : 'text-[#6b7280] hover:text-[#111111]'}`}
            >
              WISHLIST
            </NavLink>
          )}
          {(!user || user.role !== 'admin') && (
            <NavLink 
              to="/cart" 
              className={({ isActive }) => `px-4 py-2 text-[11px] font-mono tracking-wider rounded-full transition-colors ${isActive ? 'bg-[#141414] text-white' : 'text-[#6b7280] hover:text-[#111111]'}`}
            >
              CART
            </NavLink>
          )}
          <NavLink 
            to="/about" 
            className={({ isActive }) => `px-4 py-2 text-[11px] font-mono tracking-wider rounded-full transition-colors ${isActive ? 'bg-[#141414] text-white' : 'text-[#6b7280] hover:text-[#111111]'}`}
          >
            ABOUT
          </NavLink>
        </nav>
      )}

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
        {(!user || user.role !== 'admin') && (
          <Link to="/wishlist" className="relative p-2.5 rounded-full bg-neutral-100 text-[#111111] hover:bg-neutral-200 transition-colors">
            <Heart size={18} />
          </Link>
        )}

        {/* Cart */}
        {(!user || user.role !== 'admin') && (
          <Link to="/cart" className="relative p-2.5 rounded-full bg-neutral-100 text-[#111111] hover:bg-neutral-200 transition-colors">
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#141414] text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>
        )}

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
              <div className="absolute right-0 mt-2 w-48 bg-white border border-border-light rounded-2xl shadow-lg py-2.5 z-50 text-xs font-mono">
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    onClick={() => setDropdownOpen(false)} 
                    className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-neutral-50"
                  >
                    <LayoutDashboard size={13} /> ADMIN PANEL
                  </Link>
                )}
                <Link 
                  to="/profile" 
                  onClick={() => setDropdownOpen(false)} 
                  className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-neutral-50"
                >
                  <User size={13} /> MY PROFILE
                </Link>
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
    </header>
  );
}
