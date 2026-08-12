import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, ShoppingBag, X } from 'lucide-react';

/**
 * LoginRequiredModal
 *
 * Props:
 *   isOpen    {boolean}  — whether the modal is visible
 *   onClose   {fn}       — called when user dismisses
 *   message   {string}   — the descriptive body text
 */
export default function LoginRequiredModal({ isOpen, onClose, message }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    // Encode current path as redirect so user returns after login
    const redirect = encodeURIComponent(location.pathname.replace(/^\//, ''));
    navigate(`/login?redirect=${redirect}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-neutral-200/80 overflow-hidden pointer-events-auto">
          {/* Top accent strip */}
          <div className="h-1 w-full bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900" />

          <div className="p-7 flex flex-col gap-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                {/* Icon + title */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #333 100%)' }}
                  >
                    <LogIn size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="font-display font-black text-sm tracking-widest text-neutral-900 uppercase">
                      VAULT<span style={{ color: '#c9a84c' }}>.</span>
                    </p>
                    <h2 className="font-sans font-bold text-[11px] uppercase tracking-wider text-neutral-700 -mt-0.5">
                      Login Required
                    </h2>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer flex-shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>
            </div>

            {/* Message */}
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              {message || 'Please login to continue.'}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-mono font-bold uppercase tracking-widest text-[10px] text-white transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #111 0%, #333 100%)' }}
              >
                <LogIn size={13} />
                Login to Continue
              </button>

              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-mono font-bold uppercase tracking-widest text-[10px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition-all cursor-pointer"
              >
                <ShoppingBag size={12} />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
