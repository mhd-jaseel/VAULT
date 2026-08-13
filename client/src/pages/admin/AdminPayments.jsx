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
        <div className="overflow-x-auto bg-dark-card border border-dark-border rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-dark-border text-zinc-500 uppercase font-display tracking-wider bg-black/40">
                <th className="p-4">Customer</th>
                <th className="p-4">Order Value</th>
                <th className="p-4">Razorpay Order ID</th>
                <th className="p-4">Razorpay Payment ID</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay._id} className="border-b border-dark-border/40 hover:bg-zinc-900/10 transition-colors">
                  <td className="p-4">
                    {pay.user ? (
                      <button 
                        onClick={() => openDrawer('CUSTOMER', pay.user._id, 'Customer Details')}
                        className="text-left cursor-pointer hover:underline focus:outline-none group"
                      >
                        <p className="font-semibold text-white group-hover:text-gold transition-colors">{pay.user.name}</p>
                        <p className="text-[10px] text-zinc-500">{pay.user.email}</p>
                      </button>
                    ) : (
                      <span className="text-zinc-500 italic">—</span>
                    )}
                  </td>
                  <td className="p-4 text-white font-bold font-mono">
                    {pay.order ? (
                      <span
                        onClick={() => openDrawer('ORDER', pay.order._id, 'Order Details')}
                        className="cursor-pointer hover:text-gold hover:underline transition-colors"
                      >
                        ₹{pay.order.grandTotal?.toLocaleString('en-IN') || '—'}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-zinc-300 text-[10px]">
                    {pay.razorpayOrderId ? (
                      <button
                        onClick={() => openDrawer('PAYMENT', pay._id, 'Payment Details', pay)}
                        className="cursor-pointer hover:text-gold hover:underline transition-colors"
                      >
                        {pay.razorpayOrderId}
                      </button>
                    ) : '—'}
                  </td>
                  <td className="p-4 font-mono text-zinc-300 text-[10px]">
                    {pay.razorpayPaymentId ? (
                      <button
                        onClick={() => openDrawer('PAYMENT', pay._id, 'Payment Details', pay)}
                        className="cursor-pointer hover:text-gold hover:underline transition-colors"
                      >
                        {pay.razorpayPaymentId}
                      </button>
                    ) : (
                      <span className="text-zinc-600 italic">not yet</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div 
                      onClick={() => openDrawer('PAYMENT', pay._id, 'Payment Details', pay)}
                      className="cursor-pointer hover:opacity-80 transition-opacity inline-block"
                    >
                      {statusBadge(pay.status)}
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400 text-[10px]">
                    {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-IN') : '—'}
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
