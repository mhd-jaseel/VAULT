import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, ShieldCheck, Sparkles, Truck, RefreshCw, Heart, ArrowLeft, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import heroImg from '../assets/hero.png';
import CountdownTimer from '../components/CountdownTimer';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [dealProducts, setDealProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Deals carousel states
  const [dealIndex, setDealIndex] = useState(0);
  const [dealPaused, setDealPaused] = useState(false);
  const [dealTouchStart, setDealTouchStart] = useState(null);
  const [dealTouchEnd, setDealTouchEnd] = useState(null);

  useEffect(() => {
    if (dealProducts.length <= 1 || dealPaused) return;
    const interval = setInterval(() => {
      setDealIndex((prev) => (prev + 1) % dealProducts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [dealProducts, dealPaused]);

  const handleDealTouchStart = (e) => {
    setDealPaused(true);
    setDealTouchStart(e.targetTouches[0].clientX);
  };

  const handleDealTouchMove = (e) => {
    setDealTouchEnd(e.targetTouches[0].clientX);
  };

  const handleDealTouchEnd = () => {
    setDealPaused(false);
    if (!dealTouchStart || !dealTouchEnd) return;
    const diff = dealTouchStart - dealTouchEnd;
    if (diff > 50) {
      setDealIndex((prev) => (prev + 1) % dealProducts.length);
    } else if (diff < -50) {
      setDealIndex((prev) => (prev - 1 + dealProducts.length) % dealProducts.length);
    }
    setDealTouchStart(null);
    setDealTouchEnd(null);
  };

  const { user } = useContext(AuthContext);
  const [wishlistIds, setWishlistIds] = useState([]);

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/wishlist');
      if (res.data.success) {
        setWishlistIds(res.data.data.products.map(p => p._id));
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const handleToggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.warning('Please login to save items to your wishlist.');
      return;
    }
    const isCurrentlyWishlisted = wishlistIds.includes(productId);
    try {
      if (isCurrentlyWishlisted) {
        const res = await axios.delete(`/wishlist/${productId}`);
        if (res.data.success) {
          setWishlistIds(prev => prev.filter(id => id !== productId));
          toast.success('Removed from wishlist');
        }
      } else {
        const res = await axios.post('/wishlist', { productId });
        if (res.data.success) {
          setWishlistIds(prev => [...prev, productId]);
          toast.success('Added to wishlist');
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  // Carousel states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await axios.get('/categories');
        const prodRes = await axios.get('/products?limit=4');
        const dealRes = await axios.get('/products?showOnHomepage=true&limit=4');
        const settingsRes = await axios.get('/settings');
        const bannersRes = await axios.get('/hero-banners');

        if (catRes.data.success) setCategories(catRes.data.data);
        if (prodRes.data.success) setFeaturedProducts(prodRes.data.data);
        if (dealRes.data.success) setDealProducts(dealRes.data.data);
        if (settingsRes.data.success) setSettings(settingsRes.data.data);
        if (bannersRes.data.success && bannersRes.data.data.length > 0) {
          setBanners(bannersRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching landing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Carousel Auto-play logic
  useEffect(() => {
    const activeLength = banners.length > 0 ? banners.length : 1;
    if (activeLength <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeLength);
    }, 5500);

    return () => clearInterval(timer);
  }, [banners, isPaused]);

  // Touch Swipe handlers
  const handleTouchStart = (e) => {
    setIsPaused(true);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || banners.length <= 1) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    } else if (isRightSwipe) {
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
    setTimeout(() => setIsPaused(false), 4000);
  };

  const handlePrev = () => {
    const activeLength = banners.length > 0 ? banners.length : 1;
    setCurrentIndex((prev) => (prev - 1 + activeLength) % activeLength);
  };

  const handleNext = () => {
    const activeLength = banners.length > 0 ? banners.length : 1;
    setCurrentIndex((prev) => (prev + 1) % activeLength);
  };

  const defaultBanner = {
    _id: 'default',
    badgeText: settings?.heroSubtitle || 'NEW ARRIVALS EVERY WEEK',
    heading: settings?.heroTitle || 'UNCOMPROMISING LUXURY',
    description: settings?.heroDescription || 'Crafted for the modern gentleman. Discover premium leather wallets, masterfully engineered watches, and artisanal jewelry designed to last.',
    primaryButtonText: 'SHOP NOW',
    primaryButtonLink: '/shop',
    secondaryButtonText: 'VIEW BEST SELLERS',
    secondaryButtonLink: '/shop?featured=true',
    imageUrl: heroImg,
    imageAlt: 'Featured accessory banner image representation',
    featuredLabel: 'FEATURED COLLECTIBLE',
    featuredTitle: settings?.heroProductName || 'Vault Precision Chrono',
    featuredPrice: settings?.heroProductPrice || 14999
  };

  const activeBanners = banners.length > 0 ? banners : [defaultBanner];

  return (
    <div className="flex flex-col gap-8 px-4 md:px-12 py-6 max-w-7xl mx-auto w-full">
      {/* Category Section (Dynamic 3-column Grid on Mobile, Standard list/grid on Desktop) */}
      <section className="order-1 md:order-3 bg-white py-12 md:py-16">
        <div className="flex flex-col gap-6 mb-12 px-2 md:px-0">
          <div className="flex flex-col gap-2.5">
            <span className="text-[8px] text-neutral-400 uppercase tracking-[0.25em] font-sans font-semibold leading-none">CURATED COLLECTIONS</span>
            <h2 className="text-3xl md:text-4xl font-light text-neutral-900 font-sans tracking-wide leading-tight">Shop by Category</h2>
          </div>

          <div className="flex items-center justify-between w-full mt-2">
            <div className="h-[1px] bg-neutral-100 flex-1 mr-6 hidden md:block" />
            <Link
              to="/shop"
              className="group/btn text-[11px] font-sans font-semibold text-neutral-800 hover:text-neutral-950 flex items-center gap-1 tracking-wider uppercase transition-colors duration-300 py-1"
              aria-label="Browse all categories"
            >
              Browse All <span className="inline-block transform transition-transform duration-300 group-hover/btn:translate-x-1.5">→</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-6 md:hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full aspect-[4/5] bg-neutral-50 rounded-[20px] mb-2 shimmer-bg" />
                <div className="h-3 w-16 bg-neutral-50 shimmer-bg" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center text-neutral-400 py-10 text-xs font-sans tracking-wide">NO CATEGORIES FOUND. SETUP IN ADMIN.</div>
        ) : (
          <div>
            {/* Mobile Redesigned 3-column Grid - No Borders, Generous Whitespace */}
            <div className="grid grid-cols-3 gap-x-5 gap-y-7 md:hidden px-1">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/shop?category=${cat._id}`}
                  className="flex flex-col items-center select-none active:scale-[0.98] transition-all duration-200 ease-out group will-change-transform"
                  aria-label={`View ${cat.name}`}
                >
                  {/* Premium Image Container - softly rounded corners, nearly invisible card background */}
                  <div className="w-full aspect-[4/5] bg-[#FCFCFC] rounded-[20px] p-1.5 flex items-center justify-center overflow-hidden mb-2.5 transition-all duration-300 group-hover:bg-neutral-50/80 shadow-[0_2px_12px_rgba(0,0,0,0.01)] group-active:shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-neutral-100/10">
                    {cat.image ? (
                      <img
                        src={`http://localhost:5000${cat.image}`}
                        alt={cat.name}
                        className="w-[90%] h-[90%] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03] group-active:scale-[1.03] opacity-0 onLoad-fade-in"
                        loading="lazy"
                        onLoad={(e) => e.target.classList.remove('opacity-0')}
                      />
                    ) : (
                      <span className="text-neutral-300 font-bold font-mono text-[9px] tracking-wider">VAULT</span>
                    )}
                  </div>
                  {/* Premium Typography Name - Title Case, font weight 500-600, elegant spacing */}
                  <span className="font-sans text-[13px] font-semibold text-neutral-900 text-center truncate w-full px-0.5 leading-none">
                    {cat.name.charAt(0).toUpperCase() + cat.name.slice(1).toLowerCase()}
                  </span>
                </Link>
              ))}
            </div>

            {/* Desktop Grid Layout (Untouched) */}
            <div className="hidden md:grid md:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/shop?category=${cat._id}`}
                  className="group relative h-40 rounded-2xl overflow-hidden border border-border-light bg-neutral-50 transition-all duration-300 hover:border-text-primary shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                >
                  {cat.image ? (
                    <img
                      src={`http://localhost:5000${cat.image}`}
                      alt={cat.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400 font-bold group-hover:text-text-primary transition-colors">
                      VAULT
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <h3 className="font-mono font-bold text-xs tracking-wider uppercase text-white group-hover:text-white transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[9px] text-neutral-300 mt-0.5 truncate">{cat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Premium Hero Banner Carousel Wrapper */}
      <section
        className="order-2 md:order-1 glass-card !p-8 md:!p-12 lg:!p-16 relative overflow-hidden w-full group/carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {activeBanners.map((slide, index) => {
          const isActive = index === currentIndex;
          const bannerImageSrc = slide.imageUrl.startsWith('/')
            ? `http://localhost:5000${slide.imageUrl}`
            : slide.imageUrl;

          if (!isActive) return null;

          return (
            <div
              key={slide._id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full h-full"
            >
              <div className="lg:col-span-7 flex flex-col items-start gap-5">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-light bg-neutral-100 text-[#111111] text-[10px] tracking-wider uppercase font-mono">
                  <Sparkles size={10} /> {slide.badgeText}
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-[#111111] leading-[1.1] tracking-tight uppercase">
                  {slide.heading.split(' ').map((word, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <br />}
                      {word}
                    </React.Fragment>
                  ))}
                </h1>
                <p className="text-xs md:text-sm text-text-secondary max-w-xl font-normal leading-relaxed">
                  {slide.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
                  <Link to={slide.primaryButtonLink} className="btn-gold px-8 py-3.5 text-[10px] tracking-widest uppercase flex items-center justify-center gap-1.5">
                    {slide.primaryButtonText} <ChevronRight size={14} />
                  </Link>
                  <Link to={slide.secondaryButtonLink} className="btn-dark px-8 py-3.5 text-[10px] tracking-widest uppercase flex items-center justify-center gap-1.5">
                    {slide.secondaryButtonText}
                  </Link>
                </div>
              </div>

              {/* Featured Product Image with Info Overlay on Right */}
              <div className="lg:col-span-5 relative w-full h-64 md:h-80 lg:h-96 rounded-2xl bg-neutral-100 overflow-hidden flex items-center justify-center border border-border-light">
                <img
                  src={bannerImageSrc}
                  alt={slide.imageAlt}
                  loading={isActive ? "eager" : "lazy"}
                  className="w-full h-full object-cover"
                />
                {/* Floating Small Info Card Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-3.5 rounded-xl border border-border-light shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[9px] text-text-secondary uppercase">{slide.featuredLabel}</p>
                    <h4 className="font-bold text-xs text-text-primary uppercase tracking-wide">
                      {slide.featuredTitle}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-text-primary">
                      ₹{Number(slide.featuredPrice).toLocaleString('en-IN')}
                    </span>
                    <button className="p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors text-text-primary">
                      <Heart size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Carousel Dot Indicators */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${idx === currentIndex ? 'bg-text-primary w-4' : 'bg-neutral-300'
                  }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Limited Time Offers / Today's Deals Section */}
      {dealProducts.length > 0 && (
        <section className="order-3 md:order-2 glass-card border border-red-500/10 shadow-[0_4px_24px_rgba(239,68,68,0.03)] bg-gradient-to-br from-white to-red-500/[0.005]">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="text-[10px] text-red-500 uppercase tracking-widest font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Limited Time Deals
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-text-primary uppercase tracking-tight mt-1">Today's Deals</h2>
            </div>
            <Link to="/shop" className="text-[10px] font-mono text-text-primary hover:underline flex items-center gap-0.5 tracking-wider">
              VIEW ALL DEALS <ChevronRight size={12} />
            </Link>
          </div>

          {/* Tablet & Desktop Grid View */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dealProducts.map((prod) => (
              <Link
                key={prod._id}
                to={`/product/${prod._id}`}
                className="group relative flex flex-col bg-white border border-border-light rounded-2xl overflow-hidden transition-all duration-300 hover:border-text-primary hover:shadow-sm"
              >
                <div className="relative h-auto aspect-square md:h-48 w-full overflow-hidden bg-neutral-50 flex items-center justify-center p-4 border-b border-border-light">
                  {prod.images && prod.images.length > 0 ? (
                    <img
                      src={`http://localhost:5000${prod.images[0]}`}
                      alt={prod.name}
                      className="w-full h-full object-cover object-center md:max-h-full md:max-w-full md:object-contain group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <span className="text-neutral-300 font-bold tracking-widest font-mono text-xs">VAULT</span>
                  )}
                  {prod.stock === 0 && (
                    <span className="absolute top-3 left-3 bg-red-50 text-red-600 text-[8px] uppercase tracking-wider font-bold py-1 px-2.5 rounded-full border border-red-200 z-20">
                      Sold Out
                    </span>
                  )}

                  {/* Discount Badge Overlay */}
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-[8px] uppercase tracking-wider font-bold py-1 px-2.5 rounded-full border border-red-600 z-20 shadow-sm">
                    {prod.discountType === 'percentage' ? `${prod.discountValue}% OFF` : `₹${prod.discountValue} OFF`}
                  </span>

                  {/* Wishlist Button Overlay */}
                  {(!user || user.role !== 'admin') && (
                    <button
                      onClick={(e) => handleToggleWishlist(e, prod._id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md border border-neutral-200/40 text-neutral-800 hover:scale-110 active:scale-95 transition-all shadow-sm z-20 flex items-center justify-center cursor-pointer"
                      title="Save to Wishlist"
                    >
                      <Heart size={13} className={wishlistIds.includes(prod._id) ? "fill-red-500 text-red-500" : "text-neutral-400 hover:text-red-500"} />
                    </button>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-1.5 flex-1 justify-between">
                  <div>
                    <span className="text-[8px] text-text-secondary uppercase tracking-widest font-mono">
                      {prod.category?.name || 'ACCESSORIES'}
                    </span>
                    <h3 className="font-sans font-bold text-xs tracking-wide text-text-primary mt-0.5 line-clamp-1">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="mt-2 border-t border-border-light pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary font-mono font-bold text-xs">₹{prod.finalPrice?.toLocaleString('en-IN')}</span>
                      <span className="text-text-secondary font-mono text-[10px] line-through">₹{prod.originalPrice?.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Expiry Countdown Timer */}
                    {prod.showCountdown && prod.discountEndDate && (
                      <CountdownTimer endDate={prod.discountEndDate} />
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile Carousel View (<768px) */}
          <div
            className="block md:hidden relative overflow-hidden"
            onTouchStart={handleDealTouchStart}
            onTouchMove={handleDealTouchMove}
            onTouchEnd={handleDealTouchEnd}
            onMouseEnter={() => setDealPaused(true)}
            onMouseLeave={() => setDealPaused(false)}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${dealIndex * 100}%)` }}
            >
              {dealProducts.map((prod) => (
                <div key={prod._id} className="w-full flex-shrink-0 px-1">
                  <Link
                    to={`/product/${prod._id}`}
                    className="group relative flex flex-col bg-white border border-border-light rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-neutral-50 flex items-center justify-center p-4 border-b border-border-light">
                      {prod.images && prod.images.length > 0 ? (
                        <img
                          src={`http://localhost:5000${prod.images[0]}`}
                          alt={prod.name}
                          loading="lazy"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-neutral-300 font-bold tracking-widest font-mono text-xs">VAULT</span>
                      )}
                      {prod.stock === 0 && (
                        <span className="absolute top-3 left-3 bg-red-50 text-red-600 text-[8px] uppercase tracking-wider font-bold py-1 px-2.5 rounded-full border border-red-200 z-20">
                          Sold Out
                        </span>
                      )}

                      {/* Discount Badge Overlay */}
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-[8px] uppercase tracking-wider font-bold py-1 px-2.5 rounded-full border border-red-600 z-20 shadow-sm">
                        {prod.discountType === 'percentage' ? `${prod.discountValue}% OFF` : `₹${prod.discountValue} OFF`}
                      </span>

                      {/* Wishlist Button Overlay */}
                      {(!user || user.role !== 'admin') && (
                        <button
                          onClick={(e) => handleToggleWishlist(e, prod._id)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md border border-neutral-200/40 text-neutral-800 hover:scale-110 active:scale-95 transition-all shadow-sm z-20 flex items-center justify-center cursor-pointer"
                          title="Save to Wishlist"
                        >
                          <Heart size={13} className={wishlistIds.includes(prod._id) ? "fill-red-500 text-red-500" : "text-neutral-400"} />
                        </button>
                      )}
                    </div>

                    <div className="p-4 flex flex-col gap-1.5 justify-between">
                      <div>
                        <span className="text-[8px] text-text-secondary uppercase tracking-widest font-mono">
                          {prod.category?.name || 'ACCESSORIES'}
                        </span>
                        <h3 className="font-sans font-bold text-xs tracking-wide text-text-primary mt-0.5 line-clamp-1">
                          {prod.name}
                        </h3>
                      </div>

                      <div className="mt-2 border-t border-border-light pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-text-primary font-mono font-bold text-xs">₹{prod.finalPrice?.toLocaleString('en-IN')}</span>
                          <span className="text-text-secondary font-mono text-[10px] line-through">₹{prod.originalPrice?.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Expiry Countdown Timer */}
                        {prod.showCountdown && prod.discountEndDate && (
                          <CountdownTimer endDate={prod.discountEndDate} />
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            {dealProducts.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {dealProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDealIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${idx === dealIndex ? 'bg-red-500 w-5' : 'bg-neutral-300'
                      }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="order-4 md:order-4 glass-card">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono font-bold">FEATURED PIECES</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-text-primary uppercase tracking-tight mt-1">New Arrivals</h2>
          </div>
          <Link to="/shop" className="text-[10px] font-mono text-text-primary hover:underline flex items-center gap-0.5 tracking-wider">
            EXPLORE ALL <ChevronRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl shimmer-bg" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center text-text-secondary py-10 text-xs font-mono">NO PRODUCTS AVAILABLE. SETUP IN ADMIN.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <Link
                key={prod._id}
                to={`/product/${prod._id}`}
                className="group flex flex-col bg-white border border-border-light rounded-2xl overflow-hidden transition-all duration-300 hover:border-text-primary hover:shadow-sm"
              >
                {/* Product image centered on very light gray backdrop */}
                <div className="relative h-auto aspect-square md:h-64 w-full overflow-hidden bg-neutral-50 flex items-center justify-center p-6 border-b border-border-light">
                  {prod.images && prod.images.length > 0 ? (
                    <img
                      src={`http://localhost:5000${prod.images[0]}`}
                      alt={prod.name}
                      className="w-full h-full object-cover object-center md:max-h-full md:max-w-full md:object-contain group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <span className="text-neutral-300 font-bold tracking-widest font-mono text-xs">VAULT</span>
                  )}
                  {prod.stock === 0 && (
                    <span className="absolute top-3 left-3 bg-red-50 text-red-600 text-[8px] uppercase tracking-wider font-bold py-1 px-2.5 rounded-full border border-red-200 z-20">
                      Sold Out
                    </span>
                  )}

                  {/* Dynamic Heart/Wishlist Button */}
                  {(!user || user.role !== 'admin') && (
                    <button
                      onClick={(e) => handleToggleWishlist(e, prod._id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md border border-neutral-200/40 text-neutral-800 hover:scale-110 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-20 flex items-center justify-center cursor-pointer"
                      title="Save to Wishlist"
                    >
                      <Heart size={14} className={wishlistIds.includes(prod._id) ? "fill-red-500 text-red-500" : "text-neutral-400 hover:text-red-500 transition-colors"} />
                    </button>
                  )}

                  {/* Brand & Rating Overlays */}
                  <span className="card-pill brand-pill">
                    {prod.brand?.name || 'VAULT'}
                  </span>
                  <span className="card-pill rating-pill">
                    ★ {prod.ratings?.average ? prod.ratings.average.toFixed(1) : '4.8'}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-1.5 flex-1 justify-between">
                  <div>
                    <span className="text-[9px] text-text-secondary uppercase tracking-widest font-mono">
                      {prod.category?.name || 'ACCESSORIES'}
                    </span>
                    <h3 className="font-sans font-bold text-xs tracking-wide text-text-primary transition-colors mt-0.5 line-clamp-1">
                      {prod.name}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-light">
                    <span className="text-text-primary font-mono font-bold text-xs">₹{prod.price.toLocaleString('en-IN')}</span>
                    <span className="text-text-secondary text-[9px] font-mono hover:underline uppercase tracking-wider">Details</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Trust Badges */}
      <section className="order-5 md:order-5 glass-card !p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex items-center sm:flex-col lg:flex-row gap-4 sm:gap-2 lg:gap-4 text-left sm:text-center lg:text-left justify-start sm:justify-center items-center">
            <div className="p-3 rounded-full bg-neutral-100 text-[#111111] flex items-center justify-center">
              <Truck size={20} />
            </div>
            <div>
              <h5 className="font-mono font-bold text-[10px] text-text-primary uppercase tracking-wider">Fast Shipping</h5>
              <p className="text-[10px] text-text-secondary">Free delivery above ₹1500</p>
            </div>
          </div>

          <div className="flex items-center sm:flex-col lg:flex-row gap-4 sm:gap-2 lg:gap-4 text-left sm:text-center lg:text-left justify-start sm:justify-center items-center">
            <div className="p-3 rounded-full bg-neutral-100 text-[#111111] flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 className="font-mono font-bold text-[10px] text-text-primary uppercase tracking-wider">Authentic Products</h5>
              <p className="text-[10px] text-text-secondary">100% genuine guarantees</p>
            </div>
          </div>

          <div className="flex items-center sm:flex-col lg:flex-row gap-4 sm:gap-2 lg:gap-4 text-left sm:text-center lg:text-left justify-start sm:justify-center items-center">
            <div className="p-3 rounded-full bg-neutral-100 text-[#111111] flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <div>
              <h5 className="font-mono font-bold text-[10px] text-text-primary uppercase tracking-wider">Easy Returns</h5>
              <p className="text-[10px] text-text-secondary">7-day hassle free options</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
