import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { setDocumentSEO } from '../utils/seoHelper';
import { ShieldCheck, Lock, Eye, Database, Server, RefreshCw, ArrowLeft, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  useEffect(() => {
    setDocumentSEO({
      title: 'Privacy Policy | Vault.Co',
      description: 'Understand how Vault.Co collects, processes, and protects your personal data in accordance with India\'s Digital Personal Data Protection standards.',
      canonicalPath: '/privacy',
      breadcrumbList: [
        { name: 'Home', url: '/' },
        { name: 'Privacy Policy', url: '/privacy' },
      ],
    });
  }, []);

  return (
    <div className="bg-white min-h-screen py-10 md:py-16 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto w-full text-neutral-800 antialiased">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={13} /> Back to Store
        </Link>
      </div>

      {/* Header Banner */}
      <div className="border-b border-neutral-200 pb-8 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-600 mb-3">
          <Lock size={12} /> DATA PROTECTION &amp; PRIVACY
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-sans uppercase tracking-tight text-neutral-900 mb-3">
          PRIVACY POLICY
        </h1>
        <p className="text-xs font-mono text-neutral-500">
          Last Updated: [INSERT EFFECTIVE DATE] · Effective Date: [INSERT EFFECTIVE DATE]
        </p>
      </div>

      {/* Main Content Body */}
      <div className="space-y-8 text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            1. Introduction &amp; Commitment to Privacy
          </h2>
          <p>
            At <strong>Vault.Co</strong> (operated under <strong>[LEGAL BUSINESS NAME]</strong>), we take the security and privacy of your personal data seriously. This Privacy Policy describes how we collect, handle, store, and protect your information when you visit <strong>[PRODUCTION WEBSITE URL]</strong>, create a customer account, browse our collections, or purchase products.
          </p>
          <p>
            This policy aligns with applicable data protection principles, including India's <em>Digital Personal Data Protection Act, 2023</em> (DPDPA) and notified Data Protection Rules.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            2. Personal Data We Collect
          </h2>
          <p>
            We adhere to data minimization principles and collect only information necessary to provide our luxury e-commerce services:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <h3 className="font-bold text-neutral-900 font-mono text-xs uppercase mb-1.5">A. Account &amp; Identity Data</h3>
              <p className="text-neutral-600 text-xs">
                Name, email address, contact phone number, and encrypted password credentials (or Google profile name, email, and Google ID token if signing in with Google OAuth).
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <h3 className="font-bold text-neutral-900 font-mono text-xs uppercase mb-1.5">B. Delivery &amp; Order Data</h3>
              <p className="text-neutral-600 text-xs">
                Shipping street address, city, state, postal PIN code, country, recipient contact numbers, ordered item lines, quantities, and order status timelines.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <h3 className="font-bold text-neutral-900 font-mono text-xs uppercase mb-1.5">C. Financial &amp; Wallet Ledger Data</h3>
              <p className="text-neutral-600 text-xs">
                Payment gateway transaction references (Razorpay order ID, payment ID), Vault Wallet store credit balance, credit/debit transaction ledger logs, and refund references.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <h3 className="font-bold text-neutral-900 font-mono text-xs uppercase mb-1.5">D. User Interactions &amp; Reviews</h3>
              <p className="text-neutral-600 text-xs">
                Wishlist selections, shopping cart items, submitted ratings, reviews, verified buyer status, and return/replacement requests with evidence images.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            3. How We Use Your Information
          </h2>
          <p>We process your personal data strictly for legitimate operational purposes:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li><strong>Fulfillment &amp; Delivery:</strong> To process orders, verify stock, calculate shipping, route packages, and provide tracking updates.</li>
            <li><strong>Payment &amp; Wallet Management:</strong> To securely confirm payments, manage your Vault Store Credit balance, and issue instant credits for cancellations/returns.</li>
            <li><strong>Account Authentication &amp; Security:</strong> To authenticate account sessions via secure JWT cookies, prevent credential abuse, and enforce role-based access.</li>
            <li><strong>Customer Service &amp; Dispute Resolution:</strong> To respond to inquiries, process returns, and investigate transaction discrepancies.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            4. Payment Information Privacy &amp; Third-Party Processing
          </h2>
          <p>
            All electronic payment processing is handled through our integrated payment partner, <strong>Razorpay</strong>.
          </p>
          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-neutral-800 text-xs">
            <strong>Payment Security Note:</strong> Vault.Co does NOT collect, handle, or store raw credit/debit card numbers, CVVs, expiry dates, net banking passwords, or UPI PINs on its servers. When you pay, you enter credentials directly into Razorpay's encrypted checkout interface. Vault.Co receives only cryptographic transaction identifiers, payment status confirmations, and captured amounts.
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            5. Cookies, Sessions &amp; Local Storage
          </h2>
          <p>We utilize essential storage technologies to ensure seamless navigation:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li><strong>HTTP-Only Authentication Cookies:</strong> Secure cookies used to store encrypted session tokens (`token`), shielding authentication states from cross-site scripting (XSS).</li>
            <li><strong>Local Storage:</strong> Used strictly for shopping cart persistence, local UI theme preferences, and guest wishlist states.</li>
            <li><strong>No Invasive Advertising Trackers:</strong> Vault.Co does not use third-party cross-site tracking cookies to sell your data to third-party ad networks.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            6. Third-Party Service Providers
          </h2>
          <p>We share data only with verified technical partners necessary for service operation:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li><strong>Razorpay:</strong> Payment gateway facilitation and refund disbursement.</li>
            <li><strong>Google Identity Services (OAuth 2.0):</strong> Optional Single Sign-On authentication for customer convenience.</li>
            <li><strong>Courier &amp; Logistics Partners:</strong> Delivery partners receiving your name, delivery address, and phone number for parcel fulfillment.</li>
            <li><strong>Cloud Infrastructure &amp; Database:</strong> Secure MongoDB cloud instances for encrypted database storage.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            7. Data Security &amp; Retention
          </h2>
          <p>
            We implement comprehensive technical and organizational safeguards, including SSL/TLS encryption in transit, strict HTTP security headers (`nosniff`, `X-Frame-Options: DENY`), database query sanitization, atomic inventory locking, and rate limiting against brute-force attacks.
          </p>
          <p>
            Personal data is retained as long as your account remains active or as required by applicable tax, accounting, and consumer protection laws (e.g. retaining financial invoice records for legal audits).
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            8. Your Data Rights &amp; Grievance Redressal
          </h2>
          <p>Under applicable data privacy regulations, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li>Access and review personal information held about you in your Vault Profile.</li>
            <li>Request correction or updating of outdated address and contact details.</li>
            <li>Request closure and deletion of your Vault Account, subject to statutory retention obligations.</li>
            <li>Withdraw consent for optional communications.</li>
          </ul>
          <p className="pt-2">
            To exercise your rights or file a privacy grievance, please reach out to our appointed Grievance Officer:
          </p>
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 font-mono text-xs space-y-1 mt-2">
            <p><strong>Grievance Officer:</strong> [GRIEVANCE OFFICER NAME / PRIVACY DESK]</p>
            <p><strong>Entity Name:</strong> [LEGAL BUSINESS NAME] (Operating as Vault.Co)</p>
            <p><strong>Official Email:</strong> [GRIEVANCE EMAIL] / privacy@vault.com</p>
            <p><strong>Address:</strong> [BUSINESS ADDRESS], Mumbai, Maharashtra, India</p>
          </div>
        </section>

      </div>
    </div>
  );
}
