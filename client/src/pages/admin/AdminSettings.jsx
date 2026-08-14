import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Settings, Save, Upload, Megaphone } from 'lucide-react';
import { resolveImage } from '../../utils/imageHelper';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [storeName, setStoreName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [shippingCharges, setShippingCharges] = useState('');
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState('');

  // Hero Section Customization
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroProductName, setHeroProductName] = useState('');
  const [heroProductPrice, setHeroProductPrice] = useState('');

  // Logo file upload
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // QR Code file upload
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');

  // Hero Image file upload
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/settings');
      if (res.data.success) {
        const d = res.data.data;
        setStoreName(d.storeName || '');
        setPhoneNumber(d.phoneNumber || '');
        setWhatsappNumber(d.whatsappNumber || '');
        setUpiId(d.upiId || '');
        setShippingCharges(d.shippingCharges || 0);
        setFreeShippingMinAmount(d.freeShippingMinAmount || 0);
        setLogoPreview(d.logo ? resolveImage(d.logo) : '');
        setQrPreview(d.upiQrCode ? resolveImage(d.upiQrCode) : '');

        setHeroTitle(d.heroTitle || '');
        setHeroSubtitle(d.heroSubtitle || '');
        setHeroDescription(d.heroDescription || '');
        setHeroProductName(d.heroProductName || '');
        setHeroProductPrice(d.heroProductPrice || 0);
        setHeroPreview(d.heroImage ? resolveImage(d.heroImage) : '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleQrChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleHeroChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeroFile(file);
      setHeroPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('storeName', storeName);
      formData.append('phoneNumber', phoneNumber);
      formData.append('whatsappNumber', whatsappNumber);
      formData.append('upiId', upiId);
      formData.append('shippingCharges', shippingCharges);
      formData.append('freeShippingMinAmount', freeShippingMinAmount);
      formData.append('heroTitle', heroTitle);
      formData.append('heroSubtitle', heroSubtitle);
      formData.append('heroDescription', heroDescription);
      formData.append('heroProductName', heroProductName);
      formData.append('heroProductPrice', heroProductPrice);

      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (qrFile) {
        formData.append('upiQrCode', qrFile);
      }
      if (heroFile) {
        formData.append('heroImage', heroFile);
      }

      const res = await axios.put('/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Settings updated successfully.');
        fetchSettings();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update business configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-12 max-w-4xl mx-auto w-full min-h-screen">
      {/* Title & Shortcut */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary">
            Store Configuration
          </h1>
          <p className="text-xs text-text-secondary mt-1">Configure banner options, shipping fees, contact cards, and UPI QR codes.</p>
        </div>

        <Link
          to="/admin/announcement"
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl font-mono text-xs font-bold hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <Megaphone size={14} /> MANAGE ANNOUNCEMENT BANNER
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Core fields */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-1">
              General Settings
            </h3>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Store Name</label>
              <input
                type="text"
                className="form-input text-xs"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Contact Phone</label>
              <input
                type="text"
                className="form-input text-xs"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">WhatsApp Dispatch Phone</label>
              <input
                type="text"
                placeholder="e.g. 919999999999"
                className="form-input text-xs"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                required
              />
              <span className="text-[9px] font-mono text-text-secondary block mt-1">Include country code without + or symbols.</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Standard Shipping Fee (₹)</label>
                <input
                  type="number"
                  className="form-input text-xs font-mono"
                  value={shippingCharges}
                  onChange={(e) => setShippingCharges(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Free Shipping Min (₹)</label>
                <input
                  type="number"
                  className="form-input text-xs font-mono"
                  value={freeShippingMinAmount}
                  onChange={(e) => setFreeShippingMinAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-[#fffbeb] border border-[#fde68a] rounded-xl text-[10px] text-[#92400e] flex items-center justify-between font-mono">
              <span>Looking for Special Free Shipping Campaigns & Handling Fees?</span>
              <Link to="/admin/shipping" className="font-bold underline text-[#d97706] hover:text-[#b45309]">
                Open Shipping Settings →
              </Link>
            </div>
          </div>

          {/* Payment Provider Info */}
          <div className="glass-card flex flex-col gap-3">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-1">
              Payment Provider
            </h3>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 border border-border-light">
              <div className="flex flex-col gap-1">
                <p className="font-bold font-sans text-xs text-text-primary tracking-wide uppercase">Razorpay — Online Payments</p>
                <p className="text-[9px] font-mono text-text-secondary leading-relaxed">
                  Razorpay credentials are configured via server environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET).
                  No manual admin configuration is required here.
                </p>
                <p className="text-[9px] font-mono text-text-secondary">
                  Payment verification is automatic — Razorpay signature is verified server-side on every transaction.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Home Page Banner Editor */}
        <div className="glass-card flex flex-col gap-5">
          <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-1">
            Dynamic Home Hero Banner Editor
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Banner Title</label>
                <input
                  type="text"
                  placeholder="e.g. UNCOMPROMISING LUXURY"
                  className="form-input text-xs"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Banner Subtitle / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. NEW ARRIVALS EVERY WEEK"
                  className="form-input text-xs"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Banner Description</label>
                <textarea
                  placeholder="Short description text..."
                  className="form-input text-xs min-h-[90px] resize-none"
                  value={heroDescription}
                  onChange={(e) => setHeroDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Featured Card Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vault Precision Chrono"
                    className="form-input text-xs"
                    value={heroProductName}
                    onChange={(e) => setHeroProductName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Featured Price (₹)</label>
                  <input
                    type="number"
                    className="form-input text-xs font-mono"
                    value={heroProductPrice}
                    onChange={(e) => setHeroProductPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1.5">Hero Banner Product Image</label>
                {heroPreview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border-light bg-neutral-50 flex items-center justify-center p-2">
                    <img src={heroPreview} alt="Hero Banner" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setHeroFile(null);
                        setHeroPreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-50 border border-red-200 text-red-600 text-[9px] font-mono font-bold py-1 px-2.5 rounded-full cursor-pointer shadow-sm"
                    >
                      CHANGE
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video rounded-xl border border-dashed border-border-light bg-neutral-50 hover:border-text-primary cursor-pointer p-4 transition-colors">
                    <Upload className="text-text-secondary mb-1" size={18} />
                    <span className="text-[9px] font-bold text-text-primary uppercase tracking-wide">Choose Banner Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleHeroChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-gold text-[10px] py-4 w-full"
        >
          {saving ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto" />
          ) : (
            <>SAVE STORE CONFIGURATION <Save size={14} /></>
          )}
        </button>
      </form>
    </div>
  );
}
