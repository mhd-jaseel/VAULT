import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Megaphone, Save, Power, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function AdminAnnouncement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/announcements/admin');
      if (res.data.success) {
        const d = res.data.data;
        setIsActive(d.isActive ?? true);
        setContent(d.content || '');
        setLastUpdated(d.updatedAt ? new Date(d.updatedAt).toLocaleString() : null);
      }
    } catch (err) {
      console.error('Error fetching admin announcement settings:', err);
      toast.error('Failed to load announcement settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Announcement content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put('/announcements/admin', {
        content: content.trim(),
        isActive,
      });

      if (res.data.success) {
        toast.success('Announcement updated successfully!');
        setContent(res.data.data.content);
        setIsActive(res.data.data.isActive);
        setLastUpdated(new Date(res.data.data.updatedAt).toLocaleString());
      }
    } catch (err) {
      console.error('Error updating announcement:', err);
      toast.error(err.response?.data?.message || 'Failed to update announcement');
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
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary flex items-center gap-2">
            <Megaphone size={24} className="text-text-primary" /> Announcement Banner
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Control the promotional marquee banner displayed directly below the main navigation bar.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-text-secondary font-bold">Current Status:</span>
          {isActive ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-green-100 text-green-800 border border-green-200">
              <CheckCircle size={12} /> ACTIVE (ON)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-neutral-200 text-neutral-700 border border-neutral-300">
              <XCircle size={12} /> INACTIVE (OFF)
            </span>
          )}
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="glass-card flex flex-col gap-6">
          <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 flex items-center justify-between">
            <span>Banner Configuration</span>
            {lastUpdated && (
              <span className="text-[10px] text-text-secondary normal-case font-normal">
                Last updated: {lastUpdated}
              </span>
            )}
          </h3>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-xl border border-border-light">
            <div>
              <label className="text-xs font-bold font-mono text-text-primary uppercase block">
                Enable Announcement Banner
              </label>
              <p className="text-[11px] text-text-secondary mt-0.5">
                When enabled, the black promotional bar will scroll across the top of the store.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-black' : 'bg-neutral-300'
              }`}
              role="switch"
              aria-checked={isActive}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Content Field */}
          <div>
            <label className="text-xs font-mono font-bold uppercase text-text-primary block mb-2">
              Announcement Content <span className="text-red-500">*</span>
            </label>
            <textarea
              className="form-input text-xs font-mono min-h-[100px] resize-y"
              placeholder="e.g. FREE SUNGLASSES WORTH RS 949 ABOVE A PURCHASE OF RS 2000"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <p className="text-[10px] font-mono text-text-secondary mt-1.5">
              Enter promotional offers or notifications. Multiple offers can be combined into one string. It will automatically repeat seamlessly in the infinite marquee.
            </p>
          </div>

          {/* Live Preview Section */}
          <div className="mt-2 border-t border-border-light pt-4">
            <span className="text-[10px] font-mono uppercase text-text-secondary font-bold block mb-2">
              Live Banner Preview:
            </span>
            {isActive && content.trim() ? (
              <div className="w-full bg-black text-white py-2 px-4 rounded-xl overflow-hidden text-center">
                <span className="font-bold uppercase tracking-wider text-[11px]">
                  {content.trim()} &nbsp;&nbsp;*&nbsp;&nbsp; {content.trim()} &nbsp;&nbsp;*&nbsp;&nbsp; {content.trim()}
                </span>
              </div>
            ) : (
              <div className="w-full bg-neutral-100 border border-dashed border-neutral-300 text-neutral-500 py-3 text-center rounded-xl text-xs font-mono">
                Banner is currently INACTIVE or missing content. It will NOT appear on the store.
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-border-light">
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="btn-gold flex items-center gap-2 py-3 px-8"
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={14} /> Save Announcement Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
