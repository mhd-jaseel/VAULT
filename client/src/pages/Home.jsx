import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ChevronRight, ShieldCheck, Truck, RefreshCw, Star, Quote, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import ProductCard from '../components/ProductCard';
import DiscountCountdown from '../components/DiscountCountdown';
import { resolveImage } from '../utils/imageHelper';
import LoginRequiredModal from '../components/LoginRequiredModal';

import { setDocumentSEO } from '../utils/seoHelper';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [discountProducts, setDiscountProducts] = useState([]);
  const [tickTime, setTickTime] = useState(Date.now());
  const [settings, setSettings] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [homepageReviews, setHomepageReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewCarouselIndex, setReviewCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // SEO metadata setup
  useEffect(() => {
    setDocumentSEO({
      title: 'Vault.Co | Online Shopping',
      description: 'Discover luxury men\'s accessories at Vault.Co. Curated collection of masterfully engineered watches, premium leather wallets, belts, jewelry and fragrances.',
      canonicalPath: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Vault.Co',
        url: window.location.origin,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${window.location.origin}/shop?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    });
  }, []);

  // Campaign carousel state
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [campaignPaused, setCampaignPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Reviews touch swipe state
  const [reviewTouchStart, setReviewTouchStart] = useState(null);
  const [reviewTouchEnd, setReviewTouchEnd] = useState(null);

  // Ticker
  useEffect(() => {
    const timer = setInterval(() => setTickTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Campaign auto-slide: 6-second interval
  useEffect(() => {
    if (campaigns.length <= 1 || campaignPaused) return;
    const interval = setInterval(() => {
      setCampaignIndex((prev) => (prev + 1) % campaigns.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [campaigns, campaignPaused]);

  // Touch swipe for campaign
  const handleTouchStart = (e) => {
    setCampaignPaused(true);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    setCampaignPaused(false);
    if (!touchStart || !touchEnd || campaigns.length <= 1) return;
    const diff = touchStart - touchEnd;
    if (diff > 50) setCampaignIndex((p) => (p + 1) % campaigns.length);
    else if (diff < -50) setCampaignIndex((p) => (p - 1 + campaigns.length) % campaigns.length);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Wishlist
  const { user, loading: authLoading } = useContext(AuthContext);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loginModal, setLoginModal] = useState({ open: false, message: '' });

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const res = await api.get('/wishlist');
      if (res.data.success) setWishlistIds(res.data.data.products.map((p) => p._id));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchWishlist(); }, [user]);

  const handleToggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (authLoading) return;
    if (!user) { setLoginModal({ open: true, message: 'Please login to add products to your wishlist.' }); return; }
    const isWishlisted = wishlistIds.includes(productId);
    try {
      if (isWishlisted) {
        const res = await api.delete(`/wishlist/${productId}`);
        if (res.data.success) {
          setWishlistIds((prev) => prev.filter((id) => id !== productId));
          toast.success('Removed from wishlist');
        }
      } else {
        const res = await api.post('/wishlist', { productId });
        if (res.data.success) {
          setWishlistIds((prev) => [...prev, productId]);
          toast.success('Added to wishlist');
        }
      }
    } catch (e) { console.error(e); }
  };

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes, discountRes, settingsRes, campaignRes, reviewRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products?limit=4'),
          api.get('/products/discounted'),
          api.get('/settings'),
          api.get('/campaigns'),
          api.get('/reviews/homepage').catch(() => ({ data: { success: false, data: [] } })),
        ]);

        if (catRes.data.success) setCategories(catRes.data.data);
        if (prodRes.data.success) setFeaturedProducts(prodRes.data.data);
        if (discountRes.data.success) setDiscountProducts(discountRes.data.data);
        if (settingsRes.data.success) setSettings(settingsRes.data.data);
        if (campaignRes.data.success) setCampaigns(campaignRes.data.data);
        if (reviewRes.data && reviewRes.data.success) {
          setHomepageReviews(reviewRes.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Resolve campaign image URL (responsive desktop / mobile fallback)
  const campaignDesktopImgSrc = (campaign) => {
    const url = campaign.desktopImageUrl || campaign.mobileImageUrl;
    if (!url) return null;
    return resolveImage(url);
  };

  const campaignMobileImgSrc = (campaign) => {
    const url = campaign.mobileImageUrl || campaign.desktopImageUrl;
    if (!url) return null;
    return resolveImage(url);
  };

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
            <span>You are previewing the customer Home page. Shopping actions (cart, wishlist, checkout) are disabled.</span>
          </div>
          <Link to="/admin/dashboard" className="text-[10px] font-bold uppercase underline hover:text-black">
            Back to Dashboard
          </Link>
        </div>
      )}
      <div className="flex flex-col gap-0 w-full">
      {/* SEO JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'VAULT.CO',
          url: 'http://localhost:5173',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'http://localhost:5173/shop?search={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        })}
      </script>

      {/* ── CATEGORIES ── */}
      <section className="px-4 md:px-12 py-8 max-w-7xl mx-auto w-full">
        <div className="glass-card">
          {loading ? (
            <div className="grid grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-full aspect-square bg-neutral-50 mb-2 shimmer-bg rounded-2xl" />
                  <div className="h-3 w-16 bg-neutral-50 shimmer-bg" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center text-neutral-400 py-10 text-xs font-sans tracking-wide">
              NO CATEGORIES FOUND. SETUP IN ADMIN.
            </div>
          ) : (
            <>
              {/* Category Grid: Responsive presentation */}
              <div className="grid grid-cols-3 min-[992px]:grid-cols-4 min-[1400px]:grid-cols-5 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10 md:gap-y-12 px-1">
                {categories.map((cat, index) => (
                  <Link
                    key={cat._id}
                    to={`/shop?category=${cat._id}`}
                    className={`flex flex-col items-center select-none cursor-pointer transition-all duration-[220ms] ease-out hover:-translate-y-[3px] group ${
                      index >= 9 ? 'hidden md:flex' : 'flex'
                    }`}
                    aria-label={`View ${cat.name}`}
                  >
                    <div className="w-full aspect-square bg-[#FFFFFF] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.015)] border border-neutral-100/10 flex items-center justify-center overflow-hidden mb-3 sm:mb-4 p-3 sm:p-4 transition-all duration-[220ms] ease-out group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                      {cat.image ? (
                        <img
                          src={resolveImage(cat.image)}
                          alt={cat.name}
                          className="w-full h-full object-contain rounded-xl transition-transform duration-[220ms] ease-out group-hover:scale-[1.03] bg-white"
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-neutral-300 font-bold font-mono text-[9px] tracking-wider">VAULT</span>
                      )}
                    </div>
                    <span className="font-sans text-[11px] sm:text-[13px] font-medium text-[#8A8A8A] group-hover:text-text-primary text-center px-1 tracking-[0.5px] leading-[1.3] transition-colors duration-300 w-full flex items-center justify-center truncate">
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1).toLowerCase()}
                    </span>
                  </Link>
                ))}
              </div>

              {/* View All Button: Rendered only on mobile when categories count exceeds 9 */}
              {categories.length > 9 && (
                <div className="flex md:hidden justify-center mt-6 pt-2">
                  <Link
                    to="/shop"
                    className="inline-flex items-center justify-center gap-2 bg-[#111111] text-white text-[10px] font-mono tracking-[0.2em] uppercase px-6 py-2.5 rounded-full hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs"
                    aria-label="View all categories"
                  >
                    VIEW ALL <ChevronRight size={12} />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── FASHION CAMPAIGNS — 50/50 editorial split ── */}
      <section className="px-4 md:px-12 pb-0 max-w-7xl mx-auto w-full">
        <div
          className="bg-white border border-[#ECECEC] rounded-[2rem] shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden relative h-[560px] xs:h-[540px] sm:h-[520px] md:h-[460px] lg:h-[500px] flex flex-col md:flex-row"
          onMouseEnter={() => setCampaignPaused(true)}
          onMouseLeave={() => setCampaignPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Fashion Campaign"
        >
          {campaigns.length === 0 ? (
            /* Empty state — centered premium placeholder */
            <div className="flex flex-col items-center justify-center text-center py-12 px-8 gap-4 w-full h-full">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-neutral-300">NEW CAMPAIGN</span>
                <div className="w-8 h-px bg-neutral-200 mt-1" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold uppercase text-[#111111] leading-tight tracking-tight">
                Fashion Campaigns
              </h2>
              <p className="text-xs md:text-sm text-neutral-400 max-w-xs leading-relaxed font-light">
                Create your first luxury campaign from the Admin Panel.
              </p>
              <Link
                to="/admin/campaigns"
                className="inline-flex items-center gap-2 bg-[#111111] text-white text-[11px] font-mono tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-neutral-800 transition-colors duration-300 rounded-lg"
              >
                Add Campaign <ChevronRight size={13} />
              </Link>
            </div>
          ) : (() => {
              const campaign = campaigns[campaignIndex];
              if (!campaign) return null;
              const imgSrc = campaignImgSrc(campaign);
              return (
                <div
                  key={campaign._id}
                  className="flex flex-col md:flex-row w-full h-full transition-opacity duration-500 opacity-100"
                >
                  {/* Left — Text column: centered on mobile, left-aligned on desktop */}
                  <div className="flex-1 flex flex-col justify-between px-6 xs:px-8 md:px-12 lg:px-16 py-6 sm:py-8 md:py-12 bg-white order-2 md:order-1 min-h-0 h-full overflow-y-auto text-center md:text-left">
                    {/* Content Top */}
                    <div className="flex flex-col gap-3 items-center md:items-start">
                      {/* Label with top rule */}
                      <div className="flex flex-col gap-2 items-center md:items-start">
                        <div className="w-8 h-px bg-neutral-900" />
                        <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-neutral-400 text-center md:text-left">
                          {campaign.label}
                        </span>
                      </div>

                      {/* Heading — wraps naturally, no overflow clip */}
                      <h1 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-4xl lg:text-5xl lg:leading-[1.05] leading-[0.98] tracking-tight font-extrabold uppercase text-[#111111] break-words text-center md:text-left">
                        {campaign.title}
                      </h1>

                      {/* Description */}
                      <p className="text-xs md:text-sm text-neutral-500 max-w-xs sm:max-w-sm leading-relaxed font-light text-center md:text-left mx-auto md:mx-0">
                        {campaign.description}
                      </p>
                    </div>

                    {/* Content Bottom: CTA + Dots */}
                    <div className="flex flex-col gap-4 mt-4 pt-2 items-center md:items-start">
                      {/* CTA Button */}
                      <Link
                        to={campaign.ctaLink || '/shop'}
                        className="self-center md:self-start inline-flex items-center gap-3 bg-[#111111] text-white text-[11px] font-mono tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-neutral-800 transition-colors duration-300 group rounded-lg"
                      >
                        {campaign.ctaText}
                        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </Link>

                      {/* Dot indicators */}
                      {campaigns.length > 1 && (
                        <div className="flex gap-2 justify-center md:justify-start w-full md:w-auto" role="tablist">
                          {campaigns.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCampaignIndex(idx)}
                              className={`h-px transition-all duration-300 cursor-pointer ${
                                idx === campaignIndex
                                  ? 'w-8 bg-[#111111]'
                                  : 'w-4 bg-neutral-300 hover:bg-neutral-500'
                              }`}
                              title={`Go to campaign ${idx + 1}`}
                              aria-label={`Go to campaign slide ${idx + 1}`}
                              aria-selected={idx === campaignIndex}
                              role="tab"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right — Image area: stable reserved dimensions & properly framed model (top center focal point) */}
                  <div className="w-full h-[220px] xs:h-[240px] sm:h-[260px] md:h-full md:w-1/2 lg:w-1/2 relative bg-neutral-100 order-1 md:order-2 overflow-hidden flex-shrink-0">
                    {campaignDesktopImgSrc(campaign) || campaignMobileImgSrc(campaign) ? (
                      <picture className="w-full h-full block">
                        {campaignMobileImgSrc(campaign) && (
                          <source media="(max-width: 767px)" srcSet={campaignMobileImgSrc(campaign)} />
                        )}
                        <img
                          src={campaignDesktopImgSrc(campaign)}
                          alt={campaign.imageAlt || campaign.title}
                          loading={campaignIndex === 0 ? "eager" : "lazy"}
                          fetchPriority={campaignIndex === 0 ? "high" : "low"}
                          className="w-full h-full object-cover object-[center_top] block"
                        />
                      </picture>
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <span className="text-[10px] font-mono text-neutral-300 tracking-widest uppercase">VAULT.CO</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          }
        </div>
      </section>

      {/* ── REST OF HOME PAGE ── */}
      <div className="flex flex-col gap-8 px-4 md:px-12 py-8 max-w-7xl mx-auto w-full">

        {/* Discount Products */}
        {settings?.showDiscountsOnHomepage && discountProducts.length > 0 && (
          <section className="glass-card">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span className="text-[10px] text-red-500 uppercase tracking-widest font-mono font-bold">LIMITED TIME DEALS</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-text-primary font-sans">
                  Exclusive Offers
                </h2>
                <p className="text-xs text-text-secondary mt-1">Limited-time deals on premium VAULT.CO accessories.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {discountProducts.map((prod, idx) => {
                return (
                  <div key={prod._id} className="flex flex-col">
                    <DiscountCountdown
                      endDate={prod.discountEndDate}
                      showCountdown={prod.showCountdown}
                      tickTime={tickTime}
                      onExpire={() => setDiscountProducts((prev) => prev.filter((p) => p._id !== prod._id))}
                    />
                    <ProductCard
                      product={prod}
                      index={idx}
                      wishlistIds={wishlistIds}
                      onToggleWishlist={handleToggleWishlist}
                      user={user}
                      forceSmall={true}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* New Arrivals */}
        <section className="glass-card">
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
              {[...Array(4)].map((_, i) => <div key={i} className="h-80 rounded-2xl shimmer-bg" />)}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center text-text-secondary py-10 text-xs font-mono">NO PRODUCTS AVAILABLE. SETUP IN ADMIN.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
        <section className="glass-card !p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { 
                Icon: Truck, 
                title: 'Fast Shipping', 
                desc: settings?.activeSpecialCampaign 
                  ? `🎉 ${settings.activeSpecialCampaign.name}: FREE Delivery!` 
                  : `Free delivery above ₹${(settings?.freeShippingMinAmount || 1500).toLocaleString('en-IN')}` 
              },
              { Icon: ShieldCheck, title: 'Authentic Products', desc: '100% genuine guarantees' },
              { Icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle free options' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-center sm:flex-col lg:flex-row gap-4 sm:gap-2 lg:gap-4 text-left sm:text-center lg:text-left justify-start sm:justify-center items-center">
                <div className="p-3 rounded-full bg-neutral-100 text-[#111111] flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <div>
                  <h5 className="font-mono font-bold text-[10px] text-text-primary uppercase tracking-wider">{title}</h5>
                  <p className="text-[10px] text-text-secondary">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 1. CUSTOMER REVIEWS (Admin Selected & Approved Real Database Reviews) ── */}
        {!reviewsLoading && homepageReviews.length > 0 && (
          <section className="glass-card relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-border-light pb-4">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono font-bold flex items-center gap-1.5">
                  <Star size={12} className="text-[#f5a623] fill-[#f5a623]" /> VERIFIED EXPERIENCES
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-text-primary uppercase tracking-tight mt-1">
                  Customer Reviews
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-text-secondary font-bold">
                  {homepageReviews.length} {homepageReviews.length === 1 ? 'FEATURED REVIEW' : 'FEATURED REVIEWS'}
                </span>
                {homepageReviews.length > 3 && (
                  <div className="hidden md:flex items-center gap-1.5">
                    <button
                      onClick={() => setReviewCarouselIndex((prev) => Math.max(0, prev - 1))}
                      disabled={reviewCarouselIndex === 0}
                      className="w-8 h-8 rounded-full border border-border-light bg-white hover:bg-neutral-100 flex items-center justify-center text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Previous reviews"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setReviewCarouselIndex((prev) => Math.min(homepageReviews.length - 3, prev + 1))}
                      disabled={reviewCarouselIndex >= homepageReviews.length - 3}
                      className="w-8 h-8 rounded-full border border-border-light bg-white hover:bg-neutral-100 flex items-center justify-center text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Next reviews"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Layout: 3 cards visible with smooth sliding */}
            <div className="hidden md:block overflow-hidden">
              <div
                className="grid grid-cols-3 gap-6 transition-transform duration-500 ease-out"
                style={{
                  transform: homepageReviews.length > 3 ? `translateX(-${reviewCarouselIndex * (100 / 3 + 2)}%)` : 'none',
                }}
              >
                {homepageReviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-6 bg-white border border-border-light rounded-2xl flex flex-col justify-between hover:border-text-primary/25 transition-all shadow-xs space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Rating Stars & Verified badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex text-[#f5a623]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < rev.rating ? '#f5a623' : 'none'}
                              className={i < rev.rating ? 'text-[#f5a623] fill-[#f5a623]' : 'text-neutral-300'}
                            />
                          ))}
                        </div>
                        {rev.isVerifiedPurchase && (
                          <span className="text-[8px] font-mono font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                            <CheckCircle2 size={9} /> Verified
                          </span>
                        )}
                      </div>

                      {/* Review Headline & Text */}
                      {rev.title && (
                        <h4 className="font-sans font-bold text-xs text-text-primary uppercase tracking-wide line-clamp-1">
                          {rev.title}
                        </h4>
                      )}
                      <p className="text-xs font-sans text-neutral-600 leading-relaxed line-clamp-4 italic">
                        "{rev.comment}"
                      </p>
                    </div>

                    {/* Customer & Product Footnote */}
                    <div className="pt-4 border-t border-border-light flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold font-sans text-text-primary uppercase text-[11px] truncate">
                          {rev.user?.name || 'Verified Customer'}
                        </p>
                        <p className="text-[9px] font-mono text-text-secondary">
                          {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      {rev.product && (
                        <Link
                          to={`/product/${rev.product._id}`}
                          className="text-[9px] font-mono text-text-secondary hover:text-text-primary uppercase tracking-wider font-bold truncate max-w-[120px] text-right"
                        >
                          {rev.product.name} →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Layout: 1 card per swipe with clean pagination dots */}
            <div
              className="md:hidden overflow-hidden"
              onTouchStart={(e) => setReviewTouchStart(e.targetTouches[0].clientX)}
              onTouchMove={(e) => setReviewTouchEnd(e.targetTouches[0].clientX)}
              onTouchEnd={() => {
                if (!reviewTouchStart || !reviewTouchEnd) return;
                const diff = reviewTouchStart - reviewTouchEnd;
                if (diff > 40) setReviewCarouselIndex((p) => Math.min(homepageReviews.length - 1, p + 1));
                else if (diff < -40) setReviewCarouselIndex((p) => Math.max(0, p - 1));
                setReviewTouchStart(null);
                setReviewTouchEnd(null);
              }}
            >
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${reviewCarouselIndex * 100}%)` }}
              >
                {homepageReviews.map((rev) => (
                  <div key={rev._id} className="w-full shrink-0 px-1">
                    <div className="p-5 bg-white border border-border-light rounded-2xl flex flex-col justify-between shadow-xs space-y-3">
                      {/* Rating Stars & Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex text-[#f5a623]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < rev.rating ? '#f5a623' : 'none'}
                              className={i < rev.rating ? 'text-[#f5a623] fill-[#f5a623]' : 'text-neutral-300'}
                            />
                          ))}
                        </div>
                        {rev.isVerifiedPurchase && (
                          <span className="text-[8px] font-mono font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                            <CheckCircle2 size={9} /> Verified
                          </span>
                        )}
                      </div>

                      {/* Review Content */}
                      {rev.title && (
                        <h4 className="font-sans font-bold text-xs text-text-primary uppercase tracking-wide">
                          {rev.title}
                        </h4>
                      )}
                      <p className="text-xs font-sans text-neutral-600 leading-relaxed italic">
                        "{rev.comment}"
                      </p>

                      {/* Customer & Product footer */}
                      <div className="pt-3 border-t border-border-light flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold font-sans text-text-primary uppercase text-[11px]">
                            {rev.user?.name || 'Verified Customer'}
                          </p>
                          <p className="text-[9px] font-mono text-text-secondary">
                            {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {rev.product && (
                          <Link
                            to={`/product/${rev.product._id}`}
                            className="text-[9px] font-mono text-text-secondary hover:text-text-primary uppercase font-bold truncate max-w-[120px]"
                          >
                            {rev.product.name} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile pagination dots */}
              {homepageReviews.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {homepageReviews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setReviewCarouselIndex(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        reviewCarouselIndex === i ? 'w-5 bg-text-primary' : 'w-1.5 bg-neutral-300'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
    </>
  );
}
