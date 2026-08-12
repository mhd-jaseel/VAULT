import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { RotateCcw, Check, X, Eye, DollarSign, Package, Truck, FileText } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AdminReturns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const statusFilter = searchParams.get('status') || '';
  const [pages, setPages] = useState(1);

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Action Modal States
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Manual Refund Form Modal States
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('UPI');
  const [refundTxnId, setRefundTxnId] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [refundProofFile, setRefundProofFile] = useState(null);
  const [submittingRefund, setSubmittingRefund] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page, statusFilter]);

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
    try {
      const res = await axios.patch(`/returns/admin/${selectedReturn._id}/status`, {
        status: targetStatus,
        note: statusNote,
        rejectionReason: targetStatus === 'REJECTED' ? rejectionReason : undefined,
      });

      if (res.data.success) {
        toast.success(`Return status updated to ${targetStatus}`);
        setStatusModalOpen(false);
        fetchReturns();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  };

  // Open Manual Refund Dialog
  const handleOpenRefundModal = (ret) => {
    setSelectedReturn(ret);
    setRefundAmount(ret.orderItem.totalOriginalPaid);
    setRefundMethod('UPI');
    setRefundTxnId('');
    setRefundNotes('');
    setRefundProofFile(null);
    setRefundModalOpen(true);
  };

  const handleManualRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundTxnId.trim()) {
      toast.warning('Transaction Reference ID is required for manual refund.');
      return;
    }

    setSubmittingRefund(true);
    try {
      const formData = new FormData();
      formData.append('amount', refundAmount);
      formData.append('method', refundMethod);
      formData.append('transactionId', refundTxnId);
      formData.append('adminNotes', refundNotes);
      if (refundProofFile) formData.append('proofImage', refundProofFile);

      const res = await axios.patch(`/returns/admin/${selectedReturn._id}/refund`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Manual refund audit recorded. Return completed.');
        setRefundModalOpen(false);
        fetchReturns();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record manual refund.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  // Process Replacement Ship
  const handleShipReplacement = async (ret) => {
    const result = await PremiumSwal.fire({
      title: 'Ship Replacement?',
      text: `Confirm shipment of ${ret.replacementProductName}? Stock will be reserved/deducted.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark Shipped',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.patch(`/returns/admin/${ret._id}/replacement-ship`, {
        trackingNote: 'Replacement item dispatched via courier.',
      });

      if (res.data.success) {
        toast.success('Replacement item marked as shipped!');
        fetchReturns();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing replacement dispatch.');
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Page Title & Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-white font-display">
          Returns &amp; Refunds Management
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Review customer return/replacement requests, record manual refunds, and manage replacement dispatches.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: 'ALL', value: '' },
          { label: 'REQUESTED', value: 'REQUESTED' },
          { label: 'APPROVED', value: 'APPROVED' },
          { label: 'RECEIVED', value: 'RECEIVED' },
          { label: 'INSPECTING', value: 'INSPECTING' },
          { label: 'REFUND PROCESSING', value: 'REFUND_PROCESSING' },
          { label: 'REPLACEMENT PROCESSING', value: 'REPLACEMENT_PROCESSING' },
          { label: 'COMPLETED', value: 'COMPLETED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSearchParams(tab.value ? { status: tab.value } : {})}
            className={`text-[9px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-white text-black border-white'
                : 'bg-dark-card border-dark-border text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 shimmer-bg rounded-2xl" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-2xl">
          <RotateCcw size={32} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-xs text-zinc-500 font-mono">No return requests found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-dark-card border border-dark-border rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-dark-border text-zinc-500 uppercase font-display tracking-wider bg-black/40">
                <th className="p-4">Return ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Item &amp; Type</th>
                <th className="p-4">Original Paid</th>
                <th className="p-4">Replacement / Diff</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret) => (
                <tr key={ret._id} className="border-b border-dark-border/40 hover:bg-zinc-900/10 font-mono">
                  <td className="p-4 font-bold text-white select-all">{ret.returnId}</td>
                  <td className="p-4">
                    <p className="font-semibold text-white">{ret.user?.name || '—'}</p>
                    <p className="text-[10px] text-zinc-500">{ret.user?.email || '—'}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-white font-sans text-xs">{ret.orderItem.name}</p>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 inline-block mt-0.5">
                      {ret.returnType}
                    </span>
                  </td>
                  <td className="p-4 text-white font-bold">
                    ₹{ret.orderItem.totalOriginalPaid.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-zinc-300 text-[10px]">
                    {ret.returnType === 'replacement' ? (
                      <>
                        <p className="text-white font-semibold font-sans">{ret.replacementProductName || '—'}</p>
                        <p className={ret.additionalAmount > 0 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                          Diff: +₹{ret.additionalAmount.toLocaleString('en-IN')} ({ret.replacementPaymentStatus})
                        </p>
                      </>
                    ) : (
                      <span className="text-zinc-600 italic">N/A (Refund)</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      ret.status === 'REFUNDED' || ret.status === 'COMPLETED'
                        ? 'bg-green-950/20 border-green-500/30 text-green-400'
                        : ret.status === 'REJECTED'
                        ? 'bg-red-950/20 border-red-500/30 text-red-400'
                        : 'bg-gold/10 border-gold/30 text-gold'
                    }`}>
                      {ret.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      {/* Workflow state actions */}
                      {ret.status === 'REQUESTED' && (
                        <>
                          <button
                            onClick={() => handleOpenStatusModal(ret, 'APPROVED')}
                            className="py-1 px-2.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-[9px] font-bold uppercase"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenStatusModal(ret, 'REJECTED')}
                            className="py-1 px-2.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-[9px] font-bold uppercase"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {ret.status === 'APPROVED' && (
                        <button
                          onClick={() => handleOpenStatusModal(ret, 'RECEIVED')}
                          className="py-1 px-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-[9px] font-bold uppercase"
                        >
                          Mark Received
                        </button>
                      )}

                      {ret.status === 'RECEIVED' && (
                        <button
                          onClick={() => handleOpenStatusModal(ret, 'INSPECTING')}
                          className="py-1 px-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-[9px] font-bold uppercase"
                        >
                          Inspect
                        </button>
                      )}

                      {ret.status === 'INSPECTING' && (
                        <button
                          onClick={() =>
                            handleOpenStatusModal(
                              ret,
                              ret.returnType === 'refund' ? 'REFUND_PROCESSING' : 'REPLACEMENT_PROCESSING'
                            )
                          }
                          className="py-1 px-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase"
                        >
                          Start {ret.returnType}
                        </button>
                      )}

                      {ret.status === 'REFUND_PROCESSING' && (
                        <button
                          onClick={() => handleOpenRefundModal(ret)}
                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase flex items-center gap-1"
                        >
                          <DollarSign size={10} /> Record Refund
                        </button>
                      )}

                      {ret.status === 'REPLACEMENT_PROCESSING' && (
                        <button
                          onClick={() => handleShipReplacement(ret)}
                          className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-bold uppercase flex items-center gap-1"
                        >
                          <Truck size={10} /> Mark Shipped
                        </button>
                      )}

                      {ret.status === 'REPLACEMENT_SHIPPED' && (
                        <button
                          onClick={() => handleOpenStatusModal(ret, 'COMPLETED')}
                          className="py-1 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-bold uppercase"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Status Transition Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setStatusModalOpen(false)} />
          <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 z-10 text-gray-200">
            <h3 className="font-display font-semibold text-sm uppercase text-white border-b border-dark-border pb-3 mb-4">
              Update Return Status → {targetStatus}
            </h3>
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              {targetStatus === 'REJECTED' && (
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Rejection Reason</label>
                  <textarea
                    className="form-input text-xs min-h-[60px]"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Status Note (Optional)</label>
                <textarea
                  className="form-input text-xs min-h-[60px]"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-white text-black text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-zinc-200 cursor-pointer">
                Confirm Update
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Refund Entry Dialog */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRefundModalOpen(false)} />
          <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 z-10 text-gray-200">
            <h3 className="font-display font-semibold text-sm uppercase text-white border-b border-dark-border pb-3 mb-4">
              Record Manual Refund Details
            </h3>

            <form onSubmit={handleManualRefundSubmit} className="space-y-4 font-mono">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  className="form-input text-xs font-bold"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Refund Method</label>
                <select
                  className="form-input text-xs"
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Transaction / Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. UTR / Bank Ref No"
                  className="form-input text-xs"
                  value={refundTxnId}
                  onChange={(e) => setRefundTxnId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Admin Notes (Optional)</label>
                <textarea
                  placeholder="Refund notes..."
                  className="form-input text-xs min-h-[50px]"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Proof Screenshot (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs text-zinc-400"
                  onChange={(e) => setRefundProofFile(e.target.files[0])}
                />
              </div>

              <button
                type="submit"
                disabled={submittingRefund}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl cursor-pointer"
              >
                {submittingRefund ? 'Processing...' : 'Complete & Mark Refunded'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
