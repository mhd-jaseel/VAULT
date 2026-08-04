import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { PremiumSwal } from '../utils/swalHelper';
import { Trash2, Heart, ChevronRight } from 'lucide-react';

export default function Wishlist() {
  const { user } = useContext(AuthContext);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await axios.get('/wishlist');
      if (res.data.success) {
        setWishlistItems(res.data.data.products);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const handleRemove = async (productId, productName) => {
    const result = await PremiumSwal.fire({
      title: 'Remove from Wishlist?',
      text: `Are you sure you want to remove "${productName}" from your wishlist?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(`/wishlist/${productId}`);
      if (res.data.success) {
        setWishlistItems((prev) => prev.filter((p) => p._id !== productId));
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center min-h-screen max-w-xl mx-auto px-4">
        <Heart className="mx-auto text-text-secondary mb-3 stroke-1 animate-pulse" size={48} />
        <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider font-mono">Save Your Favorites</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
          Create an account or login to curate your personal accessories wishlist.
        </p>
        <Link to="/login" className="btn-gold text-[10px] py-2.5 px-6 mt-4 uppercase tracking-widest inline-block">
          Login to Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary mb-1">
        My Wishlist
      </h1>
      <p className="text-xs text-text-secondary mb-6">Manage items saved to your personal vault collection.</p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl shimmer-bg" />
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-white border border-border-light rounded-2xl">
          <Heart className="text-text-secondary mb-3 stroke-1" size={40} />
          <h3 className="font-bold text-sm text-text-primary uppercase tracking-wide">Your Wishlist is Empty</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-xs leading-relaxed">
            Curate items you love and watch them save here.
          </p>
          <Link to="/shop" className="btn-gold text-[10px] py-2.5 px-6 mt-4 uppercase tracking-widest flex items-center gap-1">
            Shop Catalog <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wishlistItems.map((prod) => (
            <div
              key={prod._id}
              className="group relative flex flex-col bg-white border border-border-light rounded-2xl overflow-hidden transition-all duration-300 hover:border-text-primary hover:shadow-sm"
            >
              <div className="relative h-auto aspect-square md:h-48 w-full overflow-hidden bg-neutral-50 flex items-center justify-center p-6 border-b border-border-light">
                {prod.images && prod.images.length > 0 ? (
                  <img
                    src={`http://localhost:5000${prod.images[0]}`}
                    alt={prod.name}
                    className="w-full h-full object-cover object-center md:max-h-full md:max-w-full md:object-contain group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <span className="text-neutral-300 font-bold tracking-widest font-mono text-xs">VAULT</span>
                )}
                {/* Delete button */}
                <button
                  onClick={() => handleRemove(prod._id, prod.name)}
                  className="absolute top-3 right-3 bg-white/95 border border-border-light text-red-500 hover:text-red-600 p-2 rounded-full shadow-sm cursor-pointer transition-colors z-20"
                  title="Remove item"
                >
                  <Trash2 size={14} />
                </button>
                {/* Brand & Rating Overlays */}
                <span className="card-pill brand-pill">
                  {prod.brand?.name || 'VAULT'}
                </span>
                <span className="card-pill rating-pill">
                  ★ {prod.ratings?.average ? prod.ratings.average.toFixed(1) : '4.8'}
                </span>
              </div>
              <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                <div>
                  <h3 className="font-sans font-bold text-xs tracking-wide text-text-primary group-hover:text-neutral-900 transition-colors line-clamp-1">
                    {prod.name}
                  </h3>
                  <span className="text-text-primary font-bold font-mono text-xs mt-1 block">₹{prod.price.toLocaleString('en-IN')}</span>
                </div>
                <Link
                  to={`/product/${prod._id}`}
                  className="btn-dark text-[9px] !py-2 text-center uppercase tracking-widest"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
