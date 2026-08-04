import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { Plus, Trash2, Edit2, Check, X, MoveUp, MoveDown, Save, Eye, EyeOff, Upload } from 'lucide-react';
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

  // File Upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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
    setImageFile(null);
    setImagePreview('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
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
    setImageFile(null);
    setImagePreview(banner.imageUrl ? `http://localhost:5000${banner.imageUrl}` : '');
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

    if (imageFile) {
      formData.append('imageUrl', imageFile);
    } else if (editingId) {
      // For editing, if no new file is uploaded, keep the old one
      const oldBanner = banners.find((b) => b._id === editingId);
      if (oldBanner) {
        formData.append('imageUrl', oldBanner.imageUrl);
      }
    } else {
      toast.warning('Please upload a product image for the banner slide.');
      return;
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
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary">
          Manage Hero Banners
        </h1>
        <p className="text-xs text-text-secondary mt-1">Configure and sequence slides for the homepage hero carousel banner.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Banners List */}
        <div className="lg:col-span-2 space-y-4">
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
                NO BANNER SLIDES INITIALISED.
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
                          <span className="text-[9px] font-mono font-bold bg-neutral-200 text-text-primary px-2 py-0.5 rounded-full">
                            ORDER {ban.order}
                          </span>
                          <h4 className="font-bold text-[11px] uppercase tracking-wide text-text-primary mt-1.5 truncate">{ban.heading}</h4>
                          <p className="text-[9px] text-text-secondary truncate mt-0.5">{ban.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(ban)}
                          className={`p-2 rounded-full border transition-all cursor-pointer ${
                            ban.isActive 
                              ? 'bg-neutral-900 border-neutral-900 text-white' 
                              : 'bg-white border-border-light text-neutral-400 hover:text-text-primary'
                          }`}
                          title={ban.isActive ? 'Hide slide' : 'Show slide'}
                        >
                          {ban.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                        <button
                          onClick={() => handleEditClick(ban)}
                          className="p-2 rounded-full bg-white border border-border-light text-text-primary hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Edit slide"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(ban._id)}
                          className="p-2 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Delete slide"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              page={page}
              pages={pages}
              onPageChange={(newPage) => setSearchParams({ page: newPage })}
              loading={loading}
            />
          </div>
        </div>

        {/* Create / Edit Form */}
        <div className="glass-card flex flex-col gap-4">
          <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-1">
            {editingId ? 'Edit Banner Slide' : 'Create Banner Slide'}
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Badge Text</label>
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
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Heading</label>
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
                className="form-input text-xs min-h-[70px] resize-none"
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
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Primary Link</label>
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
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Secondary Link</label>
                <input
                  type="text"
                  className="form-input text-xs font-mono"
                  value={secondaryButtonLink}
                  onChange={(e) => setSecondaryButtonLink(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t border-border-light pt-3 mt-1">
              <h4 className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wide mb-3">Floating Featured Card</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Card Label</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    value={featuredLabel}
                    onChange={(e) => setFeaturedLabel(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Product Title</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    value={featuredTitle}
                    onChange={(e) => setFeaturedTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    className="form-input text-xs font-mono"
                    value={featuredPrice}
                    onChange={(e) => setFeaturedPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Slide Order</label>
                  <input
                    type="number"
                    className="form-input text-xs font-mono"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border-light pt-3">
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1.5">Slide Image</label>
              {imagePreview ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-border-light bg-neutral-50 flex items-center justify-center p-2">
                  <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 bg-red-50 border border-red-200 text-red-600 text-[9px] font-mono font-bold py-1 px-2.5 rounded-full cursor-pointer shadow-sm"
                  >
                    CHANGE
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video rounded-xl border border-dashed border-border-light bg-neutral-50 hover:border-text-primary cursor-pointer p-4 transition-colors">
                  <Upload className="text-text-secondary mb-1" size={18} />
                  <span className="text-[9px] font-bold text-text-primary uppercase tracking-wide">Upload Banner Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Image Alt Text (SEO)</label>
              <input
                type="text"
                placeholder="Describe the image content..."
                className="form-input text-xs"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-neutral-900 border-border-light focus:ring-neutral-900"
              />
              <label htmlFor="isActive" className="text-[10px] font-mono text-text-primary uppercase font-bold select-none cursor-pointer">Active Slide</label>
            </div>

            <div className="flex gap-2.5 mt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-border-light text-[10px] font-mono tracking-wider text-text-secondary py-3.5 rounded-full hover:bg-neutral-50 hover:text-text-primary transition-colors cursor-pointer bg-white"
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
