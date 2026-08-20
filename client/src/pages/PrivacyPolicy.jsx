import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { setDocumentSEO } from '../utils/seoHelper';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Database, 
  Server, 
  RefreshCw, 
  ArrowLeft, 
  Mail, 
  UserCheck, 
  FileLock,
  Globe,
  Ban
} from 'lucide-react';

export default function PrivacyPolicy() {
  useEffect(() => {
    setDocumentSEO({
      title: 'Privacy Policy | VAULT.CO',
      description: 'Read the official VAULT.CO Privacy Policy outlining our data protection practices under India\'s DPDPA 2023, data minimization, and payment security.',
      canonicalPath: '/privacy',
      breadcrumbList: [
        { name: 'Home', url: '/' },
        { name: 'Privacy Policy', url: '/privacy' },
      ],
    });
  }, []);

  return (
    <div className="bg-[#fafafa] min-h-screen py-10 md:py-16 px-4 sm:px-6 md:px-12 w-full text-neutral-800 antialiased font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={13} /> Back to Store
          </Link>
        </div>

        {/* Header Hero Card */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-xs mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-700 mb-3 border border-neutral-200/60">
            <Lock size={12} /> DATA FIDUCIARY &amp; PRIVACY
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-neutral-900 mb-3">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-mono text-neutral-500 pt-1 border-t border-neutral-100 mt-4">
            <span><strong>Data Fiduciary:</strong> VAULT.CO</span>
            <span>•</span>
            <span><strong>Proprietor:</strong> Mohammed Jabir A (Sole Proprietorship)</span>
            <span>•</span>
            <span><strong>Last Updated:</strong> August 2026</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-10 text-xs sm:text-sm text-neutral-700 leading-relaxed">

          {/* 1. Introduction & Data Fiduciary */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                1
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Introduction &amp; Data Fiduciary Overview
              </h2>
            </div>
            <p>
              At <strong>VAULT.CO</strong>, owned and operated by <strong>Mohammed Jabir A</strong> as a <strong>Sole Proprietorship</strong> (referred to herein as "VAULT.CO", "we", "us", or "our"), we respect your privacy and are committed to protecting the personal data of our users ("Data Principals"). This Privacy Policy describes how we collect, process, store, and safeguard your personal information when you visit <strong className="text-neutral-900">https://vaultco.online</strong> (the "Website"), create an account, or order products.
            </p>
            <p>
              VAULT.CO acts as a <strong>Data Fiduciary</strong> in accordance with India's <em>Digital Personal Data Protection Act, 2023</em> (DPDPA), the <em>Digital Personal Data Protection Rules, 2025</em>, and the <em>Information Technology Act, 2000</em>.
            </p>
          </section>

          {/* 2. Personal Data We Collect */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                2
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Personal Data We Collect (Data Minimization)
              </h2>
            </div>
            <p>
              We practice strict data minimization and collect only the personal information essential to facilitate customer orders and secure store experiences:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                <h3 className="font-mono text-xs font-bold uppercase text-neutral-900">A. Account &amp; Identity Details</h3>
                <p className="text-xs text-neutral-600">
                  Full name, email address, contact phone number, and bcrypt-hashed password credentials. If using Google OAuth Single Sign-On, we receive your Google account name, verified email, and Google ID token.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                <h3 className="font-mono text-xs font-bold uppercase text-neutral-900">B. Shipping &amp; Address Book</h3>
                <p className="text-xs text-neutral-600">
                  Delivery recipient name, street address, flat/apartment, city, state, postal PIN code, country, and recipient contact phone numbers for parcel delivery.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                <h3 className="font-mono text-xs font-bold uppercase text-neutral-900">C. Orders &amp; Transaction Ledgers</h3>
                <p className="text-xs text-neutral-600">
                  Item lines purchased, quantities, pricing snapshots, order IDs, delivery tracking status milestones, coupon codes applied, and Vault Wallet credit/debit transaction history.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                <h3 className="font-mono text-xs font-bold uppercase text-neutral-900">D. User Reviews &amp; Return Evidence</h3>
                <p className="text-xs text-neutral-600">
                  Product ratings (1–5 stars), customer reviews, wishlist items, return/replacement reasons, and user-uploaded condition photographs stored securely on Cloudinary.
                </p>
              </div>
            </div>

            {/* Explicit Notice of What is NOT Collected */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                <Ban size={14} /> Explicit Confirmation: What We Do NOT Collect
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                VAULT.CO does <strong>NOT</strong> collect, request, or store your GPS location data, biometric data, phone contacts, microphone or camera access, or browsing activity across third-party websites.
              </p>
            </div>
          </section>

          {/* 3. Payment Data Security & Razorpay */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                3
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Payment Information &amp; Payment Gateway Security
              </h2>
            </div>
            <p>
              All online transactions are securely tokenized and processed via <strong>Razorpay</strong>:
            </p>
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <h3 className="font-mono text-xs font-bold uppercase text-neutral-900 flex items-center gap-2">
                <ShieldCheck size={14} className="text-amber-600" /> Zero Raw Financial Data Stored
              </h3>
              <p className="text-xs text-neutral-700 leading-relaxed">
                VAULT.CO servers <strong>never collect, process, or store raw credit/debit card numbers, CVVs, card expiry dates, bank passwords, or UPI PINs</strong>. All payment credential entry occurs directly inside Razorpay’s PCI-DSS compliant checkout frame. VAULT.CO receives only cryptographic transaction identifiers (<code className="font-mono text-[11px] bg-neutral-100 px-1 rounded">razorpay_order_id</code>, <code className="font-mono text-[11px] bg-neutral-100 px-1 rounded">razorpay_payment_id</code>) and captured status confirmations.
              </p>
            </div>
          </section>

          {/* 4. Purpose of Data Processing */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                4
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Purposes for Processing Personal Data
              </h2>
            </div>
            <p>We process your personal information strictly for legitimate e-commerce operations:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li><strong>Order Fulfillment &amp; Logistics:</strong> Processing orders, verifying stock, calculating shipping fees, and routing packages with courier partners.</li>
              <li><strong>Vault Wallet Store Credit:</strong> Maintaining ledger balance, calculating coupon discounts, and crediting refunds for cancellations and returns.</li>
              <li><strong>Account Authentication &amp; Security:</strong> Authenticating customer logins via secure JWT session cookies and Google OAuth.</li>
              <li><strong>Transactional Notifications:</strong> Sending order confirmations, OTP verification emails, and live delivery milestone tracking.</li>
              <li><strong>Return Verification:</strong> Evaluating customer-submitted photographic evidence and processing 3-day return or replacement requests.</li>
              <li><strong>Fraud Prevention:</strong> Detecting fraudulent transactions, duplicate payment attempts, and suspicious account activities.</li>
            </ul>
          </section>

          {/* 5. Cookies & Local Storage */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                5
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Cookies, Sessions &amp; Storage Technologies
              </h2>
            </div>
            <p>We utilize essential browser storage mechanisms solely to enable website functionality:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li><strong>HTTP-Only Authentication Cookies:</strong> Secure, encrypted cookies (<code className="font-mono text-[11px] bg-neutral-100 px-1 rounded">token</code>) used to authenticate user sessions while mitigating cross-site scripting (XSS) risks.</li>
              <li><strong>Local Storage:</strong> Used strictly for shopping cart persistence, guest wishlist caching, and client UI state preferences.</li>
              <li><strong>No Cross-Site Ad Tracking:</strong> We do not deploy third-party advertising tracking cookies or behavioral profile aggregators.</li>
            </ul>
          </section>

          {/* 6. Third-Party Service Integrations */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                6
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Third-Party Technical Processors
              </h2>
            </div>
            <p>We share necessary data solely with verified technical partners for operational processing:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="font-mono text-xs font-bold text-neutral-900 uppercase block">Razorpay</span>
                <p className="text-[11px] text-neutral-600 mt-0.5">Payment gateway facilitation, UPI/card processing, and refunds.</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="font-mono text-xs font-bold text-neutral-900 uppercase block">Google Identity Services</span>
                <p className="text-[11px] text-neutral-600 mt-0.5">Optional OAuth 2.0 Single Sign-On customer authentication.</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="font-mono text-xs font-bold text-neutral-900 uppercase block">Cloudinary</span>
                <p className="text-[11px] text-neutral-600 mt-0.5">Encrypted cloud media hosting for products, user avatars, and return proof images.</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="font-mono text-xs font-bold text-neutral-900 uppercase block">Courier Partners</span>
                <p className="text-[11px] text-neutral-600 mt-0.5">Shipping carrier receiving customer name, address, and phone number for parcel transit.</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="font-mono text-xs font-bold text-neutral-900 uppercase block">MongoDB Atlas</span>
                <p className="text-[11px] text-neutral-600 mt-0.5">Encrypted cloud database storage for user profiles, catalog data, and orders.</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="font-mono text-xs font-bold text-neutral-900 uppercase block">Render &amp; Vercel</span>
                <p className="text-[11px] text-neutral-600 mt-0.5">Authoritative backend API hosting (Render) and frontend CDN infrastructure (Vercel).</p>
              </div>
            </div>
          </section>

          {/* 7. Data Security & Retention */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                7
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Data Security Measures &amp; Retention
              </h2>
            </div>
            <p>
              We implement reasonable technical and organizational measures designed to protect your personal data, including TLS 1.3 encryption in transit, bcrypt password hashing with salt rounds, HMAC-SHA256 signature verification for payment payloads, parameterized database queries, and server-level rate limiting.
            </p>
            <p>
              Personal data is retained for the duration of your active account. Transactional order and invoice records are preserved for statutory retention periods mandated under Indian taxation and accounting regulations.
            </p>
          </section>

          {/* 8. Data Principal Rights (DPDPA 2023) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                8
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Your Rights as a Data Principal
              </h2>
            </div>
            <p>Under the <em>Digital Personal Data Protection Act, 2023</em>, you possess the following rights:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li><strong>Right to Access:</strong> View and review personal details stored in your Vault Profile and Order History.</li>
              <li><strong>Right to Correction &amp; Updating:</strong> Modify, update, or correct inaccurate delivery addresses or profile information.</li>
              <li><strong>Right to Erasure / Deletion:</strong> Request deletion of your account and personal data, subject to legal and financial audit retention requirements.</li>
              <li><strong>Right of Grievance Redressal:</strong> Submit inquiries or grievances to our appointed Grievance Contact.</li>
            </ul>
          </section>

          {/* 9. Children's Privacy */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                9
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Children's Privacy
              </h2>
            </div>
            <p>
              VAULT.CO does not knowingly solicit or collect personal data from individuals under the age of 18 without parental consent. If we discover that personal data of a minor has been collected without parental consent, we take prompt steps to remove such information.
            </p>
          </section>

          {/* 10. Grievance Officer & Contact */}
          <section className="space-y-4 pt-6 border-t border-neutral-200">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                10
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Grievance Redressal &amp; Privacy Desk
              </h2>
            </div>
            <p>
              To exercise your data principal rights or lodge a privacy-related grievance under the DPDPA 2023 and Information Technology rules, please contact:
            </p>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 sm:p-6 font-mono text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Data Fiduciary / Brand</span>
                  <p className="font-bold text-neutral-900">VAULT.CO</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Proprietor / Responsible Person</span>
                  <p className="font-bold text-neutral-900">Mohammed Jabir A</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Business Type</span>
                  <p className="font-bold text-neutral-900">Sole Proprietorship (Online E-Commerce)</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Jurisdiction / Location</span>
                  <p className="font-bold text-neutral-900">Malappuram, Kerala, India</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Privacy &amp; Official Email</span>
                  <p className="font-bold text-neutral-900">
                    <a href="mailto:vault.co.6235@gmail.com" className="underline hover:text-amber-600">vault.co.6235@gmail.com</a>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Support Phone Contact</span>
                  <p className="font-bold text-neutral-900">
                    <a href="tel:+916235623868" className="underline hover:text-amber-600">+91 62356 23868</a>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Grievance Contact</span>
                  <p className="font-bold text-neutral-900">Mohammed Jabir A</p>
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
