import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { toast } from 'sonner';
import { resolveImage } from '../utils/imageHelper';

export default function ProductCard({ product, index, wishlistIds, onToggleWishlist, user, forceSmall = false }) {
  const { addToCart } = useContext(CartContext);
  const [isMobileActive, setIsMobileActive] = useState(false);

  const isLarge = !forceSmall && index % 3 === 2;
  const isWishlisted = wishlistIds?.includes(product._id);

  // Discount calculations
  const originalPrice = product.originalPrice || product.price;
  const finalPrice = product.finalPrice || product.price;
  const isDiscounted = product.isDiscounted || finalPrice < originalPrice;

  let discountText = '';
  if (isDiscounted) {
    if (product.discountType === 'percentage') {
      discountText = `${product.discountValue}% OFF`;
    } else if (product.discountType === 'fixed') {
      discountText = `₹${product.discountValue} OFF`;
    } else {
      const percentage = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
      discountText = `${percentage}% OFF`;
    }
  }

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart.`);
  };

  const handleImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isMobileActive) {
      setIsMobileActive(false);
    } else {
      setIsMobileActive(true);
      window.dispatchEvent(new CustomEvent('closeOtherProductCards', { detail: product._id }));
    }
  };

  React.useEffect(() => {
    const handleClose = (e) => {
      if (e.detail !== product._id) {
        setIsMobileActive(false);
      }
    };
    window.addEventListener('closeOtherProductCards', handleClose);

    const handleOutsideClick = (e) => {
      if (!e.target.closest(`.product-card-${product._id}`)) {
        setIsMobileActive(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('closeOtherProductCards', handleClose);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [product._id]);

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP & TABLET VIEW (screens >= 768px) - Keep existing layout + Cart icon */}
      {/* ========================================================================= */}
      <Link
        to={`/product/${product._id}`}
        className="hidden md:flex group relative flex-col bg-white border border-border-light rounded-2xl overflow-hidden transition-all duration-300 hover:border-text-primary hover:shadow-sm"
      >
        <div className="relative h-auto aspect-square md:h-48 w-full overflow-hidden bg-neutral-50 flex items-center justify-center p-4 border-b border-border-light">
          {product.images && product.images.length > 0 ? (
            <img
              src={resolveImage(product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover object-center md:max-h-full md:max-w-full md:object-contain group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <span className="text-neutral-300 font-bold tracking-widest font-mono text-xs">VAULT</span>
          )}

          {product.stock === 0 && (
            <span className="absolute top-3 left-3 bg-red-50 text-red-600 text-[8px] uppercase tracking-wider font-bold py-1 px-2.5 rounded-full border border-red-200 z-20">
              Sold Out
            </span>
          )}

          {/* Discount Badge Overlay */}
          {isDiscounted && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-[8px] uppercase tracking-wider font-bold py-1 px-2.5 rounded-full border border-red-600 z-20 shadow-sm">
              {discountText}
            </span>
          )}

          {/* Action Buttons Overlay (Wishlist + Cart beside each other) */}
          {(!user || user.role !== 'admin') && (
            <div className="absolute top-3 right-3 flex gap-1.5 z-20">
              <button
                onClick={(e) => onToggleWishlist(e, product._id)}
                className="p-2 rounded-full bg-white/90 backdrop-blur-md border border-neutral-200/40 text-neutral-800 hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                title="Save to Wishlist"
              >
                <Heart size={13} className={isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-400 hover:text-red-500"} />
              </button>
              <button
                onClick={handleCartClick}
                disabled={product.stock === 0}
                className="p-2 rounded-full bg-white/90 backdrop-blur-md border border-neutral-200/40 text-neutral-800 hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
                title="Add to Cart"
              >
                <ShoppingCart size={13} className="text-neutral-500 hover:text-neutral-800" />
              </button>
            </div>
          )}

          {/* Brand & Rating Overlays */}
          <span className="card-pill brand-pill">
            {product.brand?.name || 'VAULT'}
          </span>
          <span className="card-pill rating-pill">
            ★ {product.ratings?.average ? product.ratings.average.toFixed(1) : '4.8'}
          </span>
        </div>

        <div className="p-4 flex flex-col gap-1.5 flex-1 justify-between">
          <div>
            <span className="text-[9px] text-text-secondary uppercase tracking-widest font-mono">
              {product.category?.name || 'ACCESSORIES'}
            </span>
            <h3 className="font-sans font-bold text-xs tracking-wide text-text-primary mt-0.5 line-clamp-1">
              {product.name}
            </h3>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-light">
            <span className="text-text-primary font-mono font-bold text-xs">₹{finalPrice.toLocaleString('en-IN')}</span>
            {isDiscounted && (
              <span className="text-text-secondary font-mono text-[9px] line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
            )}
            <span className="text-text-secondary text-[9px] font-mono hover:underline uppercase tracking-wider">Details</span>
          </div>
        </div>
      </Link>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (screens < 768px) - New Premium Asymmetric Alternating Layout */}
      {/* ========================================================================= */}
      <div
        className={`md:hidden flex flex-col bg-white rounded-[18px] overflow-hidden transition-all duration-[220ms] ease-out shadow-[0_4px_20px_rgba(0,0,0,0.015)] border border-neutral-100/30 p-[10px] product-card-${product._id} ${isLarge ? 'col-span-2' : 'col-span-1'
          }`}
      >
        {/* Product Image Container (Click to reveal icons on mobile) */}
        <div
          onClick={handleImageClick}
          className={`relative w-full overflow-hidden bg-white flex items-center justify-center rounded-[16px] cursor-pointer transition-all duration-300 ${isLarge
            ? 'h-[240px] xs:h-[290px]'
            : 'aspect-square'
            }`}
        >
          {/* Product Image */}
          {product.images && product.images.length > 0 ? (
            <img
              src={resolveImage(product.images[0])}
              alt={product.name}
              loading="lazy"
              className={`w-full h-full rounded-[16px] transition-transform duration-[220ms] ease-out ${isLarge ? 'object-cover' : 'object-contain'
                }`}
            />
          ) : (
            <span className="text-neutral-300 font-bold tracking-widest font-mono text-xs">VAULT</span>
          )}

          {product.stock === 0 && (
            <span className="absolute top-3 left-3 bg-red-50 text-red-600 text-[8px] uppercase tracking-wider font-bold py-1 px-2.5 rounded-full border border-red-200 z-10">
              Sold Out
            </span>
          )}

          {/* Action Buttons (Wishlist Top-Right, Cart Bottom-Right) */}
          {(!user || user.role !== 'admin') && (
            <>
              {/* Wishlist Button */}
              <button
                onClick={(e) => onToggleWishlist(e, product._id)}
                className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-neutral-200/40 text-neutral-800 transition-all duration-[200ms] shadow-sm flex items-center justify-center cursor-pointer z-20 ${isMobileActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
                  }`}
                title="Save to Wishlist"
              >
                <Heart size={13} className={isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-400 hover:text-red-500"} />
              </button>

              {/* Cart Button */}
              <button
                onClick={handleCartClick}
                disabled={product.stock === 0}
                className={`absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-neutral-200/40 text-neutral-800 transition-all duration-[200ms] shadow-sm flex items-center justify-center cursor-pointer z-20 disabled:opacity-50 ${isMobileActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
                  }`}
                title="Add to Cart"
              >
                <ShoppingCart size={13} className="text-neutral-500 hover:text-neutral-800" />
              </button>
            </>
          )}
        </div>

        {/* Details Container (Click to navigate) */}
        <Link to={`/product/${product._id}`} className="flex flex-col gap-0 w-full text-left mt-2">
          {/* Brand Name */}
          <span className="text-[9px] text-neutral-400 uppercase tracking-[1px] font-sans">
            {product.brand?.name || 'VAULT'}
          </span>

          {/* Product Name + Rating (same row) */}
          <div className="flex justify-between items-center gap-1 mt-0.5">
            <h3 className="font-sans font-semibold text-[13px] leading-tight text-neutral-900 truncate flex-1">
              {product.name}
            </h3>
            <span className="text-[11px] font-medium text-neutral-500 flex-shrink-0 flex items-center gap-0.5">
              ★ {product.ratings?.average ? product.ratings.average.toFixed(1) : '4.8'}
            </span>
          </div>

          {/* Price + Old Price + Discount (same row) */}
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-neutral-900 font-bold text-[10px]">
              ₹{finalPrice.toLocaleString('en-IN')}
            </span>
            {isDiscounted && (
              <>
                <span className="text-neutral-400 text-[10px] line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-red-600 font-extrabold text-[10px]">
                  {discountText}
                </span>
              </>
            )}
          </div>
        </Link>
      </div>
    </>
  );
}
