import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Pagination from '../../components/Pagination';
import AdminDetailsDrawer from '../../components/admin/AdminDetailsDrawer';
import PaymentDetailsView from '../../components/admin/drawers/PaymentDetailsView';
import OrderDetailsView from '../../components/admin/drawers/OrderDetailsView';
import CustomerDetailsView from '../../components/admin/drawers/CustomerDetailsView';

export default function AdminPayments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick View Drawer state
  const [drawer, setDrawer] = useState({ isOpen: false, type: null, entityId: null, data: null, title: '' });

  const openDrawer = (type, entityId, title, data = null) => {
    setDrawer({ isOpen: true, type, entityId, title, data });
  };

  const closeDrawer = () => {
    setDrawer({ isOpen: false, type: null, entityId: null, data: null, title: '' });
  };

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

  useEffect(() => { fetchPayments(); }, [page]);

  const statusBadge = (status) => {
    const map = {
      captured: { label: 'CAPTURED', cls: 'bg-green-950/20 border-green-500/30 text-green-400' },
      pending:  { label: 'PENDING',  cls: 'bg-gold/10 border-gold/30 text-gold animate-pulse' },
      failed:   { label: 'FAILED',   cls: 'bg-red-950/20 border-red-500/30 text-red-400' },
      refunded: { label: 'REFUNDED', cls: 'bg-blue-950/20 border-blue-500/30 text-blue-400' },
    };
    const s = map[status] || { label: status?.toUpperCase() || '—', cls: 'bg-zinc-800 text-zinc-400' };
    return (
      <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-white font-display">
          Razorpay Payments
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          View and audit all payment records processed via Razorpay. Verification is automatic — no manual approval required.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 shimmer-bg rounded-2xl" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-2xl">
          <CreditCard size={32} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-xs text-zinc-500">No payment records yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table (md+) */}
          <div className="hidden md:block overflow-x-auto bg-white border border-[#e5e5e5] rounded-2xl shadow-xs font-mono w-full min-w-0">
            <table className="w-full text-left border-collapse text-xs table-auto">
              <thead>
                <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Order Value</th>
                  <th className="p-3.5">Razorpay Order ID</th>
                  <th className="p-3.5">Razorpay Payment ID</th>
                  <th className="p-3.5">Payment Status</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {payments.map((pay) => (
                  <tr key={pay._id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="p-3.5">
                      {pay.user ? (
                        <button 
                          onClick={() => openDrawer('CUSTOMER', pay.user._id, 'Customer Details')}
                          className="text-left cursor-pointer hover:underline focus:outline-none group"
                        >
                          <p className="font-bold text-[#111111] group-hover:text-[#d97706] transition-colors text-xs">{pay.user.name}</p>
                          <p className="text-[10px] text-[#6b7280] font-mono">{pay.user.email}</p>
                        </button>
                      ) : (
                        <span className="text-[#9ca3af] italic">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-[#111111] font-bold font-mono">
                      {pay.order ? (
                        <span
                          onClick={() => openDrawer('ORDER', pay.order._id, 'Order Details')}
                          className="cursor-pointer hover:text-[#d97706] hover:underline transition-colors"
                        >
                          ₹{pay.order.grandTotal?.toLocaleString('en-IN') || '—'}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[#374151] text-[10px]">
                      {pay.razorpayOrderId ? (
                        <button
                          onClick={() => openDrawer('PAYMENT', pay._id, 'Payment Details', pay)}
                          className="cursor-pointer hover:text-[#d97706] hover:underline transition-colors select-all"
                        >
                          {pay.razorpayOrderId}
                        </button>
                      ) : '—'}
                    </td>
                    <td className="p-3.5 font-mono text-[#374151] text-[10px]">
                      {pay.razorpayPaymentId ? (
                        <button
                          onClick={() => openDrawer('PAYMENT', pay._id, 'Payment Details', pay)}
                          className="cursor-pointer hover:text-[#d97706] hover:underline transition-colors select-all"
                        >
                          {pay.razorpayPaymentId}
                        </button>
                      ) : (
                        <span className="text-[#9ca3af] italic">pending</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div 
                        onClick={() => openDrawer('PAYMENT', pay._id, 'Payment Details', pay)}
                        className="cursor-pointer hover:opacity-80 transition-opacity inline-block"
                      >
                        {statusBadge(pay.status)}
                      </div>
                    </td>
                    <td className="p-3.5 text-[#6b7280] text-[10px]">
                      {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (< md) */}
          <div className="md:hidden space-y-4">
            {payments.map((pay) => (
              <div
                key={pay._id}
                className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-xs space-y-3 font-mono text-xs"
              >
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2">
                  <span className="text-[10px] text-[#6b7280] font-bold">
                    {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-IN') : 'PAYMENT'}
                  </span>
                  {statusBadge(pay.status)}
                </div>

                {pay.user && (
                  <div className="space-y-0.5 font-sans">
                    <p className="font-bold text-xs text-[#111111]">{pay.user.name}</p>
                    <p className="text-[10px] text-[#6b7280] font-mono">{pay.user.email}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f3f4f6] text-[11px]">
                  <div>
                    <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Order Value</span>
                    <span className="font-bold text-[#111111]">
                      {pay.order ? `₹${pay.order.grandTotal?.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Status</span>
                    <span className="font-bold text-[#111111]">{pay.status}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#f3f4f6] text-[10px]">
                  {pay.razorpayOrderId && (
                    <div>
                      <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Razorpay Order ID</span>
                      <span className="font-mono text-[#111111] break-all select-all">{pay.razorpayOrderId}</span>
                    </div>
                  )}
                  {pay.razorpayPaymentId && (
                    <div>
                      <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Razorpay Payment ID</span>
                      <span className="font-mono text-[#111111] break-all select-all">{pay.razorpayPaymentId}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#e5e5e5] flex items-center justify-end gap-2">
                  <button
                    onClick={() => openDrawer('PAYMENT', pay._id, 'Payment Details', pay)}
                    className="px-3 py-1.5 bg-[#f9fafb] hover:bg-[#f3f4f6] text-[#111111] border border-[#e5e5e5] rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Quick View
                  </button>
                  {pay.order && (
                    <button
                      onClick={() => openDrawer('ORDER', pay.order._id, 'Order Details')}
                      className="px-3 py-1.5 btn-gold rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                    >
                      View Order
                    </button>
                  )}
                </div>
              </div>
            ))}
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

      {/* REUSABLE DETAILS DRAWER */}
      <AdminDetailsDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        title={drawer.title}
        subtitle="Quick View"
      >
        {drawer.isOpen && drawer.type === 'PAYMENT' && <PaymentDetailsView payment={drawer.data} />}
        {drawer.isOpen && drawer.type === 'ORDER' && <OrderDetailsView orderId={drawer.entityId} />}
        {drawer.isOpen && drawer.type === 'CUSTOMER' && <CustomerDetailsView customerId={drawer.entityId} />}
      </AdminDetailsDrawer>
    </div>
  );
}
