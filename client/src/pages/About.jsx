import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Compass, Heart, ShieldCheck, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import ownerPhotoFallback from '../assets/owner_portrait.png';
import { resolveImage } from '../utils/imageHelper';
import { setDocumentSEO } from '../utils/seoHelper';

const ICON_MAP = {
  Award,
  Compass,
  Heart,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
};

export default function About() {
  const { user } = useContext(AuthContext);
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDocumentSEO({
      title: 'About Vault.Co',
      description: 'Learn about Vault.Co — engineered for the modern gentleman with artisanal craft, timeless horology, and uncompromised quality.',
      canonicalPath: '/about',
      breadcrumbList: [
        { name: 'Home', url: '/' },
        { name: 'About', url: '/about' },
      ],
    });

    const fetchAboutData = async () => {
      try {
        const res = await axios.get('/about');
        if (res.data.success && res.data.data) {
          setAboutData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load about page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAboutData();
  }, []);

  const hero = aboutData?.hero || {
    establishedYear: 'ESTABLISHED 2026',
    titlePart1: 'THE ART OF PURE',
    titleHighlight: 'CURATION',
    subtitle:
      "VAULT.CO was founded on a simple principle: to engineer elite, premium men's essentials that stand the test of time. No shortcuts. No compromise. Just pure craftsmanship.",
  };

  // Helper: Format count into 0-999, 1k+, 10k+, 100k+, 1M+
  const formatUserCount = (count) => {
    if (typeof count !== 'number' || count < 0) return '10k+'; // graceful fallback
    if (count < 1000) return `${count}`;
    if (count < 1000000) {
      const thousands = Math.floor(count / 1000);
      return `${thousands}k+`;
    }
    const millions = Math.floor(count / 1000000);
    return `${millions}M+`;
  };

  const dynamicUserCountLabel = formatUserCount(aboutData?.registeredUserCount);

  const rawStats = aboutData?.story?.stats?.length
    ? aboutData.story.stats
    : [
        { value: '100%', label: 'Full-Grain Leather' },
        { value: '10k+', label: 'Satisfied Gentlemen' },
        { value: '0%', label: 'Traditional Markup' },
        { value: '24/7', label: 'Dedicated Support' },
      ];

  const processedStats = rawStats.map((st) => {
    if (st.label?.toLowerCase().includes('satisfied') || st.label?.toLowerCase().includes('gentlemen') || st.label?.toLowerCase().includes('user')) {
      return {
        ...st,
        value: dynamicUserCountLabel,
      };
    }
    return st;
  });

  const story = {
    tagline: aboutData?.story?.tagline || 'OUR NARRATIVE',
    heading: aboutData?.story?.heading || 'REDEFINING MODERN LUXURY',
    paragraphs: aboutData?.story?.paragraphs?.length
      ? aboutData.story.paragraphs
      : [
          'Born in Mumbai, Maharashtra, VAULT.CO began as a creative studio focused on sourcing and refining the highest grade materials. Our journey started with custom horology timepieces and soon evolved into a comprehensive lineup of men\'s lifestyle accessories, including premium full-grain leather wallets, durable brass-buckle belts, and bespoke fragrances.',
          'We believe that premium accessories are not merely decorative—they are an extension of one\'s identity. By working directly with master artisans and removing traditional wholesale margins, we curate collections that offer exceptional refinement at honest value.',
        ],
    statsHeading: aboutData?.story?.statsHeading || 'VAULT.CO AT A GLANCE',
    stats: processedStats,
  };

  const values = aboutData?.values?.items?.length
    ? aboutData.values
    : {
        tagline: 'OUR GUIDING PRINCIPLES',
        heading: 'THE PILLARS OF EXCELLENCE',
        items: [
          {
            icon: 'Award',
            title: 'Elite Quality',
            description: 'We select premium, top-grain leathers and high-grade stainless steel to ensure every piece endures.',
          },
          {
            icon: 'Compass',
            title: 'Bespoke Design',
            description: 'Minimalist, bold, and timeless silhouettes tailored for modern styles and utility.',
          },
          {
            icon: 'Heart',
            title: 'Honest Value',
            description: 'By bypassing conventional luxury retail markups, we deliver luxury straight to your doorstep.',
          },
          {
            icon: 'ShieldCheck',
            title: 'Customer Priority',
            description: 'Dedicated post-purchase assistance, straightforward returns, and complete delivery updates.',
          },
        ],
      };

  const founder = aboutData?.founder || {
    name: 'Aarav Sharma',
    designation: 'Founder & CEO, VAULT.CO',
    tagline: "FOUNDER'S PERSPECTIVE",
    heading: 'A NOTE FROM AARAV SHARMA',
    image: '',
    paragraphs: [
      '"At VAULT.CO, we don\'t believe in fast fashion. We believe in items that carry a presence, that command attention without shouting. When I started VAULT.CO, my goal was to disrupt the accessories space by pairing exceptional, artisan-level craft with modern luxury logistics."',
      '"Each timepiece, leather piece, and fragrance is curated with extreme attention to detail. We ensure that our materials are sourced responsibly and built to last. Thank you for being a part of our journey and welcoming VAULT.CO into your daily lifestyle."',
    ],
    isActive: true,
  };

  const coFounder = aboutData?.coFounder;
  const additionalSections = (aboutData?.additionalSections || [])
    .filter((s) => s.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const resolveImgUrl = (img) => {
    if (!img) return null;
    return resolveImage(img);
  };

  return (
    <div className="bg-white text-neutral-900 min-h-screen">
      {user && user.role === 'admin' && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 py-3 px-6 md:px-12 flex items-center justify-between font-mono text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-mono">
              PREVIEW MODE
            </span>
            <span>You are previewing the customer About page. Content is dynamically managed from Admin.</span>
          </div>
          <Link to="/admin/about" className="text-[10px] font-bold uppercase underline hover:text-black">
            Manage About Page
          </Link>
        </div>
      )}

      {/* Hero Section with Luxury Atelier Imagery */}
      <section className="relative py-24 md:py-36 bg-neutral-950 text-white flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Gradient & Vignette Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/brand/about_hero.webp"
            alt="VAULT.CO Atelier Craftsmanship"
            className="w-full h-full object-cover object-center opacity-35 scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-neutral-950/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-neutral-950/60 to-neutral-950" />
        </div>

        {/* Subtle decorative gold glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
        
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono tracking-[0.25em] text-amber-300 uppercase mb-5 backdrop-blur-md">
            {hero.establishedYear || 'ESTABLISHED 2026'}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display uppercase tracking-tight mb-6 text-white drop-shadow-sm">
            {hero.titlePart1 || 'THE ART OF PURE'}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
              {hero.titleHighlight || 'CURATION'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-neutral-300 font-sans max-w-2xl mx-auto leading-relaxed font-light">
            {hero.subtitle}
          </p>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block mb-2">
              {story.tagline || 'OUR NARRATIVE'}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-display mb-6">
              {story.heading || 'REDEFINING MODERN LUXURY'}
            </h2>
            <div className="space-y-4 text-xs md:text-sm text-neutral-600 leading-relaxed">
              {story.paragraphs && story.paragraphs.length > 0 ? (
                story.paragraphs.map((p, idx) => <p key={idx}>{p}</p>)
              ) : (
                <p>Born in Mumbai, Maharashtra, VAULT.CO began as a creative studio focused on sourcing and refining the highest grade materials.</p>
              )}
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-100 rounded-3xl p-8 md:p-12 flex flex-col gap-6">
            <h3 className="font-mono text-xs font-bold text-neutral-900 uppercase tracking-widest border-b border-neutral-200 pb-4">
              {story.statsHeading || 'VAULT.CO AT A GLANCE'}
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {(story.stats || []).map((st, idx) => (
                <div key={idx}>
                  <p className="text-2xl font-bold font-mono text-neutral-900">{st.value}</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">{st.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-neutral-50 py-20 px-6 md:px-12 border-t border-b border-neutral-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block mb-2">
              {values.tagline || 'OUR GUIDING PRINCIPLES'}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-display">
              {values.heading || 'THE PILLARS OF EXCELLENCE'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {(values.items || []).map((val, idx) => {
              const IconComponent = ICON_MAP[val.icon] || Award;
              return (
                <div key={idx} className="bg-white border border-neutral-100 p-6 rounded-2xl flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                    <IconComponent size={18} />
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 font-display">
                    {val.title}
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {val.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      {founder && founder.isActive !== false && (
        <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Founder Image */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gold/10 rounded-3xl blur-2xl group-hover:bg-gold/20 transition-all duration-300" />
                <div className="relative w-72 h-96 md:w-80 md:h-[420px] rounded-3xl overflow-hidden border border-neutral-200 p-2 bg-white">
                  <img 
                    src={resolveImgUrl(founder.image) || ownerPhotoFallback} 
                    alt={`${founder.name || 'Founder'} of VAULT.CO`} 
                    className="w-full h-full object-cover rounded-2xl filter grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Founder Message */}
            <div className="lg:col-span-7">
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block mb-2">
                {founder.tagline || "FOUNDER'S PERSPECTIVE"}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-display mb-6">
                {founder.heading || `A NOTE FROM ${founder.name?.toUpperCase() || 'FOUNDER'}`}
              </h2>
              <div className="space-y-4 text-xs md:text-sm text-neutral-600 leading-relaxed italic">
                {(founder.paragraphs || []).map((p, idx) => (
                  <p key={idx}>{p.startsWith('"') ? p : `"${p}"`}</p>
                ))}
              </div>
              <div className="mt-8 border-t border-neutral-100 pt-6">
                <p className="font-extrabold text-sm uppercase tracking-wide text-neutral-950">{founder.name}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono mt-0.5">{founder.designation}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Co-Founder Section */}
      {coFounder && coFounder.isActive && (
        <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto border-t border-neutral-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Co-Founder Message */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block mb-2">
                {coFounder.tagline || "CO-FOUNDER'S VISION"}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-display mb-6">
                {coFounder.heading || `A NOTE FROM ${coFounder.name?.toUpperCase() || 'CO-FOUNDER'}`}
              </h2>
              <div className="space-y-4 text-xs md:text-sm text-neutral-600 leading-relaxed italic">
                {(coFounder.paragraphs || []).map((p, idx) => (
                  <p key={idx}>{p.startsWith('"') ? p : `"${p}"`}</p>
                ))}
              </div>
              <div className="mt-8 border-t border-neutral-100 pt-6">
                <p className="font-extrabold text-sm uppercase tracking-wide text-neutral-950">{coFounder.name}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono mt-0.5">{coFounder.designation}</p>
              </div>
            </div>

            {/* Co-Founder Image */}
            <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-gold/10 rounded-3xl blur-2xl group-hover:bg-gold/20 transition-all duration-300" />
                <div className="relative w-72 h-96 md:w-80 md:h-[420px] rounded-3xl overflow-hidden border border-neutral-200 p-2 bg-white">
                  {coFounder.image ? (
                    <img 
                      src={resolveImgUrl(coFounder.image)} 
                      alt={`${coFounder.name} - Co-Founder of VAULT.CO`} 
                      className="w-full h-full object-cover rounded-2xl filter grayscale hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-neutral-100 flex flex-col items-center justify-center p-6 text-center text-neutral-400 font-mono text-xs">
                      <span>CO-FOUNDER IMAGE</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Additional Dynamic Sections Added by Admin */}
      {additionalSections.map((section, index) => {
        const hasImage = Boolean(section.image);
        const isReversed = index % 2 === 1;

        return (
          <section key={section._id || index} className="py-20 px-6 md:px-12 max-w-7xl mx-auto border-t border-neutral-100">
            <div className={`grid grid-cols-1 ${hasImage ? 'lg:grid-cols-12' : 'max-w-4xl mx-auto'} gap-12 items-center`}>
              {hasImage && (
                <div className={`lg:col-span-5 flex justify-center ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="relative w-full max-w-md h-80 rounded-3xl overflow-hidden border border-neutral-200 p-2 bg-white shadow-xs">
                    <img
                      src={resolveImgUrl(section.image)}
                      alt={section.heading}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                </div>
              )}

              <div className={`${hasImage ? `lg:col-span-7 ${isReversed ? 'lg:order-1' : 'lg:order-2'}` : 'text-center'}`}>
                {section.tagline && (
                  <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block mb-2">
                    {section.tagline}
                  </span>
                )}
                <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-display mb-6">
                  {section.heading}
                </h2>
                <div className="space-y-4 text-xs md:text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

