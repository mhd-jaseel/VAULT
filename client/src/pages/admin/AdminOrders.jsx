import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Eye, Edit3, X } from 'lucide-react';
import Pagination from '../../components/Pagination';

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
    setNewStatus(ord.status);
    setTimelineNote('');
    setIsOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await axios.put(`/orders/${selectedOrder._id}/status`, {
        status: newStatus,
        note: timelineNote,
      });

      if (res.data.success) {
        toast.success('Order status updated successfully.');
        setIsOpen(false);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating order status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-white font-display">
          Manage Orders
        </h1>
        <p className="text-xs text-gray-500 mt-1">Review checkout timeline, dispatch packages, and adjust states.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 shimmer-bg rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-2xl">
          <p className="text-xs text-zinc-500">No checkout orders registered yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-dark-card border border-dark-border rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-dark-border text-zinc-500 uppercase font-display tracking-wider bg-black/40">
                <th className="p-4">Order ID</th>
                <th className="p-4">Client Name</th>
                <th className="p-4">Items Qty</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Shipping Status</th>
                <th className="p-4 text-center">Edit Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord._id} className="border-b border-dark-border/40 hover:bg-zinc-900/10">
                  <td className="p-4 font-mono font-bold text-zinc-300">
                    #{ord._id.toString().slice(-6).toUpperCase()}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-white">{ord.user?.name || ord.shippingAddress.name}</p>
                    <p className="text-[10px] text-zinc-500">{ord.user?.email || 'N/A'}</p>
                  </td>
                  <td className="p-4 text-zinc-400">
                    {ord.items.reduce((sum, i) => sum + i.quantity, 0)} units
                  </td>
                  <td className="p-4 text-white font-bold">
                    ₹{ord.grandTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-zinc-400 uppercase font-medium">
                    {ord.paymentMethod}
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      ord.paymentStatus === 'verified' 
                        ? 'bg-green-950/20 border-green-500/30 text-green-400' 
                        : ord.paymentStatus === 'rejected'
                        ? 'bg-red-950/20 border-red-500/30 text-red-400' 
                        : 'bg-zinc-800 border-zinc-700 text-gray-400'
                    }`}>
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      ord.status === 'delivered' 
                        ? 'bg-green-950/20 border-green-500/30 text-green-400' 
                        : ord.status === 'cancelled' 
                        ? 'bg-red-950/20 border-red-500/30 text-red-400' 
                        : 'bg-gold/10 border-gold/30 text-gold'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleOpenStatusModal(ord)}
                      className="p-2 border border-zinc-800 rounded-lg text-gray-400 hover:text-gold hover:border-gold/30 cursor-pointer inline-flex items-center gap-1 text-[10px]"
                    >
                      <Edit3 size={11} /> Update
                    </button>
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

      {/* Editor Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-xl p-6 z-10 text-gray-200">
            <div className="flex items-center justify-between border-b border-dark-border pb-3 mb-4">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white">
                Modify Order Pipeline Status
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Shipping Milestone</label>
                <select
                  className="form-input text-xs cursor-pointer !py-2.5"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Timeline Note</label>
                <input
                  type="text"
                  placeholder="e.g. Package dispatched via Bluedart. Tracking ID: ..."
                  className="form-input text-xs"
                  value={timelineNote}
                  onChange={(e) => setTimelineNote(e.target.value)}
                />
                <span className="text-[9px] text-zinc-500 block mt-1">This message will be visible to the customer.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-gold text-xs uppercase tracking-widest py-3 mt-2"
              >
                {submitting ? (
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                ) : (
                  'Update Status'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
