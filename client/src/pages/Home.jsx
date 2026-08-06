import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, ShieldCheck, Sparkles, Truck, RefreshCw, Heart, ArrowLeft, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import heroImg from '../assets/hero.png';
import CountdownTimer from '../components/CountdownTimer';
import ProductCard from '../components/ProductCard';

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
      {/* Category Section (Perfect 3-Column Luxury Explore Grid) */}
      <section className="order-1 glass-card">
        
        {loading ? (
          <div className="grid grid-cols-3 gap-6 md:gap-8">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full aspect-square bg-neutral-50 mb-2 shimmer-bg" />
                <div className="h-3 w-16 bg-neutral-50 shimmer-bg" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center text-neutral-400 py-10 text-xs font-sans tracking-wide">NO CATEGORIES FOUND. SETUP IN ADMIN.</div>
        ) : (
          <div>
            {/* Responsive Grid - 3 cols on mobile/tablet, 4 on laptop, 5 on desktop >= 1400px */}
            <div className="grid grid-cols-3 min-[992px]:grid-cols-4 min-[1400px]:grid-cols-5 gap-x-6 gap-y-10 md:gap-y-12 px-1">
              {categories
                .filter((cat) => 
                  ['BELTS', 'BRACELETS', 'CAPS', 'CHAINS', 'CHAPPALS', 'EARRINGS', 'PERFUMES', 'RINGS', 'SHADES'].includes(cat.name.toUpperCase())
                )
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((cat) => (
                  <Link 
                    key={cat._id}
                    to={`/shop?category=${cat._id}`}
                    className="flex flex-col items-center select-none cursor-pointer transition-all duration-[220ms] ease-out hover:-translate-y-[3px] group"
                    aria-label={`View ${cat.name}`}
                  >
                    {/* Premium Image Container - white background, rounded corners, soft shadow */}
                    <div className="w-full aspect-square bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.015)] border border-neutral-100/10 flex items-center justify-center overflow-hidden mb-4 p-4 transition-all duration-[220ms] ease-out group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                      {cat.image ? (
                        <img 
                          src={`http://localhost:5000${cat.image}`} 
                          alt={cat.name} 
                          className="w-full h-full object-contain rounded-xl transition-transform duration-[220ms] ease-out group-hover:scale-[1.03] opacity-0 onLoad-fade-in"
                          loading="lazy"
                          onLoad={(e) => e.target.classList.remove('opacity-0')}
                        />
                      ) : (
                        <span className="text-neutral-300 font-bold font-mono text-[9px] tracking-wider">VAULT</span>
                      )}
                    </div>
                    {/* Premium Typography Name - Title Case, font weight 500, letter-spacing 0.5px, color #8A8A8A */}
                    <span className="font-sans text-[11px] sm:text-[13px] font-medium text-[#8A8A8A] group-hover:text-text-primary text-center px-1 tracking-[0.5px] leading-[1.3] transition-colors duration-300 w-full flex items-center justify-center">
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1).toLowerCase()}
                    </span>
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

          {/* Products Grid View (Asymmetric on Mobile, Responsive on Tablet & Desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dealProducts.map((prod, idx) => (
              <ProductCard
                key={prod._id}
                product={prod}
                index={idx}
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
                user={user}
              />
            ))}
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
            {featuredProducts.map((prod, idx) => (
              <ProductCard
                key={prod._id}
                product={prod}
                index={idx}
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
                user={user}
              />
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
