import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import { setDocumentSEO } from '../utils/seoHelper';

export default function Forbidden() {
  useEffect(() => {
    setDocumentSEO({
      title: 'Access Denied | Vault.Co',
      description: 'You do not have permission to view this page.',
      noIndex: true,
      canonicalPath: '/403',
    });
  }, []);
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-8 shadow-xs space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert size={28} />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-[#d97706] uppercase font-bold">
            ERROR 403
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-neutral-900">
            Access Denied
          </h1>
          <p className="text-xs text-neutral-500 font-sans leading-relaxed">
            You don't have permission to access this page or administrative section.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="w-full btn-dark text-xs !py-3 uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1.5"
          >
            <Home size={13} /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
