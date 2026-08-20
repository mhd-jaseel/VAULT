import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  RotateCcw,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
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

  // Return Management Drawer state
  const [drawer, setDrawer] = useState({ isOpen: false, entityId: null });

  const closeDrawer = () => {
    setDrawer({ isOpen: false, entityId: null });
  };

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

  // Open Return Management Drawer
  const handleOpenDetailModal = (ret) => {
    setDrawer({ isOpen: true, entityId: ret._id });
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-[#f3f4f6] text-[#374151] border-[#e5e5e5] font-bold';
      case 'APPROVED':
      case 'REPLACEMENT_APPROVED':
        return 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe] font-bold';
      case 'ITEM_SHIPPED':
        return 'bg-[#fefce8] text-[#ca8a04] border-[#fef08a] font-bold';
      case 'PRODUCT_RECEIVED':
        return 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0] font-bold';
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
            Manage return workflows, verify warehouse receipts, execute wallet refunds, and dispatch replacements.
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
            { label: 'ITEM SHIPPED', value: 'ITEM_SHIPPED' },
            { label: 'RECEIVED', value: 'PRODUCT_RECEIVED' },
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
        <>
          {/* Desktop Table View (md+) */}
          <div className="hidden md:block overflow-x-auto bg-white border border-[#e5e5e5] rounded-2xl shadow-xs font-mono w-full min-w-0">
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
                        <button
                          onClick={() => handleOpenDetailModal(ret)}
                          className="px-3 py-1 bg-[#111111] hover:bg-black text-white rounded-lg cursor-pointer inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase shadow-xs transition-all"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< md) */}
          <div className="md:hidden space-y-4">
            {filteredReturns.map((ret) => {
              return (
                <div
                  key={ret._id}
                  className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-xs space-y-3 font-mono text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2">
                    <button
                      onClick={() => handleOpenDetailModal(ret)}
                      className="font-bold text-sm text-[#111111] hover:text-[#d97706] cursor-pointer select-all"
                    >
                      {ret.returnId}
                    </button>
                    <span
                      className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(ret.status)}`}
                    >
                      {ret.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="space-y-1 font-sans">
                    <p className="font-bold text-xs text-[#111111]">{ret.user?.name || 'Customer'}</p>
                    <p className="text-[10px] text-[#6b7280] font-mono">{ret.user?.email || '—'}</p>
                  </div>

                  <div className="pt-2 border-t border-[#f3f4f6] text-xs font-sans">
                    <p className="font-medium text-[#111111] truncate">{ret.orderItem?.name}</p>
                    <span className="text-[#6b7280] font-mono text-[10px]">Qty: {ret.orderItem?.quantity}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f3f4f6] text-[11px]">
                    <div>
                      <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Settlement</span>
                      <span
                        className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border inline-block mt-0.5 ${
                          ret.returnType === 'REPLACEMENT' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-[#f3f4f6] text-[#374151] border-[#e5e5e5]'
                        }`}
                      >
                        {ret.returnType === 'REPLACEMENT' ? 'REPLACEMENT' : 'VAULT WALLET'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Refund Amount</span>
                      <span className="font-bold text-[#111111]">₹{ret.orderItem?.totalOriginalPaid?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#e5e5e5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenDetailModal(ret)}
                      className="w-full py-2 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer text-center shadow-xs transition-all"
                    >
                      Manage Return
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        onPageChange={(newPage) => setSearchParams({ page: newPage })}
        loading={loading}
      />

      {/* REUSABLE DETAILS & RETURN MANAGEMENT DRAWER */}
      <AdminDetailsDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        title="Return Management"
        subtitle="Review and process return workflow"
      >
        {drawer.isOpen && (
          <ReturnDetailsView 
            returnId={drawer.entityId} 
            onStatusUpdated={() => {
              fetchReturns();
            }}
          />
        )}
      </AdminDetailsDrawer>

    </div>
  );
}
