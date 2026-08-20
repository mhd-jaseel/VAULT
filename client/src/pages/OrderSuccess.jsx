import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, ArrowRight, ClipboardCheck, Package } from 'lucide-react';
import { setDocumentSEO } from '../utils/seoHelper';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDocumentSEO({
      title: 'Order Confirmed | Vault.Co',
      description: 'Your Vault.Co order has been successfully placed.',
      noIndex: true,
      canonicalPath: `/order-success/${orderId || ''}`,
    });

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/orders/${orderId}`);
        if (res.data.success) setOrder(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center min-h-screen">
        <h2 className="text-text-primary font-bold font-mono text-xs uppercase">Order not found.</h2>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'captured';

  return (
    <div className="py-12 px-4 md:px-12 max-w-xl mx-auto w-full min-h-screen text-center flex flex-col justify-center">

      {/* ── Icon ── */}
      <div className="w-16 h-16 rounded-full bg-[#e6f7ee] border border-border-light flex items-center justify-center mx-auto mb-5 text-[#16a34a]">
        <CheckCircle2 size={32} />
      </div>

      {/* ── Heading ── */}
      <h1 className="text-2xl font-extrabold uppercase tracking-tight text-text-primary">
        Order Confirmed!
      </h1>
      <p className="text-xs text-text-secondary mt-2 leading-relaxed">
        Thank you for shopping with VAULT.CO. Your payment has been received and your order is confirmed.
      </p>

      {/* ── Order ID ── */}
      <p className="text-[10px] font-mono text-text-secondary mt-4">Order ID</p>
      <p className="text-xs font-bold text-text-primary font-mono mt-1 bg-neutral-100 py-1.5 px-4 rounded-lg border border-border-light inline-block mx-auto select-all">
        #{order._id}
      </p>

      {/* ── Payment Status ── */}
      <div className={`glass-card mt-6 !p-4 text-left text-xs ${isPaid ? 'border-[#e6f7ee] bg-[#e6f7ee]' : 'border-amber-100 bg-amber-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${isPaid ? 'text-[#16a34a]' : 'text-amber-700'}`}>
            Payment Status
          </span>
          <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
            isPaid ? 'bg-[#16a34a] text-white' : 'bg-amber-500 text-white'
          }`}>
            {isPaid ? 'PAID' : order.paymentStatus?.toUpperCase() || 'PENDING'}
          </span>
        </div>
        {isPaid ? (
          <p className="text-[10px] text-[#16a34a]/90 font-mono leading-relaxed">
            Payment received via Razorpay. Your order is being prepared for dispatch.
          </p>
        ) : (
          <p className="text-[10px] text-amber-700 font-mono leading-relaxed">
            Your payment is being processed. If your payment was debited, it will reflect shortly.
          </p>
        )}
        {order.razorpayPaymentId && (
          <p className="text-[9px] font-mono text-text-secondary mt-1.5">
            Payment ID: <span className="font-bold text-text-primary">{order.razorpayPaymentId}</span>
          </p>
        )}
      </div>

      {/* ── Order Summary ── */}
      <div className="glass-card mt-4 !p-4 text-left">
        <h4 className="font-mono font-bold text-[10px] text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Package size={12} /> Order Summary
        </h4>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item._id} className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-text-secondary truncate max-w-[70%]">
                {item.name} <span className="text-text-secondary">× {item.quantity}</span>
              </span>
              <span className="text-text-primary font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border-light mt-3 pt-3 flex justify-between text-xs font-mono font-bold">
          <span className="text-text-primary uppercase">Grand Total</span>
          <span className="text-text-primary">₹{order.grandTotal?.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-3 justify-center mt-8">
        <Link
          to="/profile"
          className="btn-dark text-[10px] py-2.5 px-6 uppercase tracking-widest flex items-center gap-1"
        >
          <ClipboardCheck size={14} /> TRACK ORDERS
        </Link>
        <Link
          to="/shop"
          className="btn-gold text-[10px] py-2.5 px-6 uppercase tracking-widest flex items-center gap-1"
        >
          Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
