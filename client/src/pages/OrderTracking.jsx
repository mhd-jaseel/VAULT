import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, Check, Truck, Package, CheckSquare, XCircle, RotateCcw } from 'lucide-react';
import ReturnModal from '../components/ReturnModal';

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Return Modal states
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    axios.get(`/orders/${orderId}`)
      .then((res) => {
        if (res.data.success) {
          setOrder(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
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
        <Link to="/profile" className="text-text-primary hover:underline mt-2 inline-block font-mono text-xs">Back to Profile</Link>
      </div>
    );
  }

  // Define steps
  const steps = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
  const currentStepIndex = steps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  const getStepIcon = (step) => {
    switch (step) {
      case 'pending': return <Clock size={14} />;
      case 'confirmed': return <CheckSquare size={14} />;
      case 'packed': return <Package size={14} />;
      case 'shipped': return <Truck size={14} />;
      case 'delivered': return <Check size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-3xl mx-auto w-full min-h-screen">
      <Link to="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors font-mono text-[10px] mb-6 tracking-wider">
        <ArrowLeft size={12} /> BACK TO PROFILE
      </Link>

      <div className="glass-card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-light pb-4 mb-4 gap-2">
          <div>
            <span className="text-[9px] text-text-secondary uppercase tracking-wider block font-mono">Reference ID</span>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              Order #{order._id.toString().toUpperCase()}
            </h2>
          </div>
          <div className="text-left md:text-right font-mono">
            <span className="text-[9px] text-text-secondary uppercase tracking-wider block">Total Amount</span>
            <span className="text-text-primary font-bold text-sm">₹{order.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <p className="text-text-secondary">Payment Method:</p>
            <p className="text-text-primary font-bold mt-0.5 uppercase">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-text-secondary">Payment Status:</p>
            <p className="text-text-primary font-bold mt-0.5 uppercase">{order.paymentStatus}</p>
          </div>
        </div>
      </div>

      {/* Items & Return Action Section */}
      <div className="glass-card mb-6 space-y-3">
        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-2">
          Order Items
        </h3>
        {order.items.map((item) => {
          const isDelivered = order.status === 'delivered';
          const deliveredTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : new Date(order.updatedAt).getTime();
          const isWithin3Days = isDelivered && Date.now() - deliveredTime <= 3 * 24 * 60 * 60 * 1000;

          return (
            <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-border-light text-xs font-mono">
              <div>
                <p className="font-bold text-text-primary uppercase font-sans text-xs">{item.name}</p>
                <p className="text-[10px] text-text-secondary">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
              </div>

              <div>
                {isWithin3Days ? (
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setReturnModalOpen(true);
                    }}
                    className="btn-gold !py-1.5 !px-3 text-[9px] uppercase tracking-wider font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={10} /> Return / Replace
                  </button>
                ) : isDelivered ? (
                  <span className="text-[9px] text-text-secondary italic">Return window closed</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Section */}
      <div className="glass-card">
        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-6">
          Delivery Status Tracker
        </h3>

        {isCancelled ? (
          <div className="flex gap-4 items-start p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600">
            <XCircle className="flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wide font-mono">Order Cancelled</h5>
              <p className="text-[11px] text-text-secondary mt-1">
                This order has been cancelled and returned to inventory. If you paid via UPI, refunds will reflect in 3-5 business days.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative pl-8 border-l border-border-light space-y-8 ml-4 py-2">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isActive = idx === currentStepIndex;
              
              // Get details for this timeline event
              const timelineEvent = order.timeline.find((t) => t.status === step);

              return (
                <div key={step} className="relative">
                  {/* Step Node Icon */}
                  <span className={`absolute -left-[45px] top-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm' 
                      : 'bg-neutral-100 border-border-light text-neutral-400'
                  }`}>
                    {getStepIcon(step)}
                  </span>

                  <div className="space-y-1">
                    <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isActive ? 'text-text-primary underline decoration-2' : isCompleted ? 'text-text-primary' : 'text-text-secondary'
                    }`}>
                      {step.toUpperCase()}
                    </h4>
                    {timelineEvent ? (
                      <>
                        <p className="text-xs text-text-secondary leading-relaxed font-normal">
                          {timelineEvent.note}
                        </p>
                        <span className="text-[9px] font-mono text-text-secondary block">
                          {new Date(timelineEvent.timestamp).toLocaleDateString()} at{' '}
                          {new Date(timelineEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </>
                    ) : (
                      <p className="text-[10px] text-neutral-400 font-normal">Milestone pending.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return Modal */}
      <ReturnModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        order={order}
        item={selectedItem}
        onSuccess={() => {
          axios.get(`/orders/${orderId}`).then((res) => {
            if (res.data.success) setOrder(res.data.data);
          });
        }}
      />
    </div>
  );
}
