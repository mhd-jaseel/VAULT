import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldX, Phone, Mail, ArrowLeft } from 'lucide-react';

export default function Blocked() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    // Fetch store settings for real support contact info
    axios.get('/settings').then(res => {
      if (res.data.success) setSettings(res.data.data);
    }).catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #f7f7f5 0%, #ececea 100%)' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-200/80 flex flex-col items-center gap-0 overflow-hidden"
      >
        {/* Top accent strip */}
        <div className="w-full h-1.5 bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900" />

        <div className="flex flex-col items-center gap-6 px-8 py-10 w-full">
          {/* Brand wordmark */}
          <div className="text-center mb-1">
            <span className="font-display font-black text-xl tracking-[0.25em] text-neutral-900 uppercase">
              VAULT<span style={{ color: '#c9a84c' }}>.</span>
            </span>
          </div>

          {/* Blocked icon */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1.5px solid #fecaca' }}
            >
              <ShieldX size={36} strokeWidth={1.5} className="text-red-500" />
            </div>
            {/* Subtle outer ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ margin: '-6px', border: '1px solid rgba(239,68,68,0.15)' }}
            />
          </div>

          {/* Heading */}
          <div className="text-center flex flex-col gap-2">
            <h1
              className="font-display font-extrabold uppercase tracking-widest text-neutral-900"
              style={{ fontSize: '1.125rem', letterSpacing: '0.2em' }}
            >
              Account Blocked
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto font-sans" style={{ fontSize: '0.72rem' }}>
              Your account has been blocked by the administrator. You cannot access this website while your account is blocked.
            </p>
            <p className="text-[0.65rem] text-neutral-400 leading-relaxed font-mono">
              If you believe this was a mistake, please reach out to our support team.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-neutral-100" />

          {/* Contact Support */}
          <div className="w-full flex flex-col gap-3">
            <p
              className="text-center font-mono font-bold uppercase tracking-widest text-neutral-400"
              style={{ fontSize: '0.6rem', letterSpacing: '0.18em' }}
            >
              Contact Support
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Phone */}
              {settings?.phoneNumber ? (
                <a
                  href={`tel:${settings.phoneNumber}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-100 transition-all group"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#f7f3e8', border: '1px solid rgba(201,168,76,0.3)' }}
                  >
                    <Phone size={13} style={{ color: '#c9a84c' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.6rem] font-mono text-neutral-400 uppercase tracking-wider">Phone</p>
                    <p className="text-xs font-mono font-bold text-neutral-800 group-hover:text-neutral-900 transition-colors">
                      {settings.phoneNumber}
                    </p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#f7f3e8' }}>
                    <Phone size={13} style={{ color: '#c9a84c' }} />
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-mono text-neutral-400 uppercase tracking-wider">Phone</p>
                    <p className="text-xs font-mono font-bold text-neutral-500">Contact store admin</p>
                  </div>
                </div>
              )}

              {/* Email — use storeName as domain fallback if no email field */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#f7f3e8', border: '1px solid rgba(201,168,76,0.3)' }}
                >
                  <Mail size={13} style={{ color: '#c9a84c' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.6rem] font-mono text-neutral-400 uppercase tracking-wider">Email</p>
                  <p className="text-xs font-mono font-bold text-neutral-500">
                    {settings?.storeName
                      ? `support@${settings.storeName.toLowerCase().replace(/\s+/g, '')}.com`
                      : 'support@vault.com'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-neutral-100" />

          {/* Back to Login */}
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-mono font-bold uppercase tracking-widest transition-all text-xs"
            style={{
              background: 'linear-gradient(135deg, #111 0%, #333 100%)',
              color: '#fff',
              fontSize: '0.65rem',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #000 0%, #222 100%)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #111 0%, #333 100%)'}
          >
            <ArrowLeft size={12} /> Back to Login
          </Link>
        </div>
      </div>

      {/* Bottom attribution */}
      <p className="mt-8 text-[0.6rem] font-mono text-neutral-400 uppercase tracking-widest">
        {settings?.storeName || 'VAULT'} — Premium Men&apos;s Accessories
      </p>
    </div>
  );
}
