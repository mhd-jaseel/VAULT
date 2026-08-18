import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Heart, Star, ShoppingBag, ArrowLeft, Send, CheckCircle2, ShieldCheck, Truck, RefreshCw, Check, Lock } from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';
import { resolveImage } from '../utils/imageHelper';
import LoginRequiredModal from '../components/LoginRequiredModal';
import ReviewSection from '../components/reviews/ReviewSection';
import { setDocumentSEO } from '../utils/seoHelper';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function ProductDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user, loading: authLoading } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [inWishlist, setInWishlist] = useState(false);

  // Replacement Mode State
  const mode = searchParams.get('mode');
  const returnIdParam = searchParams.get('returnId');
  const isReplacementMode = mode === 'replacement' && Boolean(returnIdParam);
  const [returnRecord, setReturnRecord] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submittingReplacement, setSubmittingReplacement] = useState(false);

  const [userWallet, setUserWallet] = useState(null);

  // Login-required modal
  const [loginModal, setLoginModal] = useState({ open: false, message: '' });
  const showLoginModal = (message) => setLoginModal({ open: true, message });

  // Fetch Return Details & User Wallet for Replacement Mode
  const fetchReturnDetails = async () => {
    if (!isReplacementMode) return;
    try {
      const res = await axios.get(`/returns/${returnIdParam}`);
      if (res.data.success) {
        setReturnRecord(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching return record for replacement:', err);
    }

    try {
      const walletRes = await axios.get('/wallet');
      if (walletRes.data.success) {
        setUserWallet(walletRes.data.data);
      }
    } catch (wErr) {
      console.error('Error fetching wallet:', wErr);
    }
  };

  useEffect(() => {
    if (isReplacementMode) fetchReturnDetails();
  }, [isReplacementMode, returnIdParam]);

  const handleConfirmReplacementSelection = async () => {
    if (!returnRecord || !product) return;
    setSubmittingReplacement(true);

    try {
      const formData = new FormData();
      formData.append('orderId', returnRecord.order._id || returnRecord.order);
      formData.append('productId', returnRecord.orderItem.product);
      formData.append('returnType', 'replacement');
      formData.append('reason', returnRecord.reason || 'Replacement request from catalog');
      formData.append('replacementProductId', product._id);

      const res = await axios.post('/returns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const retData = res.data.data;
        const additionalDue = retData.additionalAmount || 0;

        if (additionalDue > 0 && retData.razorpayOrderId) {
          // Trigger Razorpay for additional amount
          const resScript = await loadRazorpay();
          if (!resScript) {
            toast.error('Razorpay SDK failed to load.');
            setSubmittingReplacement(false);
            return;
          }

          const options = {
            key: res.data.razorpayKeyId,
            amount: retData.razorpayAmount,
            currency: 'INR',
            name: 'VAULT',
            description: `Replacement difference payment for Return #${retData.returnId}`,
            order_id: retData.razorpayOrderId,
            handler: async (response) => {
              try {
                const verifyRes = await axios.post(`/returns/${retData._id}/verify-payment`, {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                });
                if (verifyRes.data.success) {
                  toast.success('Replacement difference paid successfully!');
                  navigate(`/returns/${retData._id}`);
                }
              } catch (vErr) {
                toast.error(vErr.response?.data?.message || 'Payment verification failed.');
              }
            },
            prefill: {
              name: user?.name,
              email: user?.email,
              contact: user?.phone,
            },
            theme: { color: '#111111' },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          toast.success('Replacement request confirmed!');
          navigate(`/returns/${retData._id}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit replacement choice.');
    } finally {
      setSubmittingReplacement(false);
    }
  };

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

    const brandName = product.brand?.name || 'Vault.Co';
    const categoryName = product.category?.name || 'Accessories';
    const primaryImg = product.images && product.images[0] ? resolveImage(product.images[0]) : '';

    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.images ? product.images.map((img) => resolveImage(img)) : [],
      description: product.description,
      sku: product.sku || product._id,
      brand: {
        '@type': 'Brand',
        name: brandName,
      },
      offers: {
        '@type': 'Offer',
        url: window.location.href,
        priceCurrency: 'INR',
        price: product.price,
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    };

    if (product.ratings && product.ratings.count > 0 && product.ratings.average > 0) {
      productSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.ratings.average.toFixed(1),
        reviewCount: product.ratings.count,
      };
    }

    const breadcrumbList = [
      { name: 'Home', url: '/' },
      { name: categoryName, url: product.category?._id ? `/shop?category=${product.category._id}` : '/shop' },
      { name: product.name, url: `/product/${product._id}` },
    ];

    setDocumentSEO({
      title: `${product.name} | Vault.Co`,
      description: product.description
        ? product.description.slice(0, 160)
        : `Shop ${product.name} at Vault.Co. Premium craft and authentic design.`,
      canonicalPath: `/product/${product._id}`,
      ogType: 'product',
      ogImage: primaryImg,
      jsonLd: productSchema,
      breadcrumbList,
    });
  }, [product]);

  const [togglingWishlist, setTogglingWishlist] = useState(false);

  const handleToggleWishlist = async () => {
    if (authLoading || togglingWishlist) return;
    if (!user) {
      showLoginModal('Please login to add products to your wishlist.');
      return;
    }

    try {
      setTogglingWishlist(true);
      if (inWishlist) {
        const res = await axios.delete(`/wishlist/${id}`);
        if (res.data.success) {
          setInWishlist(false);
          toast.success('Removed from wishlist');
        }
      } else {
        const res = await axios.post('/wishlist', { productId: id });
        if (res.data.success) {
          setInWishlist(true);
          toast.success('Added to wishlist');
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setTogglingWishlist(false);
    }
  };

  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (authLoading || addingToCart) return;
    if (user && user.role === 'admin') {
      toast.info('Preview Mode — Shopping actions are disabled for admin sessions.');
      return;
    }
    if (!user) {
      showLoginModal('Please login to add products to your cart.');
      return;
    }
    if (product) {
      try {
        setAddingToCart(true);
        const res = await addToCart(product, quantity);
        if (res && res.success) {
          toast.success(`${res.name || product.name} successfully added to cart!`);
        }
      } finally {
        setAddingToCart(false);
      }
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
      {user && user.role === 'admin' && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 py-3 px-6 md:px-12 flex items-center justify-between font-mono text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-mono">
              PREVIEW MODE
            </span>
            <span>You are previewing the customer Product Details page. Shopping actions (cart, wishlist, checkout) are disabled.</span>
          </div>
          <Link to="/admin/dashboard" className="text-[10px] font-bold uppercase underline hover:text-black">
            Back to Dashboard
          </Link>
        </div>
      )}
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
            {activeImage ? (
              <>
                <img 
                  src={resolveImage(activeImage)} 
                  alt={product.name} 
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
                <span className="text-neutral-300 font-bold tracking-widest font-mono text-xs hidden items-center justify-center">VAULT</span>
              </>
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
                    fill={product.ratings?.average && i < Math.round(product.ratings.average) ? '#f5a623' : 'none'}
                    className={product.ratings?.average && i < Math.round(product.ratings.average) ? 'text-[#f5a623] fill-[#f5a623]' : 'text-neutral-300'}
                  />
                ))}
              </div>
              <span className="font-bold text-text-primary mt-0.5">
                {product.ratings?.average ? product.ratings.average.toFixed(1) : '0.0'}
              </span>
              <span className="text-text-secondary mt-0.5">
                ({product.ratings?.count || 0} {product.ratings?.count === 1 ? 'REVIEW' : 'REVIEWS'})
              </span>
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
                <span>Includes signature VAULT.CO keepsake box</span>
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

            {/* Add to Cart / Wishlist Actions */}
            {isReplacementMode ? (
                <div className="bg-[#111111] text-white p-5 rounded-2xl border border-neutral-800 space-y-4 font-mono shadow-xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      REPLACEMENT SELECTION
                    </span>
                    <span className="text-[10px] text-neutral-400">Return #{returnRecord?.returnId}</span>
                  </div>

                  {(() => {
                    const itemPrice = (product.isDiscounted ? product.finalPrice : product.price) * quantity;
                    const walletBal = userWallet ? userWallet.balance : 0;
                    const walletUsed = Math.min(walletBal, itemPrice);
                    const remainingWallet = walletBal - walletUsed;
                    const additionalDue = Math.max(0, itemPrice - walletBal);

                    return (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Available Vault Store Credit:</span>
                          <span className="font-bold text-white">₹{walletBal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Replacement Product Total:</span>
                          <span className="font-bold text-white">₹{itemPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Store Credit Contribution:</span>
                          <span className="font-bold text-emerald-400">- ₹{walletUsed.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Remaining Store Credit:</span>
                          <span className="font-bold text-neutral-300">₹{remainingWallet.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-neutral-800 font-bold text-sm">
                          <span className="text-white">Additional Razorpay Amount:</span>
                          <span className={additionalDue > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                            ₹{additionalDue.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={product.stock === 0}
                    className="w-full btn-gold py-4 text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check size={14} /> SELECT AS REPLACEMENT
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || addingToCart}
                    className="flex-grow btn-gold py-3.5 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={14} />
                    {addingToCart ? 'ADDING...' : 'ADD TO CART'}
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

      {/* Customer Reviews Section */}
      <ReviewSection productId={product._id} productName={product.name} />

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
                      src={resolveImage(prod.images[0])} 
                      alt={prod.name} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-all duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
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
      {/* ── REPLACEMENT CONFIRMATION MODAL ── */}
      {confirmModalOpen && returnRecord && product && (() => {
        const effectivePrice = (product.isDiscounted ? product.finalPrice : product.price) * (returnRecord.orderItem?.quantity || 1);
        const originalPaid = returnRecord.orderItem?.totalOriginalPaid || 0;
        const diff = Math.max(0, effectivePrice - originalPaid);

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-6 z-10 text-neutral-900 font-mono shadow-2xl space-y-4">
              <h3 className="font-bold text-sm uppercase text-neutral-900 border-b border-neutral-100 pb-3">
                Confirm Replacement Selection
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500">Original Product:</span>
                  <span className="font-bold text-neutral-900 font-sans">{returnRecord.orderItem?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-neutral-100">
                  <span className="text-neutral-500">Original Amount Paid:</span>
                  <span className="font-bold text-neutral-900">₹{originalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-neutral-100">
                  <span className="text-neutral-500">Replacement Product:</span>
                  <span className="font-bold text-neutral-950 font-sans">{product.name}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-neutral-100">
                  <span className="text-neutral-500">Replacement Price:</span>
                  <span className="font-bold text-neutral-900">₹{effectivePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-neutral-200 font-bold text-sm">
                  <span className="uppercase text-neutral-900">Additional Amount Due:</span>
                  <span className={diff > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                    ₹{diff.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setConfirmModalOpen(false)}
                  className="flex-1 py-3 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase rounded-xl hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReplacementSelection}
                  disabled={submittingReplacement}
                  className="flex-1 btn-gold py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submittingReplacement ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : diff > 0 ? (
                    <>
                      <Lock size={12} /> Pay ₹{diff.toLocaleString('en-IN')} &amp; Confirm
                    </>
                  ) : (
                    'Confirm Replacement'
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
    </>
  );
}
