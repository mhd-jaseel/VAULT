import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { Check, X, Eye, FileText } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AdminPayments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Full screenshot preview modal states
  const [previewImage, setPreviewImage] = useState('');
  
  // Rejection note states
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/payments?page=${page}&limit=10`);
      if (res.data.success) {
        setPayments(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const handleVerify = async (paymentId) => {
    const result = await PremiumSwal.fire({
      title: 'Approve Payment?',
      text: 'Are you sure you want to verify and approve this manual UPI payment receipt?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.put(`/payments/${paymentId}/verify`, {
        adminNotes: 'Payment verified and approved.',
      });
      if (res.data.success) {
        toast.success('Payment approved successfully.');
        fetchPayments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error approving payment.');
    }
  };

  const handleOpenReject = (paymentId) => {
    setSelectedPaymentId(paymentId);
    setRejectReason('');
    setRejectionModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.warning('Please state a reason for rejection.');
      return;
    }

    setSubmittingReject(true);
    try {
      const res = await axios.put(`/payments/${selectedPaymentId}/reject`, {
        adminNotes: rejectReason,
      });

      if (res.data.success) {
        toast.success('Payment rejected.');
        setRejectionModalOpen(false);
        fetchPayments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error rejecting payment.');
    } finally {
      setSubmittingReject(false);
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-white font-display">
          UPI Payment Verifications
        </h1>
        <p className="text-xs text-gray-500 mt-1">Audit customer-uploaded UPI receipts, cross-reference TXN IDs, and verify invoices.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 shimmer-bg rounded-2xl" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-2xl">
          <p className="text-xs text-zinc-500">No payment screenshots submitted yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-dark-card border border-dark-border rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-dark-border text-zinc-500 uppercase font-display tracking-wider bg-black/40">
                <th className="p-4">Client</th>
                <th className="p-4">Order Value</th>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Screenshot</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4 text-center">Verify Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay._id} className="border-b border-dark-border/40 hover:bg-zinc-900/10">
                  <td className="p-4">
                    <p className="font-semibold text-white">{pay.user?.name}</p>
                    <p className="text-[10px] text-zinc-500">{pay.user?.email}</p>
                  </td>
                  <td className="p-4 text-white font-bold">
                    ₹{pay.order?.grandTotal?.toLocaleString('en-IN') || 'N/A'}
                  </td>
                  <td className="p-4 font-mono text-zinc-300 select-all font-semibold">
                    {pay.transactionId}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setPreviewImage(pay.screenshot)}
                      className="relative w-12 h-12 rounded-lg bg-black border border-dark-border overflow-hidden cursor-pointer hover:border-gold/50 transition-colors group flex items-center justify-center"
                      title="Click to zoom receipt"
                    >
                      <img 
                        src={`http://localhost:5000${pay.screenshot}`} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Eye size={12} />
                      </span>
                    </button>
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      pay.status === 'verified' 
                        ? 'bg-green-950/20 border-green-500/30 text-green-400' 
                        : pay.status === 'rejected'
                        ? 'bg-red-950/20 border-red-500/30 text-red-400' 
                        : 'bg-gold/10 border-gold/30 text-gold animate-pulse'
                    }`}>
                      {pay.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {pay.status === 'pending' ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleVerify(pay._id)}
                          className="py-1.5 px-3 bg-green-700 text-white rounded-lg hover:bg-green-600 cursor-pointer flex items-center gap-1 font-semibold"
                          title="Approve transaction"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenReject(pay._id)}
                          className="py-1.5 px-3 bg-red-700 text-white rounded-lg hover:bg-red-600 cursor-pointer flex items-center gap-1 font-semibold"
                          title="Reject payment"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-500 italic">Audited</span>
                    )}
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

      {/* Screenshot Zoom Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setPreviewImage('')} />
          <div className="relative max-w-2xl max-h-[85vh] z-10">
            <img 
              src={`http://localhost:5000${previewImage}`} 
              alt="Screenshot zoom" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl border border-dark-border"
            />
            <button 
              onClick={() => setPreviewImage('')}
              className="absolute -top-10 right-0 text-white font-semibold text-xs border border-zinc-800 bg-zinc-950/50 py-1.5 px-4 rounded-xl hover:bg-white hover:text-black transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Rejection Note Dialog */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRejectionModalOpen(false)} />

          <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-xl p-6 z-10 text-gray-200">
            <div className="flex items-center justify-between border-b border-dark-border pb-3 mb-4">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white">
                Reject Payment Receipt
              </h3>
              <button onClick={() => setRejectionModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Reason for Rejection</label>
                <textarea
                  placeholder="e.g. Transaction ID mismatch, uploaded blank image..."
                  className="form-input text-xs min-h-[80px]"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingReject}
                className="w-full bg-red-700 hover:bg-red-600 text-white text-xs uppercase tracking-widest py-3 mt-2 rounded-xl transition-colors cursor-pointer"
              >
                {submittingReject ? (
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
