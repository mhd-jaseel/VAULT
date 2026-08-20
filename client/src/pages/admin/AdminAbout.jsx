import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FileText,
  User,
  Users,
  Layers,
  Save,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Eye,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { PremiumSwal } from '../../utils/swalHelper';
import { resolveImage } from '../../utils/imageHelper';

export default function AdminAbout() {
  const [activeTab, setActiveTab] = useState('hero'); // 'hero', 'founder', 'co-founder', 'story', 'sections'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // About data state
  const [aboutData, setAboutData] = useState(null);

  // Hero Image state
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState('');
  const [heroImageRemoved, setHeroImageRemoved] = useState(false);

  // Founder Form state
  const [founderForm, setFounderForm] = useState({
    name: '',
    designation: '',
    tagline: '',
    heading: '',
    paragraphs: '',
    isActive: true,
  });
  const [founderImageFile, setFounderImageFile] = useState(null);
  const [founderImagePreview, setFounderImagePreview] = useState('');

  // Co-Founder Form state
  const [coFounderForm, setCoFounderForm] = useState({
    name: '',
    designation: '',
    tagline: '',
    heading: '',
    paragraphs: '',
    isActive: false,
  });
  const [coFounderImageFile, setCoFounderImageFile] = useState(null);
  const [coFounderImagePreview, setCoFounderImagePreview] = useState('');

  // Story Form state
  const [storyForm, setStoryForm] = useState({
    storyTagline: '',
    storyHeading: '',
    storyParagraphs: '',
  });

  // Additional Section Modal state
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({
    tagline: '',
    heading: '',
    content: '',
    order: 0,
    isActive: true,
  });
  const [sectionImageFile, setSectionImageFile] = useState(null);
  const [sectionImagePreview, setSectionImagePreview] = useState('');

  const fetchAboutData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/about');
      if (res.data.success && res.data.data) {
        const d = res.data.data;
        setAboutData(d);

        // Populate Hero Image
        setHeroImagePreview(d.heroImage ? resolveImage(d.heroImage) : '');
        setHeroImageFile(null);
        setHeroImageRemoved(false);

        // Populate Founder Form
        if (d.founder) {
          setFounderForm({
            name: d.founder.name || '',
            designation: d.founder.designation || '',
            tagline: d.founder.tagline || '',
            heading: d.founder.heading || '',
            paragraphs: (d.founder.paragraphs || []).join('\n\n'),
            isActive: d.founder.isActive ?? true,
          });
          setFounderImagePreview(
            d.founder.image ? resolveImage(d.founder.image) : ''
          );
        }

        // Populate Co-Founder Form
        if (d.coFounder) {
          setCoFounderForm({
            name: d.coFounder.name || '',
            designation: d.coFounder.designation || '',
            tagline: d.coFounder.tagline || '',
            heading: d.coFounder.heading || '',
            paragraphs: (d.coFounder.paragraphs || []).join('\n\n'),
            isActive: d.coFounder.isActive ?? false,
          });
          setCoFounderImagePreview(
            d.coFounder.image ? resolveImage(d.coFounder.image) : ''
          );
        }

        // Populate Story
        setStoryForm({
          storyTagline: d.story?.tagline || '',
          storyHeading: d.story?.heading || '',
          storyParagraphs: (d.story?.paragraphs || []).join('\n\n'),
        });
      }
    } catch (err) {
      console.error('Failed to load About page data:', err);
      toast.error('Failed to load About page data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAboutData();
  }, []);

  // Save / Upload / Remove Hero Image
  const handleSaveHeroImage = async (e) => {
    e.preventDefault();
    if (!heroImageFile && !heroImageRemoved) {
      toast.info('No changes to save for hero image.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      if (heroImageFile) {
        formData.append('image', heroImageFile);
      }
      if (heroImageRemoved) {
        formData.append('removeImage', 'true');
      }

      const res = await axios.put('/about/admin/hero', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success(heroImageRemoved ? 'Hero image removed successfully!' : 'About hero image uploaded & saved!');
        fetchAboutData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update hero image');
    } finally {
      setSaving(false);
    }
  };

  // Remove Hero Image confirmation
  const handleRemoveHeroImage = async () => {
    const result = await PremiumSwal.fire({
      title: 'Remove Hero Image?',
      text: 'The customer About page will display without a hero image banner.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      setHeroImageFile(null);
      setHeroImagePreview('');
      setHeroImageRemoved(true);
    }
  };

  // Save Founder info & image
  const handleSaveFounder = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', founderForm.name);
      formData.append('designation', founderForm.designation);
      formData.append('tagline', founderForm.tagline);
      formData.append('heading', founderForm.heading);
      formData.append('paragraphs', founderForm.paragraphs);
      formData.append('isActive', founderForm.isActive);

      if (founderImageFile) {
        formData.append('image', founderImageFile);
      }

      const res = await axios.put('/about/admin/founder', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Founder profile updated successfully!');
        setFounderImageFile(null);
        fetchAboutData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update founder profile');
    } finally {
      setSaving(false);
    }
  };

  // Save Co-Founder info & image
  const handleSaveCoFounder = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', coFounderForm.name);
      formData.append('designation', coFounderForm.designation);
      formData.append('tagline', coFounderForm.tagline);
      formData.append('heading', coFounderForm.heading);
      formData.append('paragraphs', coFounderForm.paragraphs);
      formData.append('isActive', coFounderForm.isActive);

      if (coFounderImageFile) {
        formData.append('image', coFounderImageFile);
      }

      const res = await axios.put('/about/admin/co-founder', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Co-Founder profile updated successfully!');
        setCoFounderImageFile(null);
        fetchAboutData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update co-founder profile');
    } finally {
      setSaving(false);
    }
  };

  // Save Hero & Story text
  const handleSaveStory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        hero: {
          establishedYear: storyForm.heroEstablished,
          titlePart1: storyForm.heroTitle1,
          titleHighlight: storyForm.heroHighlight,
          subtitle: storyForm.heroSubtitle,
        },
        story: {
          tagline: storyForm.storyTagline,
          heading: storyForm.storyHeading,
          paragraphs: storyForm.storyParagraphs.split('\n\n').map((p) => p.trim()).filter(Boolean),
        },
      };

      const res = await axios.put('/about/admin', payload);
      if (res.data.success) {
        toast.success('Hero & Story narratives updated successfully!');
        fetchAboutData();
      }
    } catch (err) {
      toast.error('Failed to update story narratives.');
    } finally {
      setSaving(false);
    }
  };

  // Save / Add Additional Section
  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.heading || !sectionForm.content) {
      toast.error('Heading and content are required.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('tagline', sectionForm.tagline);
      formData.append('heading', sectionForm.heading);
      formData.append('content', sectionForm.content);
      formData.append('order', sectionForm.order);
      formData.append('isActive', sectionForm.isActive);

      if (sectionImageFile) {
        formData.append('image', sectionImageFile);
      }

      let res;
      if (editingSection) {
        res = await axios.put(`/about/admin/sections/${editingSection._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axios.post('/about/admin/sections', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data.success) {
        toast.success(editingSection ? 'Section updated successfully!' : 'New section added!');
        setSectionModalOpen(false);
        setEditingSection(null);
        setSectionImageFile(null);
        fetchAboutData();
      }
    } catch (err) {
      toast.error('Failed to save section.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Section
  const handleDeleteSection = async (sectionId) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Section?',
      text: 'Are you sure you want to permanently delete this custom section?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(`/about/admin/sections/${sectionId}`);
        if (res.data.success) {
          toast.success('Section deleted successfully.');
          fetchAboutData();
        }
      } catch (err) {
        toast.error('Failed to delete section.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans text-[#111111] min-w-0">
      {/* Title & Preview Link */}
      <div className="pb-4 border-b border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
            <FileText className="text-[#d97706]" size={24} /> About Page Management
          </h1>
          <p className="text-xs text-[#6b7280] font-mono mt-1">
            Manage Founder, Co-Founder, Story narratives, and custom sections.
          </p>
        </div>

        <a
          href="/about"
          target="_blank"
          rel="noreferrer"
          className="btn-gold text-[10px] !py-2 !px-4 uppercase font-mono font-bold tracking-wider flex items-center gap-1.5 shrink-0"
        >
          <Eye size={13} /> View Live About Page
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e5e5] gap-2 md:gap-6 overflow-x-auto font-mono text-xs font-bold">
        {[
          { id: 'hero', label: 'ABOUT HERO IMAGE', icon: ImageIcon },
          { id: 'founder', label: 'FOUNDER SECTION', icon: User },
          { id: 'co-founder', label: 'CO-FOUNDER SECTION', icon: Users },
          { id: 'story', label: 'BRAND NARRATIVE', icon: FileText },
          { id: 'sections', label: 'ADDITIONAL SECTIONS', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 uppercase tracking-wider cursor-pointer border-b-2 transition-all shrink-0 px-2 flex items-center gap-1.5 ${
                isActive
                  ? 'border-[#111111] text-[#111111] font-extrabold'
                  : 'border-transparent text-[#6b7280] hover:text-[#111111]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#d97706]' : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#6b7280] font-mono flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-2" />
          Loading about page configurations...
        </div>
      ) : (
        <>
          {/* ── 0. HERO IMAGE TAB ── */}
          {activeTab === 'hero' && (
            <form onSubmit={handleSaveHeroImage} className="space-y-6">
              <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e5e5e5] gap-2">
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-[#111111] flex items-center gap-2">
                      <ImageIcon size={16} className="text-[#d97706]" /> About Hero Image
                    </h3>
                    <p className="text-xs text-[#6b7280] font-mono mt-0.5">
                      Configure an image-only banner for the customer About page. If no image is set, the hero section is completely hidden.
                    </p>
                  </div>
                  {heroImagePreview && !heroImageRemoved && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                      HERO BANNER ACTIVE
                    </span>
                  )}
                </div>

                {/* Hero Image Container Preview */}
                <div className="space-y-3">
                  <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-bold block">
                    Hero Banner Image
                  </label>

                  {heroImagePreview && !heroImageRemoved ? (
                    <div className="relative w-full rounded-2xl overflow-hidden border border-[#e5e5e5] bg-neutral-950 group shadow-inner">
                      <img
                        src={heroImagePreview}
                        alt="About Hero Preview"
                        className="w-full max-h-96 object-cover object-center block"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="btn-gold text-[10px] !py-2 !px-4 uppercase font-mono font-bold tracking-wider cursor-pointer flex items-center gap-1.5 shadow-lg">
                          <Upload size={13} /> Change Image
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  toast.error('Image size must be less than 10MB.');
                                  return;
                                }
                                setHeroImageFile(file);
                                setHeroImagePreview(URL.createObjectURL(file));
                                setHeroImageRemoved(false);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveHeroImage}
                          className="bg-red-600 hover:bg-red-700 text-white text-[10px] !py-2 !px-4 uppercase font-mono font-bold tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg transition-colors"
                        >
                          <Trash2 size={13} /> Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-64 rounded-2xl border-2 border-dashed border-[#d1d5db] hover:border-[#111111] bg-[#f9fafb] hover:bg-neutral-100 transition-all flex flex-col items-center justify-center cursor-pointer p-6 text-center group">
                      <div className="w-14 h-14 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center text-[#6b7280] group-hover:text-[#111111] group-hover:border-[#111111] transition-all mb-3 shadow-xs">
                        <Upload size={22} />
                      </div>
                      <span className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider block">
                        Upload Hero Image
                      </span>
                      <span className="text-[11px] text-[#6b7280] font-mono mt-1 block">
                        Recommended resolution: 1920×800 or 16:9 banner aspect ratio.
                      </span>
                      <span className="text-[10px] text-[#9ca3af] font-mono mt-2 block">
                        Format: JPG, PNG, WEBP (Max: 10MB)
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error('Image size must be less than 10MB.');
                              return;
                            }
                            setHeroImageFile(file);
                            setHeroImagePreview(URL.createObjectURL(file));
                            setHeroImageRemoved(false);
                          }
                        }}
                      />
                    </label>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-[#6b7280] pt-2 gap-2">
                    <span>Supported: JPG, PNG, WEBP</span>
                    <span>Responsive adaptive display</span>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-[#e5e5e5] flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || (!heroImageFile && !heroImageRemoved)}
                    className="btn-gold text-[10px] !py-2.5 !px-6 uppercase font-mono font-bold tracking-widest cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Hero Image
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── 1. FOUNDER TAB ── */}
          {activeTab === 'founder' && (
            <form onSubmit={handleSaveFounder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Image Upload & Preview */}
              <div className="lg:col-span-5 bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4 shadow-xs">
                <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-bold block">
                  Founder Portrait Photo
                </span>

                <div className="w-full h-80 rounded-2xl border-2 border-dashed border-[#e5e5e5] overflow-hidden flex items-center justify-center bg-[#f9fafb] relative group">
                  {founderImagePreview ? (
                    <img
                      src={founderImagePreview}
                      alt="Founder"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <ImageIcon size={36} className="mx-auto text-[#9ca3af]" />
                      <p className="text-xs text-[#6b7280] font-mono">Default system portrait in use</p>
                    </div>
                  )}

                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1 font-mono text-xs">
                    <Upload size={20} />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setFounderImageFile(file);
                          setFounderImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#6b7280]">
                  <span>Format: JPG, PNG, WEBP</span>
                  <span>Max size: 5MB</span>
                </div>
              </div>

              {/* Right Column: Founder Info */}
              <div className="lg:col-span-7 bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#111111]">
                    Founder Personal Information
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-bold text-[#111111]">
                    <input
                      type="checkbox"
                      checked={founderForm.isActive}
                      onChange={(e) => setFounderForm({ ...founderForm, isActive: e.target.checked })}
                      className="rounded border-[#d1d5db] text-[#d97706] focus:ring-[#d97706]"
                    />
                    Display on About Page
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={founderForm.name}
                      onChange={(e) => setFounderForm({ ...founderForm, name: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Designation / Title</label>
                    <input
                      type="text"
                      value={founderForm.designation}
                      onChange={(e) => setFounderForm({ ...founderForm, designation: e.target.value })}
                      placeholder="e.g. Founder & CEO, VAULT.CO"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Section Tagline</label>
                    <input
                      type="text"
                      value={founderForm.tagline}
                      onChange={(e) => setFounderForm({ ...founderForm, tagline: e.target.value })}
                      placeholder="FOUNDER'S PERSPECTIVE"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Section Heading</label>
                    <input
                      type="text"
                      value={founderForm.heading}
                      onChange={(e) => setFounderForm({ ...founderForm, heading: e.target.value })}
                      placeholder="A NOTE FROM AARAV SHARMA"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>
                </div>

                <div className="font-mono text-xs">
                  <label className="text-[10px] text-[#6b7280] uppercase block mb-1">
                    Founder Message / Story Paragraphs (Separate paragraphs with blank lines)
                  </label>
                  <textarea
                    rows={6}
                    value={founderForm.paragraphs}
                    onChange={(e) => setFounderForm({ ...founderForm, paragraphs: e.target.value })}
                    placeholder="Enter founder narrative..."
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl p-3 text-xs text-[#111111] leading-relaxed font-sans"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-[#e5e5e5] flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-gold text-[10px] !py-2.5 !px-6 uppercase font-mono font-bold tracking-widest cursor-pointer flex items-center gap-1.5"
                  >
                    {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Founder Details
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── 2. CO-FOUNDER TAB ── */}
          {activeTab === 'co-founder' && (
            <form onSubmit={handleSaveCoFounder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Image Upload & Preview */}
              <div className="lg:col-span-5 bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4 shadow-xs">
                <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-bold block">
                  Co-Founder Portrait Photo
                </span>

                <div className="w-full h-80 rounded-2xl border-2 border-dashed border-[#e5e5e5] overflow-hidden flex items-center justify-center bg-[#f9fafb] relative group">
                  {coFounderImagePreview ? (
                    <img
                      src={coFounderImagePreview}
                      alt="Co-Founder"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <ImageIcon size={36} className="mx-auto text-[#9ca3af]" />
                      <p className="text-xs text-[#6b7280] font-mono">No photo uploaded yet</p>
                    </div>
                  )}

                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1 font-mono text-xs">
                    <Upload size={20} />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setCoFounderImageFile(file);
                          setCoFounderImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Right Column: Co-Founder Info */}
              <div className="lg:col-span-7 bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#111111]">
                    Co-Founder Personal Information
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-bold text-[#111111]">
                    <input
                      type="checkbox"
                      checked={coFounderForm.isActive}
                      onChange={(e) => setCoFounderForm({ ...coFounderForm, isActive: e.target.checked })}
                      className="rounded border-[#d1d5db] text-[#d97706] focus:ring-[#d97706]"
                    />
                    Enable & Show on About Page
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={coFounderForm.name}
                      onChange={(e) => setCoFounderForm({ ...coFounderForm, name: e.target.value })}
                      placeholder="e.g. Rohan Varma"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Designation / Title</label>
                    <input
                      type="text"
                      value={coFounderForm.designation}
                      onChange={(e) => setCoFounderForm({ ...coFounderForm, designation: e.target.value })}
                      placeholder="e.g. Co-Founder & Head of Curation, VAULT.CO"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Section Tagline</label>
                    <input
                      type="text"
                      value={coFounderForm.tagline}
                      onChange={(e) => setCoFounderForm({ ...coFounderForm, tagline: e.target.value })}
                      placeholder="CO-FOUNDER'S VISION"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Section Heading</label>
                    <input
                      type="text"
                      value={coFounderForm.heading}
                      onChange={(e) => setCoFounderForm({ ...coFounderForm, heading: e.target.value })}
                      placeholder="A NOTE FROM ROHAN VARMA"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>
                </div>

                <div className="font-mono text-xs">
                  <label className="text-[10px] text-[#6b7280] uppercase block mb-1">
                    Co-Founder Message / Story Paragraphs
                  </label>
                  <textarea
                    rows={6}
                    value={coFounderForm.paragraphs}
                    onChange={(e) => setCoFounderForm({ ...coFounderForm, paragraphs: e.target.value })}
                    placeholder="Enter co-founder vision narrative..."
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl p-3 text-xs text-[#111111] leading-relaxed font-sans"
                  />
                </div>

                <div className="pt-3 border-t border-[#e5e5e5] flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-gold text-[10px] !py-2.5 !px-6 uppercase font-mono font-bold tracking-widest cursor-pointer flex items-center gap-1.5"
                  >
                    {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Co-Founder Details
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── 3. BRAND NARRATIVE TAB ── */}
          {activeTab === 'story' && (
            <form onSubmit={handleSaveStory} className="space-y-6">
              {/* Story Narrative */}
              <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4 shadow-xs">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#111111] border-b border-[#e5e5e5] pb-3">
                  Brand Narrative Section
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Story Tagline</label>
                    <input
                      type="text"
                      value={storyForm.storyTagline}
                      onChange={(e) => setStoryForm({ ...storyForm, storyTagline: e.target.value })}
                      placeholder="OUR NARRATIVE"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Story Heading</label>
                    <input
                      type="text"
                      value={storyForm.storyHeading}
                      onChange={(e) => setStoryForm({ ...storyForm, storyHeading: e.target.value })}
                      placeholder="REDEFINING MODERN LUXURY"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                    />
                  </div>
                </div>

                <div className="font-mono text-xs">
                  <label className="text-[10px] text-[#6b7280] uppercase block mb-1">
                    Story Paragraphs (Separate with blank line)
                  </label>
                  <textarea
                    rows={5}
                    value={storyForm.storyParagraphs}
                    onChange={(e) => setStoryForm({ ...storyForm, storyParagraphs: e.target.value })}
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl p-3 text-xs text-[#111111] leading-relaxed font-sans"
                  />
                </div>

                <div className="pt-3 border-t border-[#e5e5e5] flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-gold text-[10px] !py-2.5 !px-6 uppercase font-mono font-bold tracking-widest cursor-pointer flex items-center gap-1.5"
                  >
                    {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Narrative Changes
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── 4. ADDITIONAL SECTIONS TAB ── */}
          {activeTab === 'sections' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm uppercase text-[#111111]">Custom About Sections</h3>
                  <p className="text-xs text-[#6b7280] font-mono">Add custom stories, guarantees, or media blocks.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingSection(null);
                    setSectionForm({ tagline: '', heading: '', content: '', order: 0, isActive: true });
                    setSectionImageFile(null);
                    setSectionImagePreview('');
                    setSectionModalOpen(true);
                  }}
                  className="btn-gold text-[10px] !py-2 !px-4 uppercase font-mono font-bold tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Add New Section
                </button>
              </div>

              {(!aboutData.additionalSections || aboutData.additionalSections.length === 0) ? (
                <div className="p-12 text-center bg-white border border-dashed border-[#e5e5e5] rounded-2xl font-mono text-xs text-[#6b7280]">
                  <Layers size={32} className="mx-auto text-[#9ca3af] mb-2" />
                  No additional custom sections created yet. Click "Add New Section" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {aboutData.additionalSections.map((sec) => (
                    <div
                      key={sec._id}
                      className="bg-white border border-[#e5e5e5] rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider font-bold">
                            {sec.tagline || 'SECTION'}
                          </span>
                          <span
                            className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                              sec.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                            }`}
                          >
                            {sec.isActive !== false ? 'ACTIVE' : 'HIDDEN'}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs uppercase text-[#111111]">{sec.heading}</h4>
                        <p className="text-xs text-[#4b5563] line-clamp-3 font-sans leading-relaxed">{sec.content}</p>

                        {sec.image && (
                          <div className="w-full h-32 rounded-xl overflow-hidden border border-[#e5e5e5] mt-2">
                            <img
                              src={resolveImage(sec.image)}
                              alt={sec.heading}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#e5e5e5] flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingSection(sec);
                            setSectionForm({
                              tagline: sec.tagline || '',
                              heading: sec.heading || '',
                              content: sec.content || '',
                              order: sec.order || 0,
                              isActive: sec.isActive !== false,
                            });
                            setSectionImageFile(null);
                            setSectionImagePreview(
                              sec.image ? resolveImage(sec.image) : ''
                            );
                            setSectionModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-[#f9fafb] hover:bg-[#f3f4f6] text-[#111111] border border-[#e5e5e5] rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sec._id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                          title="Delete Section"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── ADD / EDIT SECTION MODAL ── */}
      {sectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-xl w-full shadow-2xl text-[#111111] my-8 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-bold text-sm uppercase text-[#111111] flex items-center gap-2">
                <Layers className="text-[#d97706]" size={16} />{' '}
                {editingSection ? 'Edit Custom Section' : 'Create Custom Section'}
              </h3>
              <button
                onClick={() => setSectionModalOpen(false)}
                className="text-[#6b7280] hover:text-[#111111] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Tagline</label>
                  <input
                    type="text"
                    value={sectionForm.tagline}
                    onChange={(e) => setSectionForm({ ...sectionForm, tagline: e.target.value })}
                    placeholder="e.g. SUSTAINABILITY"
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={sectionForm.order}
                    onChange={(e) => setSectionForm({ ...sectionForm, order: e.target.value })}
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Section Heading</label>
                <input
                  type="text"
                  value={sectionForm.heading}
                  onChange={(e) => setSectionForm({ ...sectionForm, heading: e.target.value })}
                  placeholder="e.g. ETHICALLY SOURCED CRAFT"
                  className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Section Content</label>
                <textarea
                  rows={4}
                  value={sectionForm.content}
                  onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })}
                  placeholder="Detailed text description..."
                  className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl p-3 text-xs text-[#111111] font-sans"
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase block mb-1">Optional Section Image</label>
                <div className="flex items-center gap-3">
                  {sectionImagePreview && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#e5e5e5] shrink-0">
                      <img src={sectionImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSectionImageFile(file);
                        setSectionImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="text-xs text-[#6b7280] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-[#f9fafb] file:text-[#111111] hover:file:bg-[#f3f4f6] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-bold text-[#111111]">
                  <input
                    type="checkbox"
                    checked={sectionForm.isActive}
                    onChange={(e) => setSectionForm({ ...sectionForm, isActive: e.target.checked })}
                    className="rounded border-[#d1d5db] text-[#d97706] focus:ring-[#d97706]"
                  />
                  Section is Active
                </label>
              </div>

              <div className="pt-3 border-t border-[#e5e5e5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSectionModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#e5e5e5] text-[#6b7280] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#f9fafb] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-gold text-xs !py-2 !px-5 uppercase font-mono font-bold tracking-wider cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                  {editingSection ? 'Save Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
