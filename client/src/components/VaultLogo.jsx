import React from 'react';
import { Link } from 'react-router-dom';

/**
 * VaultLogo - Official Centralized Brand Wordmark
 * 
 * Standardized across Customer UI, Admin UI, Mobile UI, and Preview mode:
 * Text: "VAULT.CO"
 */
export default function VaultLogo({
  size = 'default',
  theme = 'dark',
  className = '',
  to = null,
  withDotAccent = false,
  badge = null,
}) {
  const sizeClasses = {
    small: 'text-xs tracking-[0.2em]',
    mobile: 'text-base sm:text-lg tracking-[0.22em]',
    default: 'text-xl tracking-[0.22em]',
    admin: 'text-xl tracking-[0.2em]',
    large: 'text-2xl md:text-3xl tracking-[0.25em]',
    hero: 'text-3xl sm:text-4xl md:text-5xl tracking-[0.25em]',
    footer: 'text-2xl tracking-[0.22em]',
  };

  const themeClasses = {
    dark: 'text-[#111111]',
    light: 'text-white',
    neutral: 'text-neutral-900',
  };

  const content = (
    <span
      className={`inline-flex items-center gap-2 font-display font-black uppercase select-none leading-none ${sizeClasses[size] || sizeClasses.default} ${themeClasses[theme] || themeClasses.dark} ${className}`}
      aria-label="VAULT.CO"
    >
      <span className="whitespace-nowrap">
        VAULT<span className={withDotAccent ? 'text-[#d97706]' : 'text-inherit'}>.</span>CO
      </span>
      {badge && <span className="inline-flex shrink-0">{badge}</span>}
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-hidden" aria-label="VAULT.CO Home">
        {content}
      </Link>
    );
  }

  return content;
}

