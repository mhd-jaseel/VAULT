import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Eye, Edit3, X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import Pagination from '../../components/Pagination';
import AdminDetailsDrawer from '../../components/admin/AdminDetailsDrawer';
import OrderDetailsView from '../../components/admin/drawers/OrderDetailsView';

// Allowed forward transitions
const ALLOWED_NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Allowed backward corrections
const ALLOWED_CORRECTION_TARGETS = {
  delivered: ['shipped', 'packed', 'confirmed'],
  shipped: ['packed', 'confirmed'],
  packed: ['confirmed'],
  confirmed: ['pending'],
  cancelled: [],
  pending: [],
};

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status edit modal states
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [timelineNote, setTimelineNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status Correction modal states
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correcting, setCorrecting] = useState(false);

  // Quick View Drawer state
  const [drawer, setDrawer] = useState({ isOpen: false, type: null, entityId: null, title: '' });

  const openDrawer = (type, entityId, title) => {
    setDrawer({ isOpen: true, type, entityId, title });
  };

  const closeDrawer = () => {
    setDrawer({ isOpen: false, type: null, entityId: null, title: '' });
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/orders?page=${page}&limit=10`);
      if (res.data.success) {
        setOrders(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleOpenStatusModal = (ord) => {
    setSelectedOrder(ord);
    const validOptions = ALLOWED_NEXT_STATUSES[ord.status] || [];
    setNewStatus(validOptions.length > 0 ? validOptions[0] : '');
    setTimelineNote('');
    setIsOpen(true);
  };

  const handleOpenCorrectionModal = (ord) => {
    setSelectedOrder(ord);
    const validCorrections = ALLOWED_CORRECTION_TARGETS[ord.status] || [];
    setCorrectionTarget(validCorrections.length > 0 ? validCorrections[0] : '');
    setCorrectionReason('');
    setIsCorrectionOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) {
      toast.error('Please select a valid next status.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.put(`/orders/${selectedOrder._id}/status`, {
        status: newStatus,
        note: timelineNote,
      });

      if (res.data.success) {
        toast.success(`Order status updated to ${newStatus.toUpperCase()} successfully.`);
        setIsOpen(false);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating order status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionReason || correctionReason.trim().length < 5) {
      toast.error('Please provide a reason (at least 5 characters) for this status correction.');
      return;
    }

    setCorrecting(true);
    try {
      const res = await axios.put(`/orders/${selectedOrder._id}/correct`, {
        targetStatus: correctionTarget,
        reason: correctionReason,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Order status corrected successfully.');
        setIsCorrectionOpen(false);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error executing status correction.');
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans text-[#111111] min-w-0">
      {/* Title */}
      <div className="pb-4 border-b border-[#e5e5e5]">
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
          Manage Orders
        </h1>
        <p className="text-xs text-[#6b7280] font-mono mt-1">
          Review checkout timeline, dispatch packages, and adjust status milestones.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#6b7280] flex flex-col items-center justify-center font-mono">
          <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-2" />
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#e5e5e5] rounded-2xl font-mono">
          <p className="text-xs text-[#6b7280]">No checkout orders registered yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-[#e5e5e5] rounded-2xl shadow-xs font-mono w-full min-w-0">
          <table className="w-full text-left border-collapse text-xs table-auto">
            <thead>
              <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-center">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Payment ID</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {orders.map((ord) => {
                const nextOptions = ALLOWED_NEXT_STATUSES[ord.status] || [];
                const correctionOptions = ALLOWED_CORRECTION_TARGETS[ord.status] || [];
                const isTerminal = nextOptions.length === 0;

                return (
                  <tr key={ord._id} className="hover:bg-[#f9fafb] transition-colors group">
                    <td className="p-3 font-bold text-[#111111]">
                      <button 
                        onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                        className="hover:text-[#d97706] hover:underline cursor-pointer transition-colors flex items-center gap-1 text-left"
                      >
                        #{ord._id.toString().slice(-6).toUpperCase()}
                      </button>
                    </td>
                    <td className="p-3 max-w-[160px] font-sans">
                      <div
                        onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                        className="cursor-pointer hover:bg-[#f3f4f6] px-1.5 py-1 -ml-1.5 rounded transition-colors inline-block"
                      >
                        <p className="font-bold text-[#111111] text-xs truncate" title={ord.user?.name || ord.shippingAddress.name}>
                          {ord.user?.name || ord.shippingAddress.name}
                        </p>
                        <p className="text-[10px] text-[#6b7280] font-mono truncate" title={ord.user?.email || 'N/A'}>
                          {ord.user?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-center text-[#374151]">
                      <span
                        onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                        className="cursor-pointer hover:text-[#d97706] hover:underline decoration-dashed transition-colors"
                      >
                        {ord.items.reduce((sum, i) => sum + i.quantity, 0)} units
                      </span>
                    </td>
                    <td className="p-3 text-[#111111] font-bold">
                      <span
                        onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                        className="cursor-pointer hover:text-[#d97706] hover:underline decoration-dashed transition-colors"
                      >
                        ₹{ord.grandTotal.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                        className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                          ord.paymentStatus === 'captured'
                            ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                            : ord.paymentStatus === 'failed'
                            ? 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                            : ord.paymentStatus === 'authorized'
                            ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#2563eb]'
                            : ord.paymentStatus === 'refunded'
                            ? 'bg-[#faf5ff] border-[#e9d5ff] text-[#9333ea]'
                            : 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 max-w-[130px]">
                      {ord.razorpayPaymentId ? (
                        <span
                          onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                          className="font-mono text-[10px] text-[#374151] truncate block max-w-[120px] cursor-pointer hover:text-[#d97706] hover:underline transition-colors"
                          title={ord.razorpayPaymentId}
                        >
                          {ord.razorpayPaymentId.slice(0, 10)}...
                        </span>
                      ) : (
                        <span className="text-[#9ca3af] italic">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                        className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                          ord.status === 'delivered'
                            ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                            : ord.status === 'cancelled'
                            ? 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                            : 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">

                        {!isTerminal ? (
                          <button
                            onClick={() => handleOpenStatusModal(ord)}
                            className="px-2.5 py-1 bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] rounded-lg text-[#111111] cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold uppercase shadow-xs"
                          >
                            <Edit3 size={11} /> Update
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#9ca3af] italic">Terminal</span>
                        )}

                        {correctionOptions.length > 0 && (
                          <button
                            onClick={() => handleOpenCorrectionModal(ord)}
                            className="px-2.5 py-1 bg-[#fffbeb] border border-[#fde68a] hover:bg-[#fef3c7] rounded-lg text-[#d97706] cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold uppercase transition-all"
                            title="Correct Status (Audit Logged)"
                          >
                            <ShieldAlert size={11} /> Correct
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        onPageChange={(newPage) => setSearchParams({ page: newPage })}
        loading={loading}
      />

      {/* Standard Status Editor Modal Overlay */}
      {isOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-sans font-bold text-sm uppercase text-[#111111]">
                Update Order Status
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-[#6b7280] hover:text-[#111111] cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5] text-xs">
              <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-0.5">Current Status</span>
              <span className="font-mono font-extrabold text-[#111111] uppercase text-sm">{selectedOrder.status}</span>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-[#374151] uppercase font-bold block mb-1">
                  Allowed Next Status
                </label>
                {ALLOWED_NEXT_STATUSES[selectedOrder.status]?.length > 0 ? (
                  <select
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer uppercase"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {ALLOWED_NEXT_STATUSES[selectedOrder.status].map((st) => (
                      <option key={st} value={st}>
                        {st.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-[#d97706] bg-[#fffbeb] p-2.5 rounded-xl border border-[#fde68a] font-bold">
                    Order is in a terminal status ({selectedOrder.status.toUpperCase()}). Normal updates disabled.
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] text-[#374151] uppercase font-bold block mb-1">Timeline Note</label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched package via logistics..."
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111] placeholder-[#6b7280] focus:outline-none focus:border-[#111111]"
                  value={timelineNote}
                  onChange={(e) => setTimelineNote(e.target.value)}
                />
                <span className="text-[10px] text-[#6b7280] block mt-1">Visible to customer on tracking page.</span>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || ALLOWED_NEXT_STATUSES[selectedOrder.status]?.length === 0}
                  className="bg-[#111111] hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all disabled:opacity-40 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS CORRECTION MODAL OVERLAY */}
      {isCorrectionOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            {/* Title Header */}
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-sans font-bold text-sm uppercase text-[#111111] flex items-center gap-2">
                <ShieldAlert size={16} className="text-[#d97706]" /> Status Correction (Audit Logged)
              </h3>
              <button onClick={() => setIsCorrectionOpen(false)} className="text-[#6b7280] hover:text-[#111111] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Information Box */}
            <div className="bg-[#fffbeb] border border-[#fde68a] p-3.5 rounded-xl space-y-1">
              <p className="font-sans font-bold text-xs text-[#92400e]">Status Correction Feature</p>
              <p className="font-sans text-xs text-[#78350f] leading-relaxed">
                Use this option to fix accidental status updates (e.g. delivered by mistake). All corrections require an audit reason.
              </p>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs font-mono">
              {/* Current Status Label & Value */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#374151] uppercase font-bold block">Current Status</label>
                <div className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-sm font-extrabold text-[#111111] uppercase">
                  {selectedOrder.status}
                </div>
              </div>

              {/* Correct Target Status */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#374151] uppercase font-bold block">
                  Correct Target Status
                </label>
                <select
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] uppercase focus:outline-none focus:border-[#111111] cursor-pointer"
                  value={correctionTarget}
                  onChange={(e) => setCorrectionTarget(e.target.value)}
                >
                  {ALLOWED_CORRECTION_TARGETS[selectedOrder.status]?.map((st) => (
                    <option key={st} value={st}>
                      {st.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Correction Reason */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#374151] uppercase font-bold block">
                  Correction Reason (Required)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Order was accidentally marked as delivered."
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-sans text-[#111111] placeholder-[#4b5563] focus:outline-none focus:border-[#111111] leading-relaxed"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setIsCorrectionOpen(false)}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correcting}
                  className="bg-[#d97706] hover:bg-[#b45309] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-40"
                >
                  {correcting ? 'Saving Correction...' : 'Confirm Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REUSABLE DETAILS DRAWER */}
      <AdminDetailsDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        title={drawer.title}
        subtitle="Quick View"
      >
        {drawer.type === 'ORDER' && <OrderDetailsView orderId={drawer.entityId} />}
      </AdminDetailsDrawer>
    </div>
  );
}
