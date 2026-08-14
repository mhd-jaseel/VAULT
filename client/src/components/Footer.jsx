import React from 'react';
import { Link } from 'react-router-dom';
import VaultLogo from './VaultLogo';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border-light py-12 px-6 md:px-12 text-text-secondary text-sm mt-auto pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <VaultLogo to="/" size="footer" theme="dark" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Premium men's accessories curated for the modern gentleman. Experience unmatched luxury and styling.
          </p>
        </div>

        {/* Customer Support */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-mono font-semibold text-text-primary uppercase tracking-wider text-xs mb-1">Customer Care</h4>
          <Link to="/profile" className="hover:text-text-primary transition-colors text-xs font-mono">MY ACCOUNT</Link>
          <Link to="/profile?tab=orders" className="hover:text-text-primary transition-colors text-xs font-mono">TRACK ORDER</Link>
          <Link to="/wishlist" className="hover:text-text-primary transition-colors text-xs font-mono">WISHLIST</Link>
          <Link to="/about" className="hover:text-text-primary transition-colors text-xs font-mono">ABOUT US</Link>
        </div>

        {/* Support Contact */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-mono font-semibold text-text-primary uppercase tracking-wider text-xs mb-1">Customer Support</h4>
          <p className="text-xs text-text-secondary">
            Email:{' '}
            <a href="mailto:vault.co.6235@gmail.com" className="hover:text-text-primary transition-colors">
              vault.co.6235@gmail.com
            </a>
          </p>
          <p className="text-xs text-text-secondary">
            Phone:{' '}
            <a href="tel:+916235623868" className="hover:text-text-primary transition-colors">
              +91 62356 23868
            </a>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-border-light mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
        <p>© {new Date().getFullYear()} VAULT.CO Inc. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-text-primary transition-colors cursor-pointer font-mono text-[10px]">
            PRIVACY POLICY
          </Link>
          <Link to="/terms" className="hover:text-text-primary transition-colors cursor-pointer font-mono text-[10px]">
            TERMS OF SERVICE
          </Link>
        </div>
      </div>
    </footer>
  );
}
