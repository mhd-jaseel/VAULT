import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { setDocumentSEO } from '../utils/seoHelper';
import { ShieldCheck, FileText, Lock, Clock, HelpCircle, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  useEffect(() => {
    setDocumentSEO({
      title: 'Terms & Conditions | Vault.Co',
      description: 'Read the Vault.Co terms and conditions covering purchases, orders, payments, delivery, returns and use of the website.',
      canonicalPath: '/terms',
      breadcrumbList: [
        { name: 'Home', url: '/' },
        { name: 'Terms & Conditions', url: '/terms' },
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
          <FileText size={12} /> LEGAL &amp; POLICIES
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-sans uppercase tracking-tight text-neutral-900 mb-3">
          Terms &amp; Conditions
        </h1>
        <p className="text-xs font-mono text-neutral-500">
          Last Updated: August 2026 · Effective Date: August 2026
        </p>
      </div>

      {/* Main Content Body */}
      <div className="space-y-8 text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            1. Introduction &amp; Acceptance of Terms
          </h2>
          <p>
            Welcome to <strong>Vault.Co</strong> (referred to herein as "Vault.Co", "we", "us", or "our"). These Terms of Service ("Terms") govern your access to and use of our website located at <strong>https://vaultco.online</strong> (the "Website"), as well as any orders, purchases, and related services provided through the platform.
          </p>
          <p>
            By accessing our Website, creating an account, or placing an order, you agree to be bound by these Terms and our Privacy Policy. If you do not agree with any part of these Terms, you must discontinue your use of the Website immediately.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            2. Eligibility &amp; Account Registration
          </h2>
          <p>
            To register an account or purchase products through Vault.Co, you must be of legal age to form a binding contract under applicable laws. We provide account authentication through secure single sign-on (such as Google OAuth) or verified customer credentials.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li>You agree to provide accurate, current, and complete information during signup and checkout.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials and sessions.</li>
            <li>Vault.Co reserves the right to suspend or block accounts that violate these Terms, engage in fraudulent transactions, or abuse promotional benefits.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            3. Products, Pricing &amp; Inventory Availability
          </h2>
          <p>
            Vault.Co curates and sells premium men's accessories, including horological watches, full-grain leather wallets, belts, jewelry, sunglasses, and fragrances.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li><strong>Authoritative Pricing:</strong> All prices are displayed in Indian Rupees (INR). Prices, discounts, and delivery charges are calculated authoritatively on our server at checkout. Client-side price modifications are strictly invalid.</li>
            <li><strong>Stock Availability:</strong> Product inventory is maintained in real-time. If an item becomes out of stock prior to payment confirmation, you will be notified, and the item cannot be checked out until restocked.</li>
            <li><strong>Product Descriptions:</strong> We strive to display product colors, materials, and specifications as accurately as possible. Minor natural grain variations in leather or materials are inherent to premium artisanal craft.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            4. Order Placement &amp; Payment Processing
          </h2>
          <p>
            When you place an order on Vault.Co, your order constitutes an offer to purchase. Order acceptance occurs when payment is confirmed and an official order ID is generated.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li><strong>Payment Gateways:</strong> Electronic payments (UPI, Credit/Debit Cards, Net Banking) are securely processed via Razorpay. Vault.Co never stores raw card numbers, CVVs, or UPI PINs on its servers.</li>
            <li><strong>Vault Wallet Store Credit:</strong> Customers may utilize their available Vault Wallet balance to pay partially or fully for eligible orders.</li>
            <li><strong>Order Verification:</strong> All transactions undergo cryptographic HMAC-SHA256 signature and captured amount verification before order status transitions to confirmed.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            5. Shipping, Delivery &amp; Handling Fees
          </h2>
          <p>
            Shipping fees and free shipping thresholds (e.g., standard free delivery above ₹1,500 or active promotional campaigns) are calculated dynamically at checkout based on authoritative store configurations.
          </p>
          <p>
            Deliveries are fulfilled via recognized courier partners to the shipping address specified in your order. Tracking details and status milestones (Pending, Confirmed, Packed, Shipped, Delivered) are viewable in real-time within your Vault Account.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            6. Cancellations, Returns &amp; Store Credit Refunds
          </h2>
          <p>
            We maintain a transparent and customer-first cancellation and return policy:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li><strong>Order Item Cancellation:</strong> Customers may cancel individual items from an order directly from their account dashboard at any point before the order status reaches <strong>PACKED</strong>.</li>
            <li><strong>Automatic Wallet Credit:</strong> Upon successful cancellation of an item prior to packing, the exact amount paid for that item snapshot is instantly credited to your <strong>Vault Wallet</strong>.</li>
            <li><strong>Returns &amp; Replacements:</strong> For delivered items with defects or size discrepancies, return or replacement requests can be submitted through the customer portal within eligible return windows. Approved returns are settled via Vault Wallet store credit or item replacement.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            7. Coupons &amp; Promotional Campaigns
          </h2>
          <p>
            Coupons and discounts offered by Vault.Co are subject to specific terms, such as validity dates, minimum order values, first-order eligibility, and category exclusions. Coupons are non-transferable, cannot be redeemed for physical cash, and may not be combined unless explicitly permitted.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            8. User Content &amp; Product Reviews
          </h2>
          <p>
            Customers who have purchased products may submit ratings and reviews. By submitting a review, you warrant that the content is genuine and does not contain abusive, defamatory, or unlawful language. Vault.Co reserves the right to moderate or remove reviews that violate community standards.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            9. Prohibited Activities &amp; Intellectual Property
          </h2>
          <p>
            All logos, brand names, visual marks (including VAULT.CO wordmarks), product imagery, UI designs, and source code on this Website are the exclusive intellectual property of Vault.Co. You may not copy, reverse engineer, scrape, or exploit any portion of the Website without express written authorization.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            10. Limitation of Liability &amp; Governing Law
          </h2>
          <p>
            To the maximum extent permitted by applicable law, Vault.Co shall not be liable for indirect, incidental, punitive, or consequential damages arising out of your use of the Website or purchased products.
          </p>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in [INSERT JURISDICTION / CITY, E.G., MUMBAI, MAHARASHTRA].
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3 pt-4 border-t border-neutral-200">
          <h2 className="text-base sm:text-lg font-bold font-sans uppercase tracking-wide text-neutral-900">
            11. Contact Information
          </h2>
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 font-mono text-xs space-y-1">
            <p><strong>Brand:</strong> Vault.Co</p>
            <p><strong>Legal Entity:</strong> [LEGAL BUSINESS NAME]</p>
            <p><strong>Registered Address:</strong> [BUSINESS ADDRESS], Mumbai, Maharashtra, India</p>
            <p><strong>Support Email:</strong> [SUPPORT EMAIL] / support@vault.com</p>
            <p><strong>Grievance Officer:</strong> [GRIEVANCE EMAIL]</p>
          </div>
        </section>

      </div>
    </div>
  );
}
