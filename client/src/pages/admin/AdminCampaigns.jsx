import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import {
  Plus, Trash2, Edit2, Eye, EyeOff, Upload, Sparkles, X, Save,
} from 'lucide-react';
import Pagination from '../../components/Pagination';

const API_BASE = 'http://localhost:5000';

const emptyForm = {
  label: 'SS 2026',
  title: '',
  description: '',
  ctaText: 'SHOP THE LOOK',
  ctaLink: '/shop',
  imageAlt: 'Fashion campaign image',
  seoTitle: '',
  seoDescription: '',
  isActive: true,
  order: 0,
  startDate: '',
  endDate: '',
};

export default function AdminCampaigns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Image state
  const [desktopFile, setDesktopFile] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState('');
  const [mobileFile, setMobileFile] = useState(null);
  const [mobilePreview, setMobilePreview] = useState('');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/admin/campaigns?page=${page}&limit=5`);
      if (res.data.success) {
        setCampaigns(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, [page]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, order: campaigns.length });
    setDesktopFile(null);
    setDesktopPreview('');
    setMobileFile(null);
    setMobilePreview('');
  };

  const handleField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleFileChange = (e, fileSetter, previewSetter) => {
    const file = e.target.files[0];
    if (file) {
      fileSetter(file);
      previewSetter(URL.createObjectURL(file));
    }
  };

  const handleEditClick = (c) => {
    setEditingId(c._id);
    setForm({
      label: c.label || '',
      title: c.title || '',
      description: c.description || '',
      ctaText: c.ctaText || 'SHOP THE LOOK',
      ctaLink: c.ctaLink || '/shop',
      imageAlt: c.imageAlt || '',
      seoTitle: c.seoTitle || '',
      seoDescription: c.seoDescription || '',
      isActive: c.isActive,
      order: c.order ?? 0,
      startDate: c.startDate ? c.startDate.substring(0, 10) : '',
      endDate: c.endDate ? c.endDate.substring(0, 10) : '',
    });
    setDesktopFile(null);
    setDesktopPreview(c.desktopImageUrl ? `${API_BASE}${c.desktopImageUrl}` : '');
    setMobileFile(null);
    setMobilePreview(c.mobileImageUrl ? `${API_BASE}${c.mobileImageUrl}` : '');
  };

  const handleToggleActive = async (c) => {
    try {
      const res = await axios.patch(`/admin/campaigns/${c._id}`, { isActive: !c.isActive });
      if (res.data.success) {
        toast.success('Campaign status updated.');
        fetchCampaigns();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update campaign.');
    }
  };

  const handleDelete = async (id) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Campaign?',
      text: 'This campaign will be permanently removed from the homepage.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await axios.delete(`/admin/campaigns/${id}`);
      if (res.data.success) {
        toast.success('Campaign deleted.');
        fetchCampaigns();
        if (editingId === id) resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete campaign.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.warning('Title and Description are required.');
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));

    if (desktopFile) {
      fd.append('desktopImageUrl', desktopFile);
    } else if (editingId) {
      const old = campaigns.find((c) => c._id === editingId);
      if (old?.desktopImageUrl) fd.append('desktopImageUrl', old.desktopImageUrl);
    } else {
      toast.warning('Please upload a desktop campaign image.');
      return;
    }

    if (mobileFile) {
      fd.append('mobileImageUrl', mobileFile);
    } else if (editingId) {
      const old = campaigns.find((c) => c._id === editingId);
      if (old?.mobileImageUrl) fd.append('mobileImageUrl', old.mobileImageUrl);
    }

    try {
      let res;
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editingId) {
        res = await axios.patch(`/admin/campaigns/${editingId}`, fd, cfg);
      } else {
        res = await axios.post('/admin/campaigns', fd, cfg);
      }
      if (res.data.success) {
        toast.success(editingId ? 'Campaign updated.' : 'Campaign created.');
        resetForm();
        fetchCampaigns();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save campaign.');
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen text-[#111111] admin-panel-theme">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
          Fashion Campaigns
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Manage the editorial campaign section displayed at the top of the homepage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT — Campaign list + preview */}
        <div className="lg:col-span-7 space-y-6">

          {/* Live Preview Pane */}
          <div className="glass-card overflow-hidden !p-0 border border-border-light rounded-2xl bg-white shadow-lg">
            <div className="flex items-center gap-2 bg-[#111111] text-white px-4 py-3">
              <Sparkles size={11} className="text-yellow-400" />
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold">Campaign Preview</span>
            </div>

            {/* 50/50 preview */}
            <div className="flex h-52 overflow-hidden">
              {/* Left column */}
              <div className="w-1/2 flex flex-col justify-center px-6 py-4 bg-white border-r border-border-light gap-2">
                <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 border-t border-neutral-200 pt-2">
                  {form.label || 'CAMPAIGN LABEL'}
                </span>
                <h2 className="text-sm font-extrabold uppercase leading-tight text-[#111111]">
                  {form.title || 'Campaign Title'}
                </h2>
                <p className="text-[9px] text-text-secondary leading-relaxed line-clamp-2">
                  {form.description || 'Campaign description appears here.'}
                </p>
                <button className="mt-1 self-start bg-[#111111] text-white text-[8px] font-mono tracking-widest uppercase px-3 py-1.5 rounded-none">
                  {form.ctaText || 'SHOP THE LOOK'} →
                </button>
              </div>

              {/* Right column — image */}
              <div className="w-1/2 bg-neutral-100 relative overflow-hidden">
                {desktopPreview ? (
                  <img
                    src={desktopPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-wider">Upload Image</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campaign list */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              All Campaigns
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl shimmer-bg" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-10 text-text-secondary text-xs font-mono">
                NO CAMPAIGNS YET. CREATE ONE USING THE FORM.
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => {
                  const thumb = c.desktopImageUrl?.startsWith('/')
                    ? `${API_BASE}${c.desktopImageUrl}`
                    : c.desktopImageUrl;
                  return (
                    <div
                      key={c._id}
                      className="flex items-center justify-between border border-border-light bg-neutral-50 p-3.5 rounded-2xl gap-4 hover:border-text-primary transition-all duration-300"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-border-light flex-shrink-0">
                          {thumb ? (
                            <img src={thumb} alt={c.imageAlt} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                              <span className="text-[7px] font-mono text-neutral-300">NO IMG</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[7px] tracking-wider uppercase bg-black text-white px-2 py-0.5 rounded-full font-bold">
                              {c.label}
                            </span>
                            <span className="text-[9px] font-mono text-text-secondary">Priority: {c.order}</span>
                          </div>
                          <h4 className="font-bold text-xs text-text-primary truncate uppercase tracking-wider mt-1">{c.title}</h4>
                          <p className="text-[9px] text-text-secondary truncate max-w-xs mt-0.5">{c.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleActive(c)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            c.isActive
                              ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                          }`}
                          title={c.isActive ? 'Disable' : 'Enable'}
                        >
                          {c.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          onClick={() => handleEditClick(c)}
                          className="p-2 bg-white border border-border-light text-text-primary rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                          title="Delete"
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

        {/* RIGHT — Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="glass-card flex flex-col gap-4 bg-white border border-border-light shadow-md">
            <div className="flex justify-between items-center border-b border-border-light pb-3">
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary">
                {editingId ? 'Edit Campaign' : 'New Campaign'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-red-500 hover:text-red-700 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <X size={11} /> Cancel
                </button>
              )}
            </div>

            {/* Label & Order */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Campaign Label</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="e.g. SS 2026"
                  value={form.label}
                  onChange={(e) => handleField('label', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Priority Order</label>
                <input
                  type="number"
                  className="form-input text-xs font-mono"
                  value={form.order}
                  onChange={(e) => handleField('order', e.target.value)}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Campaign Title *</label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="e.g. UNCOMPROMISING LUXURY"
                value={form.title}
                onChange={(e) => handleField('title', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Description *</label>
              <textarea
                className="form-input text-xs min-h-[64px] resize-none"
                placeholder="Short editorial description..."
                value={form.description}
                onChange={(e) => handleField('description', e.target.value)}
                required
              />
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">CTA Button Text</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  value={form.ctaText}
                  onChange={(e) => handleField('ctaText', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">CTA Link</label>
                <input
                  type="text"
                  className="form-input text-xs font-mono"
                  value={form.ctaLink}
                  onChange={(e) => handleField('ctaLink', e.target.value)}
                />
              </div>
            </div>

            {/* Images */}
            <div className="border-t border-border-light pt-3">
              <h4 className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wide mb-2">
                Campaign Photography
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {/* Desktop Image */}
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">
                    Desktop Image *
                  </label>
                  <label className="flex flex-col items-center justify-center h-20 rounded-xl border border-dashed border-border-light bg-neutral-50 hover:border-text-primary cursor-pointer transition-colors overflow-hidden relative">
                    {desktopPreview ? (
                      <img src={desktopPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload size={14} className="text-text-secondary mb-1" />
                        <span className="text-[8px] font-mono text-text-secondary uppercase">Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setDesktopFile, setDesktopPreview)}
                    />
                  </label>
                  {desktopFile && (
                    <p className="text-[7px] font-mono text-text-secondary mt-1 truncate">{desktopFile.name}</p>
                  )}
                </div>

                {/* Mobile Image */}
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">
                    Mobile Image (opt.)
                  </label>
                  <label className="flex flex-col items-center justify-center h-20 rounded-xl border border-dashed border-border-light bg-neutral-50 hover:border-text-primary cursor-pointer transition-colors overflow-hidden relative">
                    {mobilePreview ? (
                      <img src={mobilePreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload size={14} className="text-text-secondary mb-1" />
                        <span className="text-[8px] font-mono text-text-secondary uppercase">Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setMobileFile, setMobilePreview)}
                    />
                  </label>
                  {mobileFile && (
                    <p className="text-[7px] font-mono text-text-secondary mt-1 truncate">{mobileFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="border-t border-border-light pt-3">
              <h4 className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wide mb-2">SEO</h4>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">Alt Text</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    value={form.imageAlt}
                    onChange={(e) => handleField('imageAlt', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">SEO Title</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    value={form.seoTitle}
                    onChange={(e) => handleField('seoTitle', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">SEO Description</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    value={form.seoDescription}
                    onChange={(e) => handleField('seoDescription', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="border-t border-border-light pt-3">
              <h4 className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wide mb-2">Schedule</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">Start Date</label>
                  <input
                    type="date"
                    className="form-input text-xs font-mono"
                    value={form.startDate}
                    onChange={(e) => handleField('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-text-secondary uppercase block mb-1">End Date</label>
                  <input
                    type="date"
                    className="form-input text-xs font-mono"
                    value={form.endDate}
                    onChange={(e) => handleField('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="campaignActive"
                checked={form.isActive}
                onChange={(e) => handleField('isActive', e.target.checked)}
                className="w-4 h-4 rounded text-neutral-900 border-border-light focus:ring-neutral-900 cursor-pointer"
              />
              <label htmlFor="campaignActive" className="text-[10px] font-mono text-text-primary uppercase font-bold select-none cursor-pointer">
                Active (visible on homepage)
              </label>
            </div>

            {/* Submit */}
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
              <button type="submit" className="flex-1 btn-gold text-[10px] py-3.5 flex items-center justify-center gap-1.5">
                <Save size={12} />
                {editingId ? 'UPDATE CAMPAIGN' : 'CREATE CAMPAIGN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
