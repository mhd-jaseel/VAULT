import React from 'react';
import { Award, Compass, Heart, ShieldCheck } from 'lucide-react';
import ownerPhoto from '../assets/owner_portrait.png';

export default function About() {
  return (
    <div className="bg-white text-neutral-900 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 bg-neutral-950 text-white flex items-center justify-center overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <span className="text-[10px] font-mono tracking-[0.25em] text-gold uppercase block mb-3">
            ESTABLISHED 2026
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold font-display uppercase tracking-tight mb-6">
            THE ART OF PURE <span className="text-gold">CURATION</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-sans max-w-2xl mx-auto leading-relaxed">
            VAULT was founded on a simple principle: to engineer elite, premium men's essentials that stand the test of time. No shortcuts. No compromise. Just pure craftsmanship.
          </p>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block mb-2">
              OUR NARRATIVE
            </span>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-display mb-6">
              REDEFINING MODERN LUXURY
            </h2>
            <div className="space-y-4 text-xs md:text-sm text-neutral-600 leading-relaxed">
              <p>
                Born in Mumbai, Maharashtra, VAULT began as a creative studio focused on sourcing and refining the highest grade materials. Our journey started with custom horology timepieces and soon evolved into a comprehensive lineup of men's lifestyle accessories, including premium full-grain leather wallets, durable brass-buckle belts, and bespoke fragrances.
              </p>
              <p>
                We believe that premium accessories are not merely decorative—they are an extension of one's identity. By working directly with master artisans and removing traditional wholesale margins, we curate collections that offer exceptional refinement at honest value.
              </p>
            </div>
          </div>
          <div className="bg-neutral-50 border border-neutral-100 rounded-3xl p-8 md:p-12 flex flex-col gap-6">
            <h3 className="font-mono text-xs font-bold text-neutral-900 uppercase tracking-widest border-b border-neutral-200 pb-4">
              VAULT AT A GLANCE
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-2xl font-bold font-mono text-neutral-900">100%</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">Full-Grain Leather</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-neutral-900">10k+</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">Satisfied Gentlemen</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-neutral-900">0%</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">Traditional Markup</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-neutral-900">24/7</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">Dedicated Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-neutral-50 py-20 px-6 md:px-12 border-t border-b border-neutral-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block mb-2">
              OUR GUIDING PRINCIPLES
            </span>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-display">
              THE PILLARS OF EXCELLENCE
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Value 1 */}
            <div className="bg-white border border-neutral-100 p-6 rounded-2xl flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <Award size={18} />
              </div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 font-display">
                Elite Quality
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                We select premium, top-grain leathers and high-grade stainless steel to ensure every piece endures.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white border border-neutral-100 p-6 rounded-2xl flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <Compass size={18} />
              </div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 font-display">
                Bespoke Design
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Minimalist, bold, and timeless silhouettes tailored for modern styles and utility.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white border border-neutral-100 p-6 rounded-2xl flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <Heart size={18} />
              </div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 font-display">
                Honest Value
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                By bypassing conventional luxury retail markups, we deliver luxury straight to your doorstep.
              </p>
            </div>

            {/* Value 4 */}
            <div className="bg-white border border-neutral-100 p-6 rounded-2xl flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 font-display">
                Customer Priority
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Dedicated post-purchase assistance, straightforward returns, and complete delivery updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Section */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Owner Image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gold/10 rounded-3xl blur-2xl group-hover:bg-gold/20 transition-all duration-300" />
              <div className="relative w-72 h-96 md:w-80 md:h-[420px] rounded-3xl overflow-hidden border border-neutral-200 p-2 bg-white">
                <img 
                  src={ownerPhoto} 
                  alt="Aarav Sharma - Founder of VAULT" 
                  className="w-full h-full object-cover rounded-2xl filter grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
          </div>

          {/* Owner Message */}
          <div className="lg:col-span-7">
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block mb-2">
              FOUNDER'S PERSPECTIVE
            </span>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-display mb-6">
              A NOTE FROM AARAV SHARMA
            </h2>
            <div className="space-y-4 text-xs md:text-sm text-neutral-600 leading-relaxed italic">
              <p>
                "At VAULT, we don't believe in fast fashion. We believe in items that carry a presence, that command attention without shouting. When I started VAULT, my goal was to disrupt the accessories space by pairing exceptional, artisan-level craft with modern luxury logistics."
              </p>
              <p>
                "Each timepiece, leather piece, and fragrance is curated with extreme attention to detail. We ensure that our materials are sourced responsibly and built to last. Thank you for being a part of our journey and welcoming VAULT into your daily lifestyle."
              </p>
            </div>
            <div className="mt-8 border-t border-neutral-100 pt-6">
              <p className="font-extrabold text-sm uppercase tracking-wide text-neutral-950">Aarav Sharma</p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono mt-0.5">Founder & CEO, VAULT</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
