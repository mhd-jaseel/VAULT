import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  Home, 
  Compass, 
  ShoppingBag,
  User,
  Info
} from 'lucide-react';

export default function MobileNav() {
  const { cartCount } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const activeStyle = "text-[#111111] flex flex-col items-center gap-1 py-2 text-[9px] font-mono tracking-wider font-bold transition-colors";
  const inactiveStyle = "text-[#6b7280] hover:text-[#111111] flex flex-col items-center gap-1 py-2 text-[9px] font-mono tracking-wider transition-colors";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border-light grid grid-cols-5 px-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <NavLink 
        to="/" 
        className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
      >
        <Home size={18} />
        <span>HOME</span>
      </NavLink>

      <NavLink 
        to="/shop" 
        className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
      >
        <Compass size={18} />
        <span>EXPLORE</span>
      </NavLink>

      <button
        onClick={(e) => {
          if (user && user.role === 'admin') {
            e.preventDefault();
            toast.info('Cart and checkout are unavailable while previewing the customer website.');
          } else {
            navigate('/cart');
          }
        }}
        className={inactiveStyle}
      >
        <div className="relative">
          <ShoppingBag size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-neutral-900 text-white font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span>CART</span>
      </button>

      <NavLink 
        to="/about" 
        className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
      >
        <Info size={18} />
        <span>ABOUT</span>
      </NavLink>

      <NavLink 
        to="/profile" 
        className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
      >
        <User size={18} />
        <span>PROFILE</span>
      </NavLink>
    </nav>
  );
}
