import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Heart, Star, ShoppingBag, ArrowLeft, Send, CheckCircle2, ShieldCheck, Truck, RefreshCw, Share2 } from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';
import { resolveImage } from '../utils/imageHelper';
import LoginRequiredModal from '../components/LoginRequiredModal';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [inWishlist, setInWishlist] = useState(false);

  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Login-required modal
  const [loginModal, setLoginModal] = useState({ open: false, message: '' });
  const showLoginModal = (message) => setLoginModal({ open: true, message });

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const prodRes = await axios.get(`/products/${id}`);
      if (prodRes.data.success) {
        setProduct(prodRes.data.data);
        if (prodRes.data.data.images && prodRes.data.data.images.length > 0) {
          setActiveImage(prodRes.data.data.images[0]);
        }
      }

      // Fetch related products
      const relRes = await axios.get(`/products/related/${id}`);
      if (relRes.data.success) {
        setRelated(relRes.data.data);
      }

      // Fetch reviews
      const revRes = await axios.get(`/reviews/${id}`);
      if (revRes.data.success) {
        setReviews(revRes.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/wishlist');
      if (res.data.success) {
        const prodIds = res.data.data.products.map((p) => p._id);
        setWishlist(prodIds);
        setInWishlist(prodIds.includes(id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    fetchWishlist();
  }, [id, user]);

  useEffect(() => {
    if (!product) return;

    const originalTitle = document.title;
    document.title = `${product.name} | VAULT.CO`;

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalMetaDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', product.description || 'Premium accessories by VAULT.CO');

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', `${product.name} | VAULT.CO`);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', product.description || 'Premium accessories by VAULT.CO');

    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    if (product.images && product.images[0]) {
      ogImage.setAttribute('content', `http://localhost:5000${product.images[0]}`);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": product.images && product.images.map(img => resolveImage(img)),
      "description": product.description,
      "sku": product.sku || product._id,
      "brand": {
        "@type": "Brand",
        "name": "VAULT.CO"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "INR",
        "price": product.price,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      }
    };

    const scriptId = 'product-jsonld';
    let scriptTag = document.getElementById(scriptId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(structuredData);

    return () => {
      document.title = originalTitle;
      if (metaDesc) metaDesc.setAttribute('content', originalMetaDesc);
      const createdScript = document.getElementById(scriptId);
      if (createdScript) createdScript.remove();
    };
  }, [product]);

  const handleToggleWishlist = async () => {
    if (!user) {
      showLoginModal('Please login to add products to your wishlist.');
      return;
    }

    try {
      if (inWishlist) {
        const res = await axios.delete(`/wishlist/${id}`);
        if (res.data.success) {
          setInWishlist(false);
        }
      } else {
        const res = await axios.post('/wishlist', { productId: id });
        if (res.data.success) {
          setInWishlist(true);
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      showLoginModal('Please login to add products to your cart.');
      return;
    }
    if (product) {
      addToCart(product, quantity);
      toast.success(`${product.name} successfully added to cart!`);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!comment.trim()) {
      setReviewError('Please write your review comment.');
      return;
    }

    try {
      const res = await axios.post(`/reviews/${id}`, { rating, comment });
      if (res.data.success) {
        setReviewSuccess('Review submitted successfully!');
        setComment('');
        // Reload reviews and rating averages
        const revRes = await axios.get(`/reviews/${id}`);
        if (revRes.data.success) setReviews(revRes.data.data);
        
        const prodRes = await axios.get(`/products/${id}`);
        if (prodRes.data.success) setProduct(prodRes.data.data);
      }
    } catch (error) {
      setReviewError(error.response?.data?.message || 'Failed to submit review.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center min-h-screen">
        <h2 className="text-text-primary font-bold uppercase font-mono text-xs">Product not found.</h2>
        <Link to="/shop" className="text-text-primary hover:underline mt-2 inline-block font-mono text-xs">Back to catalog</Link>
      </div>
    );
  }

  // Price calculations resolved from server active discount logic

  return (
    <>
      <LoginRequiredModal
        isOpen={loginModal.open}
        onClose={() => setLoginModal({ open: false, message: '' })}
        message={loginModal.message}
      />
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      <Link to="/shop" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors font-mono text-[10px] mb-6 tracking-wider">
        <ArrowLeft size={12} /> BACK TO CATALOG
      </Link>

      <div className="glass-card grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images Area (Left Column) */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-50 flex items-center justify-center p-8 border border-border-light">
            <span className="absolute top-4 left-4 bg-[#141414] text-white text-[8px] font-mono tracking-widest uppercase py-1 px-3 rounded-full">
              BEST SELLER
            </span>
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-neutral-50 text-text-primary border border-border-light shadow-sm">
              <Share2 size={14} />
            </button>
            {activeImage ? (
              <img 
                src={resolveImage(activeImage)} 
                alt={product.name} 
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-neutral-300 font-bold tracking-widest font-mono text-xs">VAULT</span>
            )}
          </div>
          {/* Thumbnails row */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden bg-white border flex-shrink-0 cursor-pointer p-2 transition-all duration-200 ${
                    activeImage === img ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-border-light hover:border-neutral-400'
                  }`}
                >
                  <img src={resolveImage(img)} alt="" className="max-h-full max-w-full object-contain mx-auto" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Area (Right Column) */}
        <div className="flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">
                {product.category?.name || 'ACCESSORIES'}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-text-primary mt-1">
                {product.name}
              </h1>
            </div>

            {/* Ratings summary */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    fill={i < Math.round(product.ratings.average) ? '#f5a623' : 'none'}
                    className={i < Math.round(product.ratings.average) ? 'text-[#f5a623] fill-[#f5a623]' : 'text-neutral-300'}
                  />
                ))}
              </div>
              <span className="font-bold text-text-primary mt-0.5">{product.ratings.average}</span>
              <span className="text-text-secondary mt-0.5">({product.ratings.count} REVIEWS)</span>
            </div>

            {/* Price Block */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-extrabold text-text-primary">
                  ₹{(product.isDiscounted ? product.finalPrice : product.price).toLocaleString('en-IN')}
                </span>
                {product.isDiscounted && (
                  <>
                    <span className="text-sm text-text-secondary line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="bg-red-50 text-red-600 text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-red-200/50 shadow-[0_2px_8px_rgba(239,68,68,0.05)]">
                      {product.discountType === 'percentage' ? `${product.discountValue}% OFF` : `₹${product.discountValue} OFF`}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-b border-border-light py-4 my-2">
              <h4 className="font-mono font-bold text-[10px] uppercase tracking-wider text-text-secondary mb-1.5">Overview</h4>
              <p className="text-xs text-text-secondary leading-relaxed font-normal">{product.description}</p>
            </div>

            {/* Key Features Checklist */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-text-primary">
                <CheckCircle2 size={14} className="text-[#16a34a]" />
                <span>Artisanal craftsmanship and luxury finish</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-primary">
                <CheckCircle2 size={14} className="text-[#16a34a]" />
                <span>Premium sustainably sourced materials</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-primary">
                <CheckCircle2 size={14} className="text-[#16a34a]" />
                <span>Includes signature VAULT keepsake box</span>
              </div>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
              <span className="text-text-secondary">Availability:</span>
              {product.stock > 0 ? (
                <span className="text-[#16a34a] font-bold">In Stock ({product.stock} items left)</span>
              ) : (
                <span className="text-red-500 font-bold">Sold Out</span>
              )}
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono tracking-wider text-text-secondary uppercase">Quantity:</span>
                <div className="flex items-center border border-border-light rounded-full bg-white py-1 px-2.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-2.5 py-0.5 hover:text-text-primary text-text-secondary transition-colors font-bold text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3.5 text-xs font-bold text-text-primary">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="px-2.5 py-0.5 hover:text-text-primary text-text-secondary transition-colors font-bold text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {(!user || user.role !== 'admin') && (
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-grow btn-gold py-3.5"
                >
                  <ShoppingBag size={14} /> ADD TO CART
                </button>
                <button
                  onClick={handleToggleWishlist}
                  className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                    inWishlist
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'border-border-light bg-white text-text-secondary hover:text-text-primary hover:border-text-primary'
                  }`}
                >
                  <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
                </button>
              </div>
            )}

            {/* 3-Column Trust-Badge Row */}
            <div className="grid grid-cols-3 gap-2 border-t border-border-light pt-5 mt-4 text-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-text-primary">
                  <ShieldCheck size={16} />
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-text-secondary">Authentic</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-text-primary">
                  <Truck size={16} />
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-text-secondary">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-text-primary">
                  <RefreshCw size={16} />
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-text-secondary">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="glass-card mt-8">
        <div className="flex items-center justify-between border-b border-border-light pb-4 mb-6">
          <h2 className="text-md font-extrabold uppercase tracking-tight text-text-primary font-sans">
            Customer Reviews
          </h2>
          <div className="bg-neutral-100 text-text-primary font-mono text-[10px] py-1 px-3 rounded-full flex items-center gap-1.5">
            <Star size={10} className="text-[#f5a623] fill-[#f5a623]" />
            <span>{product.ratings.average} ({reviews.length} REVIEWS)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Review list */}
          <div className="md:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <p className="text-xs text-text-secondary font-mono">NO REVIEWS YET. BE THE FIRST TO REVIEW!</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev._id} className="border-b border-border-light pb-4">
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="font-bold text-xs text-text-primary uppercase">{rev.user?.name}</h5>
                    <span className="text-[9px] text-text-secondary font-mono">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex text-gold mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={10}
                        fill={i < rev.rating ? '#f5a623' : 'none'}
                        className={i < rev.rating ? 'text-[#f5a623] fill-[#f5a623]' : 'text-neutral-300'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-normal">{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Create review form */}
          <div>
            {user ? (
              <form onSubmit={handleReviewSubmit} className="bg-neutral-50 p-5 rounded-2xl border border-border-light flex flex-col gap-4">
                <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider">Write a Review</h4>
                
                {reviewSuccess && <p className="text-[10px] text-[#16a34a] font-bold uppercase font-mono">{reviewSuccess}</p>}
                {reviewError && <p className="text-[10px] text-red-500 font-bold uppercase font-mono">{reviewError}</p>}

                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">Rating</label>
                  <select
                    className="form-input text-xs cursor-pointer !py-2.5 font-mono"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value={5}>5 STARS - EXCELLENT</option>
                    <option value={4}>4 STARS - GREAT</option>
                    <option value={3}>3 STARS - AVERAGE</option>
                    <option value={2}>2 STARS - POOR</option>
                    <option value={1}>1 STAR - TERRIBLE</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">Comments</label>
                  <textarea
                    placeholder="Describe your experience with this accessory..."
                    className="form-input text-xs min-h-[80px]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-gold text-[10px] !py-3 flex items-center justify-center gap-1.5">
                  <Send size={12} /> SUBMIT REVIEW
                </button>
              </form>
            ) : (
              <div className="bg-neutral-50 p-6 rounded-2xl border border-border-light text-center flex flex-col gap-2">
                <Star className="mx-auto text-neutral-400" size={24} />
                <h5 className="text-[10px] font-mono font-bold uppercase text-text-primary">Share Your Experience</h5>
                <p className="text-[10px] text-text-secondary leading-relaxed">Only verified users can leave reviews.</p>
                <Link to="/login" className="btn-dark text-[10px] py-2 px-4 mt-2">LOGIN TO REVIEW</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="glass-card mt-8">
          <h2 className="text-md font-extrabold uppercase tracking-tight text-text-primary mb-6 font-sans">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((prod) => (
              <Link 
                key={prod._id}
                to={`/product/${prod._id}`}
                className="group flex flex-col bg-white border border-border-light rounded-2xl overflow-hidden transition-all duration-300 hover:border-text-primary hover:shadow-sm"
              >
                <div className="relative h-48 overflow-hidden bg-neutral-50 flex items-center justify-center p-4 border-b border-border-light">
                  {prod.images && prod.images.length > 0 ? (
                    <img 
                      src={`http://localhost:5000${prod.images[0]}`} 
                      alt={prod.name} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <span className="text-neutral-300 font-bold tracking-widest font-mono text-xs">VAULT</span>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-1 flex-1 justify-between">
                  <h3 className="font-sans font-bold text-xs tracking-wide text-text-primary line-clamp-1">
                    {prod.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-text-primary font-mono font-bold text-xs">₹{prod.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  );
}
