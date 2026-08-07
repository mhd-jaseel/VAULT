import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { Plus, Trash2, Edit2, Check, X, MoveUp, MoveDown, Save, Eye, EyeOff, Upload, Sparkles, AlertTriangle } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AdminHeroBanners() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [badgeText, setBadgeText] = useState('NEW ARRIVALS EVERY WEEK');
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [primaryButtonText, setPrimaryButtonText] = useState('SHOP NOW');
  const [primaryButtonLink, setPrimaryButtonLink] = useState('/shop');
  const [secondaryButtonText, setSecondaryButtonText] = useState('VIEW BEST SELLERS');
  const [secondaryButtonLink, setSecondaryButtonLink] = useState('/shop?featured=true');
  const [imageAlt, setImageAlt] = useState('Featured accessory');
  const [featuredLabel, setFeaturedLabel] = useState('FEATURED COLLECTIBLE');
  const [featuredTitle, setFeaturedTitle] = useState('Vault Precision Chrono');
  const [featuredPrice, setFeaturedPrice] = useState(14999);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Advanced customization states
  const [backgroundStyle, setBackgroundStyle] = useState('#F3F4F6');
  const [textAlignment, setTextAlignment] = useState('left');
  const [overlayOpacity, setOverlayOpacity] = useState(0.1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bannerType, setBannerType] = useState('luxury');

  // File Upload states and previews
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [mobileImageFile, setMobileImageFile] = useState(null);
  const [mobileImagePreview, setMobileImagePreview] = useState('');

  const [modelImageFile, setModelImageFile] = useState(null);
  const [modelImagePreview, setModelImagePreview] = useState('');

  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');

  // Active Preview Mode
  const [previewTab, setPreviewTab] = useState('desktop');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/admin/hero-banners?page=${page}&limit=5`);
      if (res.data.success) {
        setBanners(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching admin hero banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [page]);

  const resetForm = () => {
    setEditingId(null);
    setBadgeText('NEW ARRIVALS EVERY WEEK');
    setHeading('');
    setDescription('');
    setPrimaryButtonText('SHOP NOW');
    setPrimaryButtonLink('/shop');
    setSecondaryButtonText('VIEW BEST SELLERS');
    setSecondaryButtonLink('/shop?featured=true');
    setImageAlt('Featured accessory');
    setFeaturedLabel('FEATURED COLLECTIBLE');
    setFeaturedTitle('Vault Precision Chrono');
    setFeaturedPrice(14999);
    setOrder(banners.length);
    setIsActive(true);

    setBackgroundStyle('#F3F4F6');
    setTextAlignment('left');
    setOverlayOpacity(0.1);
    setStartDate('');
    setEndDate('');
    setBannerType('luxury');

    setImageFile(null);
    setImagePreview('');
    setMobileImageFile(null);
    setMobileImagePreview('');
    setModelImageFile(null);
    setModelImagePreview('');
    setProductImageFile(null);
    setProductImagePreview('');
  };

  const handleFileChange = (e, setter, previewSetter) => {
    const file = e.target.files[0];
    if (file) {
      setter(file);
      previewSetter(URL.createObjectURL(file));
    }
  };

  const handleEditClick = (banner) => {
    setEditingId(banner._id);
    setBadgeText(banner.badgeText || '');
    setHeading(banner.heading || '');
    setDescription(banner.description || '');
    setPrimaryButtonText(banner.primaryButtonText || 'SHOP NOW');
    setPrimaryButtonLink(banner.primaryButtonLink || '/shop');
    setSecondaryButtonText(banner.secondaryButtonText || 'VIEW BEST SELLERS');
    setSecondaryButtonLink(banner.secondaryButtonLink || '/shop?featured=true');
    setImageAlt(banner.imageAlt || 'Featured accessory');
    setFeaturedLabel(banner.featuredLabel || 'FEATURED COLLECTIBLE');
    setFeaturedTitle(banner.featuredTitle || '');
    setFeaturedPrice(banner.featuredPrice || 0);
    setOrder(banner.order || 0);
    setIsActive(banner.isActive);

    setBackgroundStyle(banner.backgroundStyle || '#F3F4F6');
    setTextAlignment(banner.textAlignment || 'left');
    setOverlayOpacity(banner.overlayOpacity || 0.1);
    setStartDate(banner.startDate ? banner.startDate.substring(0, 10) : '');
    setEndDate(banner.endDate ? banner.endDate.substring(0, 10) : '');
    setBannerType(banner.bannerType || 'luxury');

    setImageFile(null);
    setImagePreview(banner.imageUrl ? `http://localhost:5000${banner.imageUrl}` : '');

    setMobileImageFile(null);
    setMobileImagePreview(banner.mobileImageUrl ? `http://localhost:5000${banner.mobileImageUrl}` : '');

    setModelImageFile(null);
    setModelImagePreview(banner.modelImageUrl ? `http://localhost:5000${banner.modelImageUrl}` : '');

    setProductImageFile(null);
    setProductImagePreview(banner.productImageUrl ? `http://localhost:5000${banner.productImageUrl}` : '');
  };

  const handleToggleActive = async (banner) => {
    try {
      const res = await axios.patch(`/admin/hero-banners/${banner._id}`, {
        isActive: !banner.isActive
      });
      if (res.data.success) {
        toast.success('Banner status toggled successfully.');
        fetchBanners();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle banner status.');
    }
  };

  const handleDelete = async (id) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Hero Banner?',
      text: 'Are you sure you want to delete this hero banner slide?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;
    try {
      const res = await axios.delete(`/admin/hero-banners/${id}`);
      if (res.data.success) {
        toast.success('Banner deleted successfully.');
        fetchBanners();
        if (editingId === id) resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete banner.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!heading.trim() || !description.trim()) {
      toast.warning('Heading and Description are required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('badgeText', badgeText);
    formData.append('heading', heading);
    formData.append('description', description);
    formData.append('primaryButtonText', primaryButtonText);
    formData.append('primaryButtonLink', primaryButtonLink);
    formData.append('secondaryButtonText', secondaryButtonText);
    formData.append('secondaryButtonLink', secondaryButtonLink);
    formData.append('imageAlt', imageAlt);
    formData.append('featuredLabel', featuredLabel);
    formData.append('featuredTitle', featuredTitle);
    formData.append('featuredPrice', featuredPrice);
    formData.append('order', order);
    formData.append('isActive', isActive);

    formData.append('backgroundStyle', backgroundStyle);
    formData.append('textAlignment', textAlignment);
    formData.append('overlayOpacity', overlayOpacity);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('bannerType', bannerType);

    if (imageFile) {
      formData.append('imageUrl', imageFile);
    } else if (editingId) {
      const old = banners.find(b => b._id === editingId);
      if (old) formData.append('imageUrl', old.imageUrl);
    } else {
      toast.warning('Please upload a desktop banner image.');
      return;
    }

    if (mobileImageFile) {
      formData.append('mobileImageUrl', mobileImageFile);
    } else if (editingId) {
      const old = banners.find(b => b._id === editingId);
      if (old && old.mobileImageUrl) formData.append('mobileImageUrl', old.mobileImageUrl);
    }

    if (modelImageFile) {
      formData.append('modelImageUrl', modelImageFile);
    } else if (editingId) {
      const old = banners.find(b => b._id === editingId);
      if (old && old.modelImageUrl) formData.append('modelImageUrl', old.modelImageUrl);
    }

    if (productImageFile) {
      formData.append('productImageUrl', productImageFile);
    } else if (editingId) {
      const old = banners.find(b => b._id === editingId);
      if (old && old.productImageUrl) formData.append('productImageUrl', old.productImageUrl);
    }

    try {
      let res;
      if (editingId) {
        res = await axios.patch(`/admin/hero-banners/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post('/admin/hero-banners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        toast.success(editingId ? 'Banner slide updated successfully.' : 'New banner slide added successfully.');
        resetForm();
        fetchBanners();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save banner details.');
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen text-[#111111] admin-panel-theme">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
          Banner Management Module
        </h1>
        <p className="text-xs text-text-secondary mt-1">Redesign, schedule, style, and preview luxury homepage campaigns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Banners List & Active Previews */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Visual Preview Simulator Card */}
          <div className="glass-card overflow-hidden !p-0 border border-border-light rounded-2xl bg-white shadow-lg">
            <div className="flex justify-between items-center bg-[#111111] text-white p-4">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold flex items-center gap-1.5">
                <Sparkles size={11} className="text-yellow-400" /> Live Campaign Preview
              </span>
              <div className="flex gap-2 text-[9px] font-mono font-bold">
                <button 
                  onClick={() => setPreviewTab('desktop')}
                  className={`px-3 py-1 rounded-full border border-neutral-700 transition-colors ${previewTab === 'desktop' ? 'bg-white text-black' : 'bg-transparent text-neutral-400'}`}
                >
                  DESKTOP
                </button>
                <button 
                  onClick={() => setPreviewTab('mobile')}
                  className={`px-3 py-1 rounded-full border border-neutral-700 transition-colors ${previewTab === 'mobile' ? 'bg-white text-black' : 'bg-transparent text-neutral-400'}`}
                >
                  MOBILE
                </button>
              </div>
            </div>

            {/* Simulated Banner view */}
            <div 
              className="relative w-full aspect-video flex items-center overflow-hidden transition-all duration-300"
              style={{ 
                backgroundColor: backgroundStyle || '#F3F4F6', 
                backgroundImage: imagePreview && previewTab === 'desktop' ? `url(${imagePreview})` : (mobileImagePreview && previewTab === 'mobile' ? `url(${mobileImagePreview})` : 'none'),
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Overlay Opacity Simulator */}
              <div 
                className="absolute inset-0 bg-[#000000] pointer-events-none transition-opacity duration-300"
                style={{ opacity: Number(overlayOpacity) || 0.1 }}
              />

              <div 
                className={`relative w-full h-full p-8 md:p-12 flex flex-col justify-center gap-4 z-10 transition-all duration-300 ${
                  textAlignment === 'center' ? 'items-center text-center' : (textAlignment === 'right' ? 'items-end text-right' : 'items-start text-left')
                }`}
              >
                <span className="bg-white/90 text-black px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase font-mono border border-border-light shadow-sm">
                  {badgeText || 'Badge Subtitle'}
                </span>
                <h2 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight uppercase max-w-lg filter drop-shadow-md">
                  {heading || 'Luxury Campaign Heading'}
                </h2>
                <p className="text-[10px] md:text-xs text-white/90 max-w-md filter drop-shadow-md font-sans">
                  {description || 'Elegantly customized luxury accessories description details.'}
                </p>
                <div className="flex gap-2 mt-2">
                  <button className="bg-[#111111] text-white px-5 py-2 rounded-xl text-[9px] font-mono font-bold tracking-wider hover:bg-neutral-800 transition-colors">
                    {primaryButtonText}
                  </button>
                  <button className="bg-white/80 backdrop-blur-sm border border-neutral-300 text-black px-5 py-2 rounded-xl text-[9px] font-mono font-bold tracking-wider hover:bg-white transition-colors">
                    {secondaryButtonText}
                  </button>
                </div>

                {/* Floating model simulation if modelImagePreview is set */}
                {modelImagePreview && previewTab === 'desktop' && (
                  <img 
                    src={modelImagePreview} 
                    alt="Model" 
                    className="absolute bottom-0 right-[25%] max-h-[85%] object-contain pointer-events-none filter drop-shadow-lg" 
                  />
                )}

                {/* Floating Product Highlight Card simulation */}
                {featuredTitle && (
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-2xl border border-border-light shadow-lg flex items-center gap-3 max-w-[200px]">
                    {productImagePreview && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-50 flex-shrink-0 flex items-center justify-center p-0.5">
                        <img src={productImagePreview} alt="" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="min-w-0 text-left">
                      <p className="text-[7px] text-zinc-500 font-mono uppercase">{featuredLabel}</p>
                      <h4 className="font-bold text-[10px] text-black truncate">{featuredTitle}</h4>
                      <span className="font-mono text-[9px] font-bold">₹{Number(featuredPrice).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Carousel Slides List */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-1">
              Active Carousel Slides
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl shimmer-bg" />
                ))}
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-10 text-text-secondary text-xs font-mono">
                NO BANNER SLIDES INITIALIZED. CREATE ONE.
              </div>
            ) : (
              <div className="space-y-3">
                {banners.map((ban) => {
                  const bannerImg = ban.imageUrl.startsWith('/') 
                    ? `http://localhost:5000${ban.imageUrl}` 
                    : ban.imageUrl;
                  return (
                    <div 
                      key={ban._id}
                      className="flex items-center justify-between border border-border-light bg-neutral-50 p-3.5 rounded-2xl gap-4 hover:border-text-primary transition-all duration-300"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-border-light flex-shrink-0 flex items-center justify-center p-1">
                          <img src={bannerImg} alt={ban.imageAlt} className="w-full h-full object-cover rounded-lg" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[8px] tracking-wider uppercase bg-black text-white px-2 py-0.5 rounded-full font-bold">
                              {ban.bannerType || 'luxury'}
                            </span>
                            <span className="text-[10px] font-bold text-text-primary font-mono">
                              Priority: {ban.order}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-text-primary truncate uppercase tracking-wider mt-1">{ban.heading}</h4>
                          <p className="text-[9px] text-text-secondary truncate max-w-sm mt-0.5">{ban.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(ban)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            ban.isActive 
                              ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100' 
                              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                          }`}
                          title={ban.isActive ? 'Disable Slide' : 'Enable Slide'}
                        >
                          {ban.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          onClick={() => handleEditClick(ban)}
                          className="p-2 bg-white border border-border-light text-text-primary rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Edit Slide"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(ban._id)}
                          className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                          title="Delete Slide"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <Pagination 
              page={page}
              pages={pages}
              onPageChange={(p) => setSearchParams({ page: p })}
              loading={loading}
            />
          </div>
        </div>

        {/* Right Side: Form Editor Panel */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="glass-card flex flex-col gap-4 bg-white border border-border-light shadow-md">
            <div className="flex justify-between items-center border-b border-border-light pb-3">
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary">
                {editingId ? 'Edit Campaign Banner' : 'Create Campaign Banner'}
              </h3>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="text-red-500 hover:text-red-700 text-[10px] font-mono font-bold uppercase tracking-wider"
                >
                  Reset
                </button>
              )}
            </div>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Banner Type Style</label>
              <select
                className="form-input text-xs bg-[#FFFFFF] border-dark-border text-[#111111] font-mono cursor-pointer"
                value={bannerType}
                onChange={(e) => setBannerType(e.target.value)}
              >
                <option value="luxury">Luxury Campaign</option>
                <option value="new-arrival">New Arrival</option>
                <option value="limited">Limited Edition</option>
                <option value="sale">Weekend Sale</option>
                <option value="launch">Collection Launch</option>
                <option value="seasonal">Seasonal Collection</option>
                <option value="brand">Featured Brand</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Text Alignment</label>
                <select
                  className="form-input text-xs bg-[#FFFFFF] border-dark-border text-[#111111] font-mono cursor-pointer"
                  value={textAlignment}
                  onChange={(e) => setTextAlignment(e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Background style/color</label>
                <input
                  type="text"
                  placeholder="e.g. #F7F7F5"
                  className="form-input text-xs font-mono"
                  value={backgroundStyle}
                  onChange={(e) => setBackgroundStyle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Overlay Opacity (0 to 1)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  className="form-input text-xs font-mono"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Priority Order</label>
                <input
                  type="number"
                  className="form-input text-xs font-mono"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Start Date Scheduler</label>
                <input
                  type="date"
                  className="form-input text-xs font-mono"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">End Date Scheduler</label>
                <input
                  type="date"
                  className="form-input text-xs font-mono"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Badge Subtitle</label>
              <input
                type="text"
                placeholder="e.g. NEW ARRIVALS EVERY WEEK"
                className="form-input text-xs"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Hero Title</label>
              <input
                type="text"
                placeholder="e.g. UNCOMPROMISING LUXURY"
                className="form-input text-xs"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Description</label>
              <textarea
                placeholder="Slide descriptions..."
                className="form-input text-xs min-h-[60px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Primary Button Text</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  value={primaryButtonText}
                  onChange={(e) => setPrimaryButtonText(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Primary CTA Link</label>
                <input
                  type="text"
                  className="form-input text-xs font-mono"
                  value={primaryButtonLink}
                  onChange={(e) => setPrimaryButtonLink(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Secondary Button Text</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  value={secondaryButtonText}
                  onChange={(e) => setSecondaryButtonText(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Secondary CTA Link</label>
                <input
                  type="text"
                  className="form-input text-xs font-mono"
                  value={secondaryButtonLink}
                  onChange={(e) => setSecondaryButtonLink(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t border-border-light pt-3">
              <h4 className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wide mb-2">Asymmetric Campaign Media</h4>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Desktop Hero Image */}
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">Desktop Image</label>
                  <label className="flex flex-col items-center justify-center h-14 rounded-xl border border-dashed border-border-light bg-neutral-50 hover:border-text-primary cursor-pointer transition-colors p-1">
                    <Upload size={12} className="text-text-secondary mb-0.5" />
                    <span className="text-[8px] font-bold text-text-primary uppercase truncate max-w-[100px]">
                      {imageFile ? imageFile.name : 'Upload File'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setImageFile, setImagePreview)} />
                  </label>
                </div>
                {/* Mobile Hero Image */}
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">Mobile Image</label>
                  <label className="flex flex-col items-center justify-center h-14 rounded-xl border border-dashed border-border-light bg-neutral-50 hover:border-text-primary cursor-pointer transition-colors p-1">
                    <Upload size={12} className="text-text-secondary mb-0.5" />
                    <span className="text-[8px] font-bold text-text-primary uppercase truncate max-w-[100px]">
                      {mobileImageFile ? mobileImageFile.name : 'Upload File'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setMobileImageFile, setMobileImagePreview)} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                {/* Transparent Model Image */}
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">Model Image (PNG)</label>
                  <label className="flex flex-col items-center justify-center h-14 rounded-xl border border-dashed border-border-light bg-neutral-50 hover:border-text-primary cursor-pointer transition-colors p-1">
                    <Upload size={12} className="text-text-secondary mb-0.5" />
                    <span className="text-[8px] font-bold text-text-primary uppercase truncate max-w-[100px]">
                      {modelImageFile ? modelImageFile.name : 'Upload File'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setModelImageFile, setModelImagePreview)} />
                  </label>
                </div>
                {/* Transparent Product Image */}
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">Product Image (PNG)</label>
                  <label className="flex flex-col items-center justify-center h-14 rounded-xl border border-dashed border-border-light bg-neutral-50 hover:border-text-primary cursor-pointer transition-colors p-1">
                    <Upload size={12} className="text-text-secondary mb-0.5" />
                    <span className="text-[8px] font-bold text-text-primary uppercase truncate max-w-[100px]">
                      {productImageFile ? productImageFile.name : 'Upload File'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setProductImageFile, setProductImagePreview)} />
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-border-light pt-3">
              <h4 className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wide mb-2">Floating Product Highlight Card (Optional)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">Card Label</label>
                  <input type="text" className="form-input text-xs" value={featuredLabel} onChange={(e) => setFeaturedLabel(e.target.value)} />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">Product Title</label>
                  <input type="text" className="form-input text-xs" value={featuredTitle} onChange={(e) => setFeaturedTitle(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">Price (₹)</label>
                  <input type="number" className="form-input text-xs font-mono" value={featuredPrice} onChange={(e) => setFeaturedPrice(e.target.value)} />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">Alt Text (SEO)</label>
                  <input type="text" className="form-input text-xs" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-neutral-900 border-border-light focus:ring-neutral-900 cursor-pointer"
              />
              <label htmlFor="isActive" className="text-[10px] font-mono text-text-primary uppercase font-bold select-none cursor-pointer">Active Slide</label>
            </div>

            <div className="flex gap-2.5 mt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-border-light text-[10px] font-mono tracking-wider text-text-secondary py-3.5 rounded-xl hover:bg-neutral-50 hover:text-text-primary transition-colors cursor-pointer bg-white"
                >
                  CANCEL
                </button>
              )}
              <button
                type="submit"
                className="flex-1 btn-gold text-[10px] py-3.5"
              >
                {editingId ? 'UPDATE SLIDE' : 'CREATE SLIDE'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
