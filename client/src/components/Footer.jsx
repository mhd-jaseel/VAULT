import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border-light py-12 px-6 md:px-12 text-text-secondary text-sm mt-auto pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <Link to="/" className="font-sans font-extrabold text-2xl tracking-widest text-[#111111]">
            VAULT<span className="text-neutral-900">.</span>
          </Link>
          <p className="text-xs text-text-secondary leading-relaxed">
            Premium men's accessories curated for the modern gentleman. Experience unmatched luxury and styling.
          </p>
        </div>

        {/* Shop */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-mono font-semibold text-text-primary uppercase tracking-wider text-xs mb-1">Collections</h4>
          <Link to="/shop?category=watches" className="hover:text-text-primary transition-colors text-xs font-mono">WATCHES</Link>
          <Link to="/shop?category=wallets" className="hover:text-text-primary transition-colors text-xs font-mono">WALLETS</Link>
          <Link to="/shop?category=sunglasses" className="hover:text-text-primary transition-colors text-xs font-mono">SUNGLASSES</Link>
          <Link to="/shop?category=perfumes" className="hover:text-text-primary transition-colors text-xs font-mono">PERFUMES</Link>
        </div>

        {/* Customer Support */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-mono font-semibold text-text-primary uppercase tracking-wider text-xs mb-1">Customer Care</h4>
          <Link to="/profile" className="hover:text-text-primary transition-colors text-xs font-mono">MY ACCOUNT</Link>
          <Link to="/profile?tab=orders" className="hover:text-text-primary transition-colors text-xs font-mono">TRACK ORDER</Link>
          <Link to="/wishlist" className="hover:text-text-primary transition-colors text-xs font-mono">WISHLIST</Link>
          <Link to="/about" className="hover:text-text-primary transition-colors text-xs font-mono">ABOUT US</Link>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-mono font-semibold text-text-primary uppercase tracking-wider text-xs mb-1">Vault Office</h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Mumbai, Maharashtra, India.
          </p>
          <p className="text-xs text-text-secondary">
            Email: support@vault.com
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-border-light mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
        <p>© {new Date().getFullYear()} VAULT Inc. All rights reserved.</p>
        <div className="flex gap-4">
          <span className="hover:text-text-primary cursor-pointer font-mono text-[10px]">PRIVACY POLICY</span>
          <span className="hover:text-gray-400 cursor-pointer font-mono text-[10px]">TERMS OF SERVICE</span>
        </div>
      </div>
    </footer>
  );
}
