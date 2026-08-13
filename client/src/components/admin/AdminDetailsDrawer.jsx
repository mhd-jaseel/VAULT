import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function AdminDetailsDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  loading,
  error,
  onRetry,
  children,
}) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full md:w-[450px] lg:w-[500px] bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] bg-[#f9fafb]">
          <div>
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#111111]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] font-mono text-[#6b7280] mt-1 break-all">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e5e5] rounded-xl transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-[#6b7280] font-mono text-xs">
              <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-3" />
              Loading details...
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-center font-mono">
              <div className="w-12 h-12 rounded-full bg-[#fef2f2] flex items-center justify-center mb-3">
                <X className="text-[#dc2626]" size={24} />
              </div>
              <p className="text-xs text-[#dc2626] font-bold uppercase mb-4">Unable to load details.</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ──

export const DrawerSection = ({ title, children, className = '' }) => (
  <div className={`mb-6 ${className}`}>
    {title && (
      <h3 className="text-[10px] font-mono font-bold text-[#6b7280] uppercase tracking-widest mb-3 border-b border-[#e5e5e5] pb-1">
        {title}
      </h3>
    )}
    <div className="space-y-3">{children}</div>
  </div>
);

export const DrawerRow = ({ label, value, valueNode, action }) => (
  <div className="flex items-start justify-between gap-4 font-mono text-xs">
    <span className="text-[#6b7280] whitespace-nowrap">{label}</span>
    <div className="text-right flex-1 min-w-0">
      {valueNode || <span className="text-[#111111] font-bold block break-words">{value}</span>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  </div>
);

export const DrawerBadge = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]',
    danger: 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]',
    warning: 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]',
    info: 'bg-[#eff6ff] border-[#bfdbfe] text-[#2563eb]',
    neutral: 'bg-[#f3f4f6] border-[#e5e5e5] text-[#374151]',
    highlight: 'bg-[#faf5ff] border-[#e9d5ff] text-[#9333ea]',
  };
  
  return (
    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border inline-block ${styles[variant] || styles.neutral}`}>
      {children}
    </span>
  );
};
