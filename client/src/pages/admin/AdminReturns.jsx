import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  RotateCcw,
  Eye,
  X,
  Check,
  FileText,
  User,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Package,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import AdminDetailsDrawer from '../../components/admin/AdminDetailsDrawer';
import ReturnDetailsView from '../../components/admin/drawers/ReturnDetailsView';

export default function AdminReturns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const statusFilter = searchParams.get('status') || '';
  const [pages, setPages] = useState(1);

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick View Drawer state
  const [drawer, setDrawer] = useState({ isOpen: false, entityId: null });

  const closeDrawer = () => {
    setDrawer({ isOpen: false, entityId: null });
  };

  // Status Action Modal States
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      let url = `/returns/admin/all?page=${page}&limit=10`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await axios.get(url);
      if (res.data.success) {
        setReturns(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to load returns list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page, statusFilter]);

  // Open Return Details Drawer
  const handleOpenDetailModal = (ret) => {
    setDrawer({ isOpen: true, entityId: ret._id });
  };

  // Open Status Update Modal
  const handleOpenStatusModal = (ret, newStat) => {
    setSelectedReturn(ret);
    setTargetStatus(newStat);
    setStatusNote('');
    setRejectionReason('');
    setStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setSubmittingStatus(true);
    try {
      const res = await axios.patch(`/returns/admin/${selectedReturn._id}/status`, {
        status: targetStatus,
        note: statusNote,
        rejectionReason: targetStatus === 'REJECTED' ? rejectionReason : undefined,
      });

      if (res.data.success) {
        toast.success(`Return status updated to ${targetStatus}`);
        setStatusModalOpen(false);
        // We do not need to manually update viewingReturn because the drawer component re-fetches or we could just close the drawer or trigger a refresh in the drawer if needed, but for now just fetching returns updates the table.
        // Or if we want to immediately reflect, we could pass a refresh flag, but React Query is best for that.
        // For now, close drawer when status changes, or let the user close it. 
        // We'll close the drawer to force them back to the updated list.
        closeDrawer();
        fetchReturns();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-[#f3f4f6] text-[#374151] border-[#e5e5e5] font-bold';
      case 'APPROVED':
      case 'REPLACEMENT_APPROVED':
        return 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe] font-bold';
      case 'REPLACEMENT_SHIPPED':
        return 'bg-[#e0e7ff] text-[#4f46e5] border-[#c7d2fe] font-bold';
      case 'WALLET_CREDITED':
        return 'bg-[#faf5ff] text-[#9333ea] border-[#e9d5ff] font-bold';
      case 'COMPLETED':
        return 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0] font-bold';
      case 'REJECTED':
        return 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca] font-bold';
      default:
        return 'bg-[#f3f4f6] text-[#374151] border-[#e5e5e5]';
    }
  };

  // Client-side search filtering
  const filteredReturns = returns.filter((ret) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      ret.returnId?.toLowerCase().includes(q) ||
      ret.user?.name?.toLowerCase().includes(q) ||
      ret.user?.email?.toLowerCase().includes(q) ||
      (ret.order?._id && ret.order._id.toLowerCase().includes(q)) ||
      (typeof ret.order === 'string' && ret.order.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans text-[#111111] min-w-0">
      {/* Header */}
      <div className="pb-4 border-b border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
            RETURNS &amp; CANCELLATIONS
          </h1>
          <p className="text-xs text-[#6b7280] font-mono mt-1">
            Review return &amp; cancellation requests, process manual refunds, and credit Vault Wallet balances.
          </p>
        </div>

        <button
          onClick={fetchReturns}
          className="self-start sm:self-auto text-xs font-mono font-bold uppercase tracking-wider text-[#374151] hover:text-[#111111] bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw size={13} /> Refresh List
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 font-mono">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
          {[
            { label: 'ALL', value: '' },
            { label: 'REQUESTED', value: 'REQUESTED' },
            { label: 'APPROVED', value: 'APPROVED' },
            { label: 'REP APPROVED', value: 'REPLACEMENT_APPROVED' },
            { label: 'REP SHIPPED', value: 'REPLACEMENT_SHIPPED' },
            { label: 'WALLET CREDITED', value: 'WALLET_CREDITED' },
            { label: 'COMPLETED', value: 'COMPLETED' },
            { label: 'REJECTED', value: 'REJECTED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSearchParams(tab.value ? { status: tab.value } : {})}
              className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                  : 'bg-white border-[#e5e5e5] text-[#6b7280] hover:text-[#111111]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full lg:w-72">
          <input
            type="text"
            placeholder="Search return ID, customer, order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#e5e5e5] rounded-xl py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-[#111111]"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-[#9ca3af]" />
        </div>
      </div>

      {/* Returns Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#6b7280] flex flex-col items-center justify-center font-mono">
          <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-2" />
          Loading return requests...
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#e5e5e5] rounded-2xl font-mono">
          <RotateCcw size={32} className="mx-auto mb-2 text-[#9ca3af]" />
          <p className="text-xs font-bold text-[#111111] mb-1">No return requests found.</p>
          <p className="text-[11px] text-[#6b7280]">Return requests will appear here when customers submit them.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-[#e5e5e5] rounded-2xl shadow-xs font-mono w-full min-w-0">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                <th className="p-3">Return ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Product</th>
                <th className="p-3">Settlement</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {filteredReturns.map((ret) => {
                return (
                  <tr key={ret._id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="p-3 font-bold text-[#111111]">
                      <button 
                        onClick={() => handleOpenDetailModal(ret)}
                        className="hover:text-[#d97706] hover:underline cursor-pointer transition-colors flex items-center gap-1 text-left select-all"
                      >
                        {ret.returnId}
                      </button>
                    </td>
                    <td className="p-3 max-w-[160px] font-sans">
                      <div
                        onClick={() => handleOpenDetailModal(ret)}
                        className="cursor-pointer hover:bg-[#f3f4f6] px-1.5 py-1 -ml-1.5 rounded transition-colors inline-block"
                      >
                        <p className="font-bold text-[#111111] text-xs truncate" title={ret.user?.name || 'Customer'}>
                          {ret.user?.name || 'Customer'}
                        </p>
                        <p className="text-[10px] text-[#6b7280] font-mono truncate" title={ret.user?.email || '—'}>
                          {ret.user?.email || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 max-w-[180px] font-sans text-xs">
                      <div
                        onClick={() => handleOpenDetailModal(ret)}
                        className="cursor-pointer hover:bg-[#f3f4f6] px-1.5 py-1 -ml-1.5 rounded transition-colors inline-block"
                      >
                        <p className="font-medium text-[#111111] truncate" title={ret.orderItem?.name}>
                          {ret.orderItem?.name}
                        </p>
                        <span className="text-[#6b7280] font-mono text-[10px]">Qty: {ret.orderItem?.quantity}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span 
                        onClick={() => handleOpenDetailModal(ret)}
                        className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                          ret.returnType === 'REPLACEMENT' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-[#f3f4f6] text-[#374151] border-[#e5e5e5]'
                        }`}
                      >
                        {ret.returnType === 'REPLACEMENT' ? 'REPLACEMENT' : 'VAULT WALLET'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#111111]">
                      <span
                        onClick={() => handleOpenDetailModal(ret)}
                        className="cursor-pointer hover:text-[#d97706] hover:underline decoration-dashed transition-colors"
                      >
                        ₹{ret.orderItem?.totalOriginalPaid?.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span 
                        onClick={() => handleOpenDetailModal(ret)}
                        className={`text-[8px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${getStatusBadgeStyle(ret.status)}`}
                      >
                        {ret.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-[#9ca3af] italic text-[10px]"></span>
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

      {/* REUSABLE DETAILS DRAWER */}
      <AdminDetailsDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        title="Return Details"
        subtitle="Quick View"
      >
        {drawer.isOpen && (
          <ReturnDetailsView 
            returnId={drawer.entityId} 
            onActionStatus={handleOpenStatusModal}
          />
        )}
      </AdminDetailsDrawer>

      {/* STATUS ACTION MODAL */}
      {statusModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-sans font-bold text-sm uppercase text-[#111111]">
                Update Return Status
              </h3>
              <button onClick={() => setStatusModalOpen(false)} className="text-[#6b7280] hover:text-[#111111]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">Target Status</label>
                <div className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] uppercase">
                  {targetStatus}
                </div>
              </div>

              {targetStatus === 'REJECTED' && (
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">Rejection Reason</label>
                  <textarea
                    rows={2}
                    placeholder="Provide reason for rejection..."
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#111111]"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">Audit Note</label>
                <input
                  type="text"
                  placeholder="Optional admin note..."
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#111111]"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="bg-[#111111] hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                >
                  {submittingStatus ? 'Saving...' : 'Confirm Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
