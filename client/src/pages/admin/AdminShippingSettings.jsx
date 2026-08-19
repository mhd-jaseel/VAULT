import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Power,
  Calendar,
  Save,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';

export default function AdminShippingSettings() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Core Shipping Settings State
  const [shippingCharges, setShippingCharges] = useState(100);
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState(1500);
  const [handlingCharge, setHandlingCharge] = useState(0);
  const [returnAddress, setReturnAddress] = useState({
    recipientName: 'VAULT Returns Department',
    addressLine1: 'Unit 4B, Signature Tower',
    addressLine2: 'G-Block, BKC Road',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    pinCode: '400051',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    instructions: 'Pack the product securely in its original packaging with all tags attached. Please write the Return Reference ID clearly on top of the outer shipping box.',
  });

  // Special Shipping Campaigns State
  const [campaigns, setCampaigns] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);

  // Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    minOrderAmount: 0,
    isFreeShipping: true,
    isActive: true,
    priority: 0,
  });

  const fetchShippingData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/shipping-settings/admin');
      if (res.data.success) {
        const d = res.data.data;
        setShippingCharges(d.shippingCharges || 0);
        setFreeShippingMinAmount(d.freeShippingMinAmount || 0);
        setHandlingCharge(d.handlingCharge || 0);
        if (d.returnAddress) setReturnAddress(d.returnAddress);
        setCampaigns(d.campaigns || []);
      }
    } catch (err) {
      console.error('Error loading shipping settings:', err);
      toast.error('Failed to load shipping settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingData();
  }, []);

  // Save Core Shipping Settings & Return Address
  const handleSaveSettings = async (e) => {
    e.preventDefault();

    if (Number(shippingCharges) < 0 || Number(freeShippingMinAmount) < 0 || Number(handlingCharge) < 0) {
      toast.error('Values cannot be negative.');
      return;
    }

    setSavingSettings(true);
    try {
      const res = await axios.put('/shipping-settings/admin', {
        shippingCharges: Number(shippingCharges),
        freeShippingMinAmount: Number(freeShippingMinAmount),
        handlingCharge: Number(handlingCharge),
        returnAddress,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Shipping settings updated successfully.');
      }
    } catch (err) {
      console.error('Error saving shipping settings:', err);
      toast.error(err.response?.data?.message || 'Failed to update shipping settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Open Create/Edit Campaign Modal
  const handleOpenModal = (campaign = null) => {
    if (campaign) {
      setEditingCampaignId(campaign._id);
      setCampaignForm({
        name: campaign.name,
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
        minOrderAmount: campaign.minOrderAmount || 0,
        isFreeShipping: campaign.isFreeShipping !== undefined ? campaign.isFreeShipping : true,
        isActive: campaign.isActive !== undefined ? campaign.isActive : true,
        priority: campaign.priority || 0,
      });
    } else {
      setEditingCampaignId(null);
      const now = new Date();
      const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setCampaignForm({
        name: '',
        startDate: now.toISOString().slice(0, 16),
        endDate: inSevenDays.toISOString().slice(0, 16),
        minOrderAmount: 0,
        isFreeShipping: true,
        isActive: true,
        priority: 0,
      });
    }
    setModalOpen(true);
  };

  // Save Campaign (Create or Update)
  const handleSaveCampaign = async (e) => {
    e.preventDefault();

    if (!campaignForm.name.trim()) {
      toast.error('Please enter a campaign name.');
      return;
    }

    if (!campaignForm.startDate || !campaignForm.endDate) {
      toast.error('Please select start and end dates.');
      return;
    }

    if (new Date(campaignForm.endDate) < new Date(campaignForm.startDate)) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }

    setSubmittingCampaign(true);
    try {
      if (editingCampaignId) {
        const res = await axios.put(`/shipping-settings/admin/campaigns/${editingCampaignId}`, campaignForm);
        if (res.data.success) {
          toast.success(res.data.message || 'Campaign updated successfully.');
          setModalOpen(false);
          fetchShippingData();
        }
      } else {
        const res = await axios.post('/shipping-settings/admin/campaigns', campaignForm);
        if (res.data.success) {
          toast.success(res.data.message || 'Campaign created successfully.');
          setModalOpen(false);
          fetchShippingData();
        }
      }
    } catch (err) {
      console.error('Error saving campaign:', err);
      toast.error(err.response?.data?.message || 'Failed to save campaign.');
    } finally {
      setSubmittingCampaign(false);
    }
  };

  // Toggle Campaign Active Status directly
  const handleToggleStatus = async (campaign) => {
    try {
      const res = await axios.put(`/shipping-settings/admin/campaigns/${campaign._id}`, {
        isActive: !campaign.isActive,
      });
      if (res.data.success) {
        toast.success(`Campaign ${!campaign.isActive ? 'activated' : 'deactivated'}.`);
        fetchShippingData();
      }
    } catch (err) {
      toast.error('Failed to toggle campaign status.');
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this shipping campaign?')) return;

    try {
      const res = await axios.delete(`/shipping-settings/admin/campaigns/${campaignId}`);
      if (res.data.success) {
        toast.success('Campaign deleted successfully.');
        fetchShippingData();
      }
    } catch (err) {
      toast.error('Failed to delete campaign.');
    }
  };

  const isCampaignCurrentlyActive = (c) => {
    if (!c.isActive) return false;
    const now = new Date();
    return new Date(c.startDate) <= now && new Date(c.endDate) >= now;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full font-sans text-[#111111] min-w-0">
      {/* Title */}
      <div className="pb-4 border-b border-[#e5e5e5]">
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
          <Truck className="text-[#d97706]" size={24} /> Shipping & Delivery Settings
        </h1>
        <p className="text-xs text-[#6b7280] font-mono mt-1">
          Manage standard delivery charges, free delivery order thresholds, handling fees, and temporary promotional free shipping periods.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#6b7280] flex flex-col items-center justify-center font-mono">
          <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-2" />
          Loading shipping configuration...
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── SECTION 1: CORE SHIPPING & HANDLING SETTINGS ── */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-xs">
            <h2 className="font-sans font-bold text-sm uppercase text-[#111111] tracking-wide mb-1 flex items-center gap-2">
              Standard Shipping Rules
            </h2>
            <p className="text-xs text-[#6b7280] font-mono mb-6">
              Applied on standard business days when no temporary promotional campaigns override it.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Free Delivery Minimum */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-[#374151] uppercase font-bold block">
                    Free Delivery Minimum (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                    value={freeShippingMinAmount}
                    onChange={(e) => setFreeShippingMinAmount(e.target.value)}
                    required
                  />
                  <span className="text-[10px] text-[#6b7280] font-sans block">
                    Orders with subtotal ≥ this amount get free delivery.
                  </span>
                </div>

                {/* 2. Standard Shipping Charge */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-[#374151] uppercase font-bold block">
                    Standard Shipping Charge (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                    value={shippingCharges}
                    onChange={(e) => setShippingCharges(e.target.value)}
                    required
                  />
                  <span className="text-[10px] text-[#6b7280] font-sans block">
                    Fee applied when order subtotal is below the free threshold.
                  </span>
                </div>

                {/* 3. Handling Charge */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-[#374151] uppercase font-bold block">
                    Handling Charge (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                    value={handlingCharge}
                    onChange={(e) => setHandlingCharge(e.target.value)}
                    required
                  />
                  <span className="text-[10px] text-[#6b7280] font-sans block">
                    Fixed packaging/handling fee per checkout order (₹0 for none).
                  </span>
                </div>
              </div>

              {/* Return Address & Instructions Section */}
              <div className="pt-4 border-t border-[#e5e5e5] space-y-4">
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase text-[#111111] tracking-wide mb-0.5">
                    RETURN SHIPPING ADDRESS
                  </h3>
                  <p className="text-[11px] text-[#6b7280] font-mono">
                    This official warehouse address and packaging instructions are shown to customers when their return request is approved.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#374151] uppercase font-bold block">
                      Store / Recipient Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs font-mono text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                      value={returnAddress.recipientName || ''}
                      onChange={(e) => setReturnAddress({ ...returnAddress, recipientName: e.target.value })}
                      placeholder="e.g. VAULT Returns Department"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#374151] uppercase font-bold block">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs font-mono text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                      value={returnAddress.addressLine1 || ''}
                      onChange={(e) => setReturnAddress({ ...returnAddress, addressLine1: e.target.value })}
                      placeholder="e.g. Unit 4B, Signature Tower"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#374151] uppercase font-bold block">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs font-mono text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                      value={returnAddress.addressLine2 || ''}
                      onChange={(e) => setReturnAddress({ ...returnAddress, addressLine2: e.target.value })}
                      placeholder="e.g. G-Block, BKC Road"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#374151] uppercase font-bold block">
                        City
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs font-mono text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                        value={returnAddress.city || ''}
                        onChange={(e) => setReturnAddress({ ...returnAddress, city: e.target.value })}
                        placeholder="e.g. Mumbai"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#374151] uppercase font-bold block">
                        District
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs font-mono text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                        value={returnAddress.district || ''}
                        onChange={(e) => setReturnAddress({ ...returnAddress, district: e.target.value })}
                        placeholder="e.g. Mumbai Suburban"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#374151] uppercase font-bold block">
                        State
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs font-mono text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                        value={returnAddress.state || ''}
                        onChange={(e) => setReturnAddress({ ...returnAddress, state: e.target.value })}
                        placeholder="e.g. Maharashtra"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#374151] uppercase font-bold block">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs font-mono text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                        value={returnAddress.pinCode || ''}
                        onChange={(e) => setReturnAddress({ ...returnAddress, pinCode: e.target.value })}
                        placeholder="e.g. 400051"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#374151] uppercase font-bold block">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs font-mono text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                        value={returnAddress.phone || ''}
                        onChange={(e) => setReturnAddress({ ...returnAddress, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#374151] uppercase font-bold block">
                        WhatsApp Number
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs font-mono text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                        value={returnAddress.whatsapp || ''}
                        onChange={(e) => setReturnAddress({ ...returnAddress, whatsapp: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-mono text-[#374151] uppercase font-bold block">
                      Optional Return Instructions
                    </label>
                    <textarea
                      rows={2}
                      className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs font-mono text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                      value={returnAddress.instructions || ''}
                      onChange={(e) => setReturnAddress({ ...returnAddress, instructions: e.target.value })}
                      placeholder="e.g. Pack securely in original box with tags attached..."
                    />
                  </div>
                </div>
              </div>

              {/* Example Preview Notice */}
              <div className="p-3.5 bg-[#f9fafb] border border-[#e5e5e5] rounded-xl flex items-center justify-between text-xs font-mono text-[#4b5563]">
                <span>
                  Current Logic: Orders under <strong>₹{Number(freeShippingMinAmount).toLocaleString('en-IN')}</strong> pay <strong>₹{shippingCharges}</strong> shipping + <strong>₹{handlingCharge}</strong> handling.
                </span>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="bg-[#111111] hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Save size={13} /> {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* ── SECTION 2: SPECIAL FREE SHIPPING CAMPAIGNS ── */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5e5] pb-4">
              <div>
                <h2 className="font-sans font-bold text-sm uppercase text-[#111111] tracking-wide flex items-center gap-2">
                  <Sparkles size={16} className="text-[#d97706]" /> Special Promotional Free Shipping Campaigns
                </h2>
                <p className="text-xs text-[#6b7280] font-mono mt-0.5">
                  Create limited-time promotions (e.g. Festival Free Delivery, Weekend Specials) that temporarily override standard shipping fees.
                </p>
              </div>

              <button
                onClick={() => handleOpenModal()}
                className="bg-[#d97706] hover:bg-[#b45309] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} /> Create Campaign
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-12 bg-[#f9fafb] border border-[#e5e5e5] rounded-xl font-mono">
                <Truck className="mx-auto text-[#9ca3af] mb-2" size={28} />
                <p className="text-xs text-[#6b7280]">No special shipping campaigns created yet.</p>
                <p className="text-[10px] text-[#9ca3af] mt-1">Standard shipping rules are currently in effect.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#e5e5e5] rounded-xl font-mono text-xs">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                      <th className="p-3">Campaign Name</th>
                      <th className="p-3">Duration (Server Time)</th>
                      <th className="p-3">Min Order</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5]">
                    {campaigns.map((c) => {
                      const isLive = isCampaignCurrentlyActive(c);
                      return (
                        <tr key={c._id} className="hover:bg-[#f9fafb] transition-colors">
                          <td className="p-3 font-bold text-[#111111] font-sans">
                            <div className="flex items-center gap-2">
                              <span>{c.name}</span>
                              {isLive && (
                                <span className="text-[8px] font-mono font-bold uppercase text-[#16a34a] bg-[#f0fdf4] px-2 py-0.5 rounded-full border border-[#bbf7d0] animate-pulse">
                                  LIVE NOW
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-[#4b5563] text-[11px]">
                            {new Date(c.startDate).toLocaleString()} &mdash; {new Date(c.endDate).toLocaleString()}
                          </td>
                          <td className="p-3 font-bold text-[#111111]">
                            {c.minOrderAmount === 0 ? '₹0 (All Orders)' : `₹${c.minOrderAmount.toLocaleString('en-IN')}`}
                          </td>
                          <td className="p-3 text-[#6b7280]">{c.priority || 0}</td>
                          <td className="p-3">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                c.isActive
                                  ? isLive
                                    ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]'
                                    : 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]'
                                  : 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]'
                              }`}
                            >
                              {c.isActive ? (isLive ? 'ACTIVE' : 'SCHEDULED') : 'DISABLED'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleStatus(c)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                                  c.isActive
                                    ? 'bg-[#fffbeb] border-[#fde68a] text-[#d97706] hover:bg-[#fef3c7]'
                                    : 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a] hover:bg-[#dcfce7]'
                                }`}
                                title={c.isActive ? 'Disable Campaign' : 'Enable Campaign'}
                              >
                                {c.isActive ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={() => handleOpenModal(c)}
                                className="p-1.5 text-[#374151] hover:text-[#111111] hover:bg-[#e5e5e5] rounded-lg cursor-pointer transition-colors"
                                title="Edit Campaign"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(c._id)}
                                className="p-1.5 text-[#dc2626] hover:bg-[#fee2e2] rounded-lg cursor-pointer transition-colors"
                                title="Delete Campaign"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CAMPAIGN CREATE/EDIT MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-sans font-bold text-sm uppercase text-[#111111] flex items-center gap-2">
                <Truck size={16} className="text-[#d97706]" />
                {editingCampaignId ? 'Edit Shipping Campaign' : 'Create Free Shipping Campaign'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[#6b7280] hover:text-[#111111] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-4 text-xs font-mono">
              {/* Campaign Name */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#374151] uppercase font-bold block">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Onam Special Free Delivery"
                  className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-sans text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  required
                />
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#374151] uppercase font-bold block">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-2.5 py-2 text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#374151] uppercase font-bold block">End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-2.5 py-2 text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Minimum Order Amount & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#374151] uppercase font-bold block">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for all orders"
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                    value={campaignForm.minOrderAmount}
                    onChange={(e) => setCampaignForm({ ...campaignForm, minOrderAmount: e.target.value })}
                  />
                  <span className="text-[9px] text-[#6b7280]">Set 0 to apply to all checkouts</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#374151] uppercase font-bold block">
                    Priority Score
                  </label>
                  <input
                    type="number"
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                    value={campaignForm.priority}
                    onChange={(e) => setCampaignForm({ ...campaignForm, priority: e.target.value })}
                  />
                  <span className="text-[9px] text-[#6b7280]">Higher priority wins overlap</span>
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCampaign"
                  className="rounded border-[#e5e5e5] text-[#111111] focus:ring-0 cursor-pointer"
                  checked={campaignForm.isActive}
                  onChange={(e) => setCampaignForm({ ...campaignForm, isActive: e.target.checked })}
                />
                <label htmlFor="isActiveCampaign" className="text-xs font-sans font-bold text-[#374151] cursor-pointer">
                  Enable Campaign Immediately
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCampaign}
                  className="bg-[#111111] hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-40"
                >
                  {submittingCampaign ? 'Saving...' : 'Save Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
