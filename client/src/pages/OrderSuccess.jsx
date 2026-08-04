import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, MessageSquare, ArrowRight, ClipboardCheck } from 'lucide-react';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderRes = await axios.get(`/orders/${orderId}`);
        const settingsRes = await axios.get('/settings');

        if (orderRes.data.success) setOrder(orderRes.data.data);
        if (settingsRes.data.success) setSettings(settingsRes.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  const generateWhatsAppLink = () => {
    if (!order || !settings) return '#';

    const itemsStr = order.items
      .map((item) => `- ${item.name} (Qty: ${item.quantity}) - ₹${item.price}`)
      .join('\n');

    const address = order.shippingAddress;
    const message = `Hello VAULT team,\n\nI have placed an order. Here are my details:\n\n*Order ID*: ${order._id}\n*Customer Name*: ${address.name}\n*Phone Number*: ${address.phone}\n*Address*: ${address.street}, ${address.city}, ${address.state} - ${address.zip}\n\n*Ordered Products*:\n${itemsStr}\n\n*Total Price*: ₹${order.grandTotal}\n*Payment Method*: ${order.paymentMethod.toUpperCase()}\n\nKindly confirm my order. Thank you!`;

    const encodedMessage = encodeURIComponent(message);
    const cleanedWhatsapp = settings.whatsappNumber.replace(/[^0-9]/g, '');

    return `https://wa.me/${cleanedWhatsapp}?text=${encodedMessage}`;
  };

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

  const isUpi = order.paymentMethod === 'upi';

  return (
    <div className="py-12 px-4 md:px-12 max-w-xl mx-auto w-full min-h-screen text-center flex flex-col justify-center">
      <div className="w-14 h-14 rounded-full bg-[#e6f7ee] border border-border-light flex items-center justify-center mx-auto mb-4 text-[#16a34a]">
        <CheckCircle2 size={28} />
      </div>
      
      <h1 className="text-2xl font-extrabold uppercase tracking-tight text-text-primary">
        Order Placed!
      </h1>
      <p className="text-xs text-text-secondary mt-2">
        Thank you for shopping with VAULT. Your order is registered under ID:
      </p>
      <p className="text-xs font-bold text-text-primary font-mono mt-1 bg-neutral-100 py-1.5 px-3 rounded-lg border border-border-light inline-block mx-auto select-all">
        #{order._id}
      </p>

      {/* UPI Info status */}
      {isUpi ? (
        <div className="glass-card mt-6 !p-4 border border-[#e6f7ee] bg-[#e6f7ee] text-left text-xs text-[#16a34a]">
          <p className="font-bold uppercase tracking-wider text-[9px] mb-1 font-mono">Manual UPI Pending Verification</p>
          <p className="font-normal leading-relaxed text-[#16a34a]/90">
            You have submitted payment details for verification. Once checked by our audit team, the payment status will update to <span className="font-bold font-mono text-xs">Verified</span>.
          </p>
        </div>
      ) : (
        <div className="glass-card mt-6 !p-4 text-left text-xs text-text-secondary bg-neutral-50">
          <p className="font-bold uppercase tracking-wider text-[9px] text-text-primary mb-1 font-mono">Cash On Delivery</p>
          <p className="font-normal leading-relaxed">
            Please prepare cash payment for our logistics provider upon delivery of your accessories package.
          </p>
        </div>
      )}

      {/* WhatsApp Integration Button */}
      <div className="glass-card mt-6 flex flex-col gap-3 text-center">
        <h4 className="font-mono font-bold text-[10px] text-text-primary uppercase tracking-wider">
          Confirm Order via WhatsApp
        </h4>
        <p className="text-[10px] text-text-secondary max-w-xs mx-auto leading-relaxed">
          Please click below to share order coordinates directly with our WhatsApp dispatch team for immediate confirmation.
        </p>
        <a
          href={generateWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#16a34a] text-white hover:bg-[#15803d] font-semibold font-mono text-xs tracking-wider py-3.5 px-6 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <MessageSquare size={14} /> SEND WHATSAPP INVOICE
        </a>
      </div>

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
