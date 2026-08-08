import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import CountdownTimer from '../components/CountdownTimer';
import ProductCard from '../components/ProductCard';
import DiscountCountdown from '../components/DiscountCountdown';
import { resolveImage } from '../utils/imageHelper';

const API_BASE = 'http://localhost:5000';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [dealProducts, setDealProducts] = useState([]);
  const [discountProducts, setDiscountProducts] = useState([]);
  const [tickTime, setTickTime] = useState(Date.now());
  const [settings, setSettings] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Campaign carousel state
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [campaignPaused, setCampaignPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

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
  const { user } = useContext(AuthContext);
  const [wishlistIds, setWishlistIds] = useState([]);

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/wishlist');
      if (res.data.success) setWishlistIds(res.data.data.products.map((p) => p._id));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchWishlist(); }, [user]);

  const handleToggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.warning('Please login to save items to your wishlist.'); return; }
    const isWishlisted = wishlistIds.includes(productId);
    try {
      if (isWishlisted) {
        const res = await axios.delete(`/wishlist/${productId}`);
        if (res.data.success) {
          setWishlistIds((prev) => prev.filter((id) => id !== productId));
          toast.success('Removed from wishlist');
        }
      } else {
        const res = await axios.post('/wishlist', { productId });
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
        const [catRes, prodRes, dealRes, discountRes, settingsRes, campaignRes] = await Promise.all([
          axios.get('/categories'),
          axios.get('/products?limit=4'),
          axios.get('/products?showOnHomepage=true&limit=4'),
          axios.get('/products/discounted'),
          axios.get('/settings'),
          axios.get('/campaigns'),
        ]);

        if (catRes.data.success) setCategories(catRes.data.data);
        if (prodRes.data.success) setFeaturedProducts(prodRes.data.data);
        if (dealRes.data.success) setDealProducts(dealRes.data.data);
        if (discountRes.data.success) setDiscountProducts(discountRes.data.data);
        if (settingsRes.data.success) setSettings(settingsRes.data.data);
        if (campaignRes.data.success) setCampaigns(campaignRes.data.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Resolve campaign image URL
  const campaignImgSrc = (campaign) => {
    const url = campaign.desktopImageUrl;
    if (!url) return null;
    return url.startsWith('/') ? `${API_BASE}${url}` : url;
  };

  return (
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
            <div className="grid grid-cols-3 min-[992px]:grid-cols-4 min-[1400px]:grid-cols-5 gap-x-6 gap-y-10 md:gap-y-12 px-1">
              {categories
                .filter((cat) =>
                  ['BELTS', 'BRACELETS', 'CAPS', 'CHAINS', 'PERFUMES', 'RINGS', 'SUNGLASSES', 'WALLETS', 'WATCHES'].includes(
                    cat.name.toUpperCase()
                  )
                )
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/shop?category=${cat._id}`}
                    className="flex flex-col items-center select-none cursor-pointer transition-all duration-[220ms] ease-out hover:-translate-y-[3px] group"
                    aria-label={`View ${cat.name}`}
                  >
                    <div className="w-full aspect-square bg-[#FFFFFF] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.015)] border border-neutral-100/10 flex items-center justify-center overflow-hidden mb-4 p-4 transition-all duration-[220ms] ease-out group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                      {cat.image ? (
                        <img
                          src={resolveImage(cat.image)}
                          alt={cat.name}
                          className="w-full h-full object-contain rounded-xl transition-transform duration-[220ms] ease-out group-hover:scale-[1.03] opacity-0 bg-[#FFFFFF]"
                          loading="lazy"
                          onLoad={(e) => e.target.classList.remove('opacity-0')}
                        />
                      ) : (
                        <span className="text-neutral-300 font-bold font-mono text-[9px] tracking-wider">VAULT</span>
                      )}
                    </div>
                    <span className="font-sans text-[11px] sm:text-[13px] font-medium text-[#8A8A8A] group-hover:text-text-primary text-center px-1 tracking-[0.5px] leading-[1.3] transition-colors duration-300 w-full flex items-center justify-center">
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1).toLowerCase()}
                    </span>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FASHION CAMPAIGNS — 50/50 editorial split ── */}
      <section className="px-4 md:px-12 pb-0 max-w-7xl mx-auto w-full">
        <div
          className="bg-white border border-[#ECECEC] rounded-[2rem] shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden relative"
          onMouseEnter={() => setCampaignPaused(true)}
          onMouseLeave={() => setCampaignPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Fashion Campaign"
        >
          {campaigns.length === 0 ? (
            /* Empty state — centered premium placeholder */
            <div className="flex flex-col items-center justify-center text-center py-20 px-8 gap-5 min-h-[280px]">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-neutral-300">NEW CAMPAIGN</span>
                <div className="w-8 h-px bg-neutral-200 mt-1" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold uppercase text-[#111111] leading-tight tracking-tight">
                Fashion Campaigns
              </h2>
              <p className="text-sm text-neutral-400 max-w-xs leading-relaxed font-light">
                Create your first luxury campaign from the Admin Panel.
              </p>
              <Link
                to="/admin/campaigns"
                className="inline-flex items-center gap-2 bg-[#111111] text-white text-[11px] font-mono tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-neutral-800 transition-colors duration-300 rounded-full"
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
                  className="flex flex-col md:flex-row w-full transition-opacity duration-500 opacity-100"
                >
                  {/* Left — Text column: grows with content, never clips */}
                  <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-12 bg-white gap-5 order-2 md:order-1 min-h-0">
                    {/* Label with top rule */}
                    <div className="flex flex-col gap-3">
                      <div className="w-8 h-px bg-neutral-900" />
                      <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-neutral-400">
                        {campaign.label}
                      </span>
                    </div>

                    {/* Heading — wraps naturally, no overflow clip */}
                    <h1 className="text-[36px] leading-[0.95] tracking-tight font-extrabold uppercase text-[#111111] md:text-5xl xl:text-6xl md:leading-[1.05] break-words">
                      {campaign.title}
                    </h1>

                    {/* Description */}
                    <p className="text-sm text-neutral-500 max-w-xs leading-relaxed font-light">
                      {campaign.description}
                    </p>

                    {/* CTA */}
                    <Link
                      to={campaign.ctaLink || '/shop'}
                      className="self-start inline-flex items-center gap-3 bg-[#111111] text-white text-[11px] font-mono tracking-[0.2em] uppercase px-8 py-4 hover:bg-neutral-800 transition-colors duration-300 group"
                    >
                      {campaign.ctaText}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </Link>

                    {/* Dot indicators */}
                    {campaigns.length > 1 && (
                      <div className="flex gap-2 mt-2">
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
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right — Image: natural aspect on mobile, absolute cover on desktop */}
                  <div className="w-full md:flex-1 relative bg-neutral-100 order-1 md:order-2 overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={campaign.imageAlt || campaign.title}
                        loading="eager"
                        fetchPriority="high"
                        className="w-full h-auto block md:absolute md:inset-0 md:w-full md:h-full md:object-cover md:object-center"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] md:aspect-auto md:absolute md:inset-0 bg-neutral-100 flex items-center justify-center">
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
                <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono font-bold">EXCLUSIVE OFFERS</span>
                <h2 className="text-xl md:text-2xl font-extrabold text-text-primary uppercase tracking-tight mt-1">Exclusive Offers</h2>
                <p className="text-xs text-text-secondary mt-1">Limited-time deals on premium VAULT accessories.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {discountProducts.map((prod, idx) => {
                const isLarge = idx % 3 === 2;
                return (
                  <div key={prod._id} className={`flex flex-col ${isLarge ? 'col-span-2 sm:col-span-1' : 'col-span-1'}`}>
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

        {/* Today's Deals */}
        {dealProducts.length > 0 && (
          <section className="glass-card border border-red-500/10 shadow-[0_4px_24px_rgba(239,68,68,0.03)] bg-gradient-to-br from-white to-red-500/[0.005]">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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

        {/* Trust Badges */}
        <section className="glass-card !p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { Icon: Truck, title: 'Fast Shipping', desc: 'Free delivery above ₹1500' },
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
      </div>
    </div>
  );
}
