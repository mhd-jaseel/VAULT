import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { setDocumentSEO } from '../utils/seoHelper';
import { 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  RotateCcw, 
  Truck, 
  Scale, 
  AlertCircle, 
  HelpCircle,
  Clock,
  Lock,
  Tag,
  MessageSquare,
  Ban
} from 'lucide-react';

export default function TermsOfService() {
  useEffect(() => {
    setDocumentSEO({
      title: 'Terms of Service | Vault.Co',
      description: 'Review the official Terms of Service for Vault.Co governing website use, orders, Razorpay payments, 3-day returns, and store credit policies.',
      canonicalPath: '/terms',
      breadcrumbList: [
        { name: 'Home', url: '/' },
        { name: 'Terms of Service', url: '/terms' },
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
            <FileText size={12} /> LEGAL FRAMEWORK
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-neutral-900 mb-3">
            Terms of Service
          </h1>
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-mono text-neutral-500 pt-1 border-t border-neutral-100 mt-4">
            <span><strong>Effective Date:</strong> August 2026</span>
            <span>•</span>
            <span><strong>Last Updated:</strong> August 2026</span>
            <span>•</span>
            <span><strong>Applicable Law:</strong> Republic of India</span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-10 text-xs sm:text-sm text-neutral-700 leading-relaxed">

          {/* 1. Introduction & Acceptance */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                1
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Introduction &amp; Acceptance of Terms
              </h2>
            </div>
            <p>
              Welcome to <strong>Vault.Co</strong> (referred to herein as "Vault.Co", "we", "us", or "our"), operating the e-commerce website located at <strong className="text-neutral-900">https://vaultco.online</strong> and its authorized subdomains (the "Website").
            </p>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "Customer", or "You") and Vault.Co. By accessing, browsing, registering an account, or purchasing products on our Website, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our companion <Link to="/privacy" className="text-neutral-900 underline font-medium hover:text-amber-600">Privacy Policy</Link>. If you do not agree with any part of these Terms, you must immediately discontinue your use of the Website.
            </p>
          </section>

          {/* 2. Eligibility & Account Security */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                2
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Eligibility &amp; Account Registration
              </h2>
            </div>
            <p>
              To create an account or complete transactions on Vault.Co, you represent and warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li>You are at least 18 years of age and competent to enter into a legally binding contract under the <em>Indian Contract Act, 1872</em>.</li>
              <li>All registration details submitted by you—including your full legal name, email address, phone number, and delivery addresses—are accurate, true, and complete.</li>
              <li>You are solely responsible for maintaining the confidentiality of your login credentials, session authentication, and account activity.</li>
              <li>Authentication may be conducted via verified credentials or Google OAuth 2.0 Single Sign-On. You agree to notify Vault.Co immediately upon discovering any unauthorized access to your account.</li>
            </ul>
          </section>

          {/* 3. Products & Artisanal Craft */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                3
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Products &amp; Catalog Specifications
              </h2>
            </div>
            <p>
              Vault.Co curates and retails premium lifestyle accessories, including precision wristwatches, handcrafted leather wallets, belts, jewelry, sunglasses, caps, and accessories.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li><strong>Artisanal &amp; Material Variations:</strong> Products crafted from natural full-grain leather, stainless steel, and specialty finishes may exhibit subtle natural grain textures and patina over time. These organic characteristics are hallmarks of authentic materials rather than manufacturing flaws.</li>
              <li><strong>Visual Representation:</strong> We make reasonable efforts to display accurate high-resolution photography and dimensions. However, screen color calibration on individual display devices may vary slightly from physical pieces.</li>
              <li><strong>Inventory Availability:</strong> Inventory levels are synchronized in real-time with our database. Placing an item in your shopping cart or wishlist does not reserve stock until order checkout is completed.</li>
            </ul>
          </section>

          {/* 4. Pricing & Transparent Checkout Charges */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                4
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Authoritative Pricing &amp; Applicable Charges
              </h2>
            </div>
            <p>
              All prices listed on Vault.Co are denominated in <strong>Indian Rupees (INR - ₹)</strong>.
            </p>
            <div className="bg-neutral-50 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 space-y-2">
              <h3 className="font-mono text-xs font-bold uppercase text-neutral-900">Transparent Cost Breakdown</h3>
              <p className="text-xs text-neutral-600">
                Prior to payment confirmation, our checkout screen clearly displays an authoritative breakdown of all costs:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-600">
                <li><strong>Items Subtotal:</strong> The baseline catalog prices of selected items.</li>
                <li><strong>Discounts / Coupons:</strong> Applied promotional reductions or coupon savings.</li>
                <li><strong>Shipping &amp; Delivery Fee:</strong> Standard delivery fees, or FREE shipping when eligible.</li>
                <li><strong>Handling Charges:</strong> Any applicable logistics handling fees configured by the store.</li>
                <li><strong>Grand Total:</strong> The final payable amount inclusive of applicable statutory taxes.</li>
              </ul>
            </div>
            <p className="text-neutral-600 text-xs">
              Prices and delivery rates are subject to change without prior notice. However, once an order is placed and confirmed, the price applicable at the moment of order completion remains fixed for that order.
            </p>
          </section>

          {/* 5. Payments & Split Checkout */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                5
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Payment Methods &amp; Electronic Processing
              </h2>
            </div>
            <p>
              Vault.Co provides secure electronic payment processing through industry-certified gateways:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-neutral-900 uppercase mb-1">
                  <CreditCard size={14} className="text-neutral-700" /> Razorpay Gateway
                </div>
                <p className="text-xs text-neutral-600">
                  Supports Unified Payments Interface (UPI), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and authorized digital wallets. All transactions are encrypted directly via Razorpay's secure checkout.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-neutral-900 uppercase mb-1">
                  <ShieldCheck size={14} className="text-neutral-700" /> Vault Wallet &amp; Split Pay
                </div>
                <p className="text-xs text-neutral-600">
                  Customers may apply their available Vault Wallet balance toward order totals. If wallet funds cover part of the amount, the remaining balance is paid seamlessly via Razorpay (<code className="font-mono text-[11px] bg-neutral-200 px-1 py-0.5 rounded">WALLET_RAZORPAY</code>).
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-500 italic">
              * Note: Cash on Delivery (COD) is not currently supported. Vault.Co never collects or stores raw credit card numbers, CVVs, or bank passwords on its servers.
            </p>
          </section>

          {/* 6. Order Cancellation & Instant Wallet Credit */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                6
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Order Placement, Modification &amp; Cancellation
              </h2>
            </div>
            <p>
              When you submit an order, our backend cryptographically verifies the transaction signature and captures order inventory.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li><strong>Pre-Dispatch Cancellation:</strong> You may cancel individual items from an order directly through your Customer Dashboard at any time before the item status transitions to <strong className="text-neutral-900">PACKED</strong>.</li>
              <li><strong>Instant Store Credit Refund:</strong> Upon successful cancellation prior to packing, the exact net amount paid for the cancelled item is instantly credited to your <strong>Vault Wallet</strong> for future purchases.</li>
              <li><strong>Post-Packing Lock:</strong> Once an order is packed or handed over to our logistics partner (<strong className="text-neutral-900">SHIPPED</strong>), pre-dispatch cancellation is closed. You may then utilize our 3-day return process upon delivery.</li>
            </ul>
          </section>

          {/* 7. Returns & Replacements Policy (Strict 3-Day Rule) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                7
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                3-Day Return &amp; Replacement Policy
              </h2>
            </div>
            <p>
              We maintain a transparent, server-enforced <strong>3-Day Return and Replacement Policy</strong> designed to protect consumer rights under the <em>Consumer Protection (E-Commerce) Rules, 2020</em>:
            </p>
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <h3 className="font-mono text-xs font-bold uppercase text-neutral-900 flex items-center gap-2">
                <Clock size={14} className="text-amber-600" /> Return Window: 72 Hours (3 Days) From Delivery
              </h3>
              <p className="text-xs text-neutral-700 leading-relaxed">
                Return or replacement requests must be lodged on the Website within strictly <strong>3 calendar days (72 hours)</strong> from the verified courier delivery timestamp (<code className="font-mono text-[11px] bg-neutral-100 px-1 py-0.5 rounded">deliveredAt</code>). Requests submitted after this 72-hour window are ineligible for return.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li><strong>Return for Wallet Refund:</strong> Customers can return eligible items. Once received and inspected at our returns facility, the purchase price is credited to the customer's Vault Wallet.</li>
              <li><strong>Item Replacement:</strong> Customers can request a replacement of equal or higher value. Any price difference is settled during replacement checkout.</li>
              <li><strong>Condition Requirement:</strong> Returned items must be unworn, in original condition, with brand tags, dust bags, and presentation boxes intact. Customers must upload clear photographic evidence when initiating requests for damaged or defective items.</li>
            </ul>
          </section>

          {/* 8. Shipping & Delivery Logistics */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                8
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Shipping, Logistics &amp; Delivery
              </h2>
            </div>
            <p>
              Deliveries are serviced across supported PIN codes throughout India via recognized third-party express couriers.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li><strong>Live Order Tracking:</strong> Real-time milestone updates (<code className="font-mono text-[11px] bg-neutral-100 px-1 rounded">Pending</code> → <code className="font-mono text-[11px] bg-neutral-100 px-1 rounded">Confirmed</code> → <code className="font-mono text-[11px] bg-neutral-100 px-1 rounded">Packed</code> → <code className="font-mono text-[11px] bg-neutral-100 px-1 rounded">Shipped</code> → <code className="font-mono text-[11px] bg-neutral-100 px-1 rounded">Delivered</code>) are available within your account under <Link to="/profile?tab=orders" className="text-neutral-900 underline font-medium">Track Orders</Link>.</li>
              <li><strong>Delivery Timelines:</strong> Standard delivery generally takes 3 to 7 business days depending on customer location. Estimated transit times are indicative and may be impacted by logistics constraints, weather, or regional restrictions.</li>
              <li><strong>Force Majeure:</strong> Vault.Co is not liable for delivery delays resulting from acts of God, strikes, natural disasters, governmental actions, or carrier logistics interruptions beyond reasonable control.</li>
            </ul>
          </section>

          {/* 9. Coupons & Discounts */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                9
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Coupons, Promotions &amp; Discounts
              </h2>
            </div>
            <p>
              Promotional codes and automatic discount campaigns offered by Vault.Co are governed by specific eligibility criteria:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li>Coupons must be entered before order completion and cannot be applied retroactively to completed purchases.</li>
              <li>Coupons have specified expiry dates, minimum order values, and usage limits (e.g. single use per user or first-order restriction).</li>
              <li>Coupons carry zero cash value, are non-transferable, and cannot be refunded as physical cash upon cancellation.</li>
            </ul>
          </section>

          {/* 10. Prohibited Activities */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                10
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Prohibited Conduct &amp; Account Suspension
              </h2>
            </div>
            <p>When using our Website, you agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li>Engage in automated data scraping, crawling, extraction, or reverse engineering of our codebase or catalog.</li>
              <li>Submit fraudulent payment transactions, abuse coupon mechanics, or exploit software vulnerabilities.</li>
              <li>Post defamatory, abusive, obscene, or fraudulent product reviews.</li>
              <li>Attempt to circumvent server-side authorization or compromise security controls.</li>
            </ul>
            <p className="text-neutral-600">
              Vault.Co reserves the right to suspend, terminate, or block accounts (<code className="font-mono text-[11px] bg-neutral-100 px-1 rounded">isBlocked: true</code>) that engage in prohibited conduct or fraudulent activity.
            </p>
          </section>

          {/* 11. Intellectual Property */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                11
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Intellectual Property Rights
              </h2>
            </div>
            <p>
              All content hosted on this Website—including but not limited to the brand name <strong>VAULT.CO</strong>, logos, vector icons, custom UI layouts, product photography, editorial copy, and source code—is the proprietary intellectual property of Vault.Co and protected under Indian and international copyright and trademark laws. Unauthorized reproduction, resale, or distribution is strictly prohibited.
            </p>
          </section>

          {/* 12. Limitation of Liability & Disclaimers */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                12
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Limitation of Liability
              </h2>
            </div>
            <p>
              To the maximum extent permitted by applicable Indian law, Vault.Co and its directors, officers, and employees shall not be liable for any indirect, incidental, punitive, special, or consequential damages resulting from website unavailability, delivery delays, or product misuse. Our aggregate liability arising out of any order is strictly limited to the actual net monetary amount paid by the customer for the specific product in dispute.
            </p>
          </section>

          {/* 13. Governing Law & Dispute Resolution */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                13
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Governing Law &amp; Jurisdiction
              </h2>
            </div>
            <p>
              These Terms shall be governed by, interpreted, and construed in accordance with the substantive laws of the Republic of India. Any disputes, claims, or controversies arising out of or related to these Terms or transactions on the Website shall be subject to the exclusive jurisdiction of the competent courts in <strong>[BUSINESS JURISDICTION / CITY — E.G., MUMBAI, MAHARASHTRA]</strong>.
            </p>
          </section>

          {/* 14. Grievance Redressal & Business Contact */}
          <section className="space-y-4 pt-6 border-t border-neutral-200">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                14
              </span>
              <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-tight text-neutral-900">
                Grievance Officer &amp; Customer Support
              </h2>
            </div>
            <p>
              In accordance with the <em>Information Technology Act, 2000</em> and the <em>Consumer Protection (E-Commerce) Rules, 2020</em>, the contact details of our Customer Support and appointed Grievance Officer are set forth below:
            </p>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 sm:p-6 font-mono text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Commercial Brand</span>
                  <p className="font-bold text-neutral-900">Vault.Co</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Legal Entity Name</span>
                  <p className="font-bold text-neutral-900">[LEGAL BUSINESS NAME — CONFIRM]</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Registered Office</span>
                  <p className="font-bold text-neutral-900">[REGISTERED BUSINESS ADDRESS — CONFIRM], Mumbai, Maharashtra, India</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Customer Care Email</span>
                  <p className="font-bold text-neutral-900">
                    <a href="mailto:vault.co.6235@gmail.com" className="underline hover:text-amber-600">vault.co.6235@gmail.com</a>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Customer Support Phone</span>
                  <p className="font-bold text-neutral-900">
                    <a href="tel:+916235623868" className="underline hover:text-amber-600">+91 62356 23868</a>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Grievance Officer</span>
                  <p className="font-bold text-neutral-900">[GRIEVANCE OFFICER NAME — CONFIRM]</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 italic">
              Grievances are acknowledged within 48 hours and addressed within statutory resolution timeframes.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
