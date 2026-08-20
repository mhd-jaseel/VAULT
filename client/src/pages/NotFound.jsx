import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { setDocumentSEO } from '../utils/seoHelper';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    setDocumentSEO({
      title: 'Page Not Found | Vault.Co',
      description: 'The page you are looking for does not exist on Vault.Co.',
      noIndex: true,
      canonicalPath: '/404',
    });
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-8 shadow-xs space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center mx-auto border border-neutral-200">
          <Compass size={28} />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-[#d97706] uppercase font-bold">
            ERROR 404
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-neutral-900">
            Page Not Found
          </h1>
          <p className="text-xs text-neutral-500 font-sans leading-relaxed">
            The page you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/"
            className="flex-1 btn-gold text-xs !py-3 uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1.5"
          >
            <Home size={13} /> Go Home
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="flex-1 btn-dark text-xs !py-3 uppercase font-mono font-bold tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={13} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
