import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  FileText,
  Lock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function ReturnDetails() {
  const { id } = useParams();
  const [ret, setRet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingDiff, setPayingDiff] = useState(false);

  const fetchReturn = async () => {
    try {
      const res = await axios.get(`/returns/${id}`);
      if (res.data.success) {
        setRet(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturn();
  }, [id]);

  const handlePayAdditionalDifference = async () => {
    setPayingDiff(true);
    try {
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) {
        toast.error('Razorpay SDK failed to load.');
        setPayingDiff(false);
        return;
      }

      const orderRes = await axios.post(`/returns/${ret._id}/pay-difference`);
      if (!orderRes.data.success) {
        toast.error(orderRes.data.message || 'Unable to initiate payment.');
        setPayingDiff(false);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = orderRes.data.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'VAULT.',
        description: `Replacement Difference #${ret.returnId}`,
        order_id: razorpayOrderId,
        theme: { color: '#111111' },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`/returns/${ret._id}/verify-difference`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              toast.success('Payment verified! Replacement request updated.');
              fetchReturn();
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setPayingDiff(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing payment.');
      setPayingDiff(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!ret) {
    return (
      <div className="py-20 text-center min-h-screen">
        <h2 className="text-text-primary font-bold font-mono text-xs uppercase">Return record not found.</h2>
        <Link to="/my-returns" className="text-text-primary hover:underline mt-2 inline-block font-mono text-xs">Back to My Returns</Link>
      </div>
    );
  }

  // Define visual timelines based on returnType
  const refundSteps = ['REQUESTED', 'APPROVED', 'RECEIVED', 'INSPECTING', 'REFUND_PROCESSING', 'REFUNDED'];
  const replacementSteps = ['REQUESTED', 'APPROVED', 'RECEIVED', 'INSPECTING', 'REPLACEMENT_PROCESSING', 'REPLACEMENT_SHIPPED', 'COMPLETED'];
  const steps = ret.returnType === 'refund' ? refundSteps : replacementSteps;

  const currentStepIndex = steps.indexOf(ret.status);

  return (
    <div className="py-6 px-4 md:px-12 max-w-4xl mx-auto w-full min-h-screen">
      <Link to="/my-returns" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors font-mono text-[10px] mb-6 tracking-wider">
        <ArrowLeft size={12} /> BACK TO MY RETURNS
      </Link>

      {/* Header Info */}
      <div className="glass-card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-light pb-4 mb-4 gap-2">
          <div>
            <span className="text-[9px] text-text-secondary uppercase tracking-wider block font-mono">Return Reference</span>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              {ret.returnId}
            </h2>
          </div>
          <div className="text-left md:text-right font-mono">
            <span className="text-[9px] text-text-secondary uppercase tracking-wider block">Return Type</span>
            <span className="text-text-primary font-bold text-sm uppercase">{ret.returnType}</span>
          </div>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <p className="text-text-secondary">Returned Item:</p>
            <p className="text-text-primary font-bold mt-0.5 uppercase">{ret.orderItem.name} (×{ret.orderItem.quantity})</p>
            <p className="text-[10px] text-text-secondary mt-1">
              Original Amount Paid: <span className="font-bold text-text-primary">₹{ret.orderItem.totalOriginalPaid.toLocaleString('en-IN')}</span>
            </p>
          </div>
          <div>
            <p className="text-text-secondary">Reason:</p>
            <p className="text-text-primary font-bold mt-0.5">{ret.reason}</p>
            {ret.customerNotes && <p className="text-[10px] text-text-secondary italic mt-1">"{ret.customerNotes}"</p>}
          </div>
        </div>

        {/* Replacement Info & Pending Payment Alert */}
        {ret.returnType === 'replacement' && (
          <div className="mt-4 pt-4 border-t border-border-light text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-text-secondary">Selected Replacement:</span>
              <span className="font-bold text-text-primary">{ret.replacementProductName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Replacement Total Price:</span>
              <span className="font-bold text-text-primary">₹{ret.replacementPrice?.toLocaleString('en-IN') || '—'}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span className="text-text-primary">Additional Amount Due:</span>
              <span className={ret.additionalAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                ₹{ret.additionalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {ret.additionalAmount > 0 && ret.replacementPaymentStatus !== 'PAID' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                  <span className="text-[10px] text-amber-800 font-bold uppercase">Additional Payment Pending</span>
                </div>
                <button
                  onClick={handlePayAdditionalDifference}
                  disabled={payingDiff}
                  className="btn-gold !py-1.5 !px-3 text-[9px] uppercase tracking-wider font-bold flex items-center gap-1"
                >
                  <Lock size={10} /> Pay ₹{ret.additionalAmount}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Refund Receipt (If Refunded) */}
        {ret.returnType === 'refund' && ret.status === 'REFUNDED' && ret.refundDetails && (
          <div className="mt-4 pt-4 border-t border-emerald-200 bg-emerald-50/50 p-4 rounded-xl text-xs font-mono space-y-1.5 text-emerald-800">
            <p className="font-bold uppercase text-[10px] tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" /> Manual Refund Completed
            </p>
            <div className="flex justify-between">
              <span>Refund Amount:</span>
              <span className="font-bold">₹{ret.refundDetails.amount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Refund Method:</span>
              <span className="font-bold">{ret.refundDetails.method}</span>
            </div>
            <div className="flex justify-between">
              <span>Reference ID:</span>
              <span className="font-bold select-all">{ret.refundDetails.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span>Date Processed:</span>
              <span className="font-bold">{new Date(ret.refundDetails.refundDate).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Status Timeline */}
      <div className="glass-card">
        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-6">
          Return Status Timeline
        </h3>

        <div className="relative pl-8 border-l border-border-light space-y-8 ml-4 py-2">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isActive = idx === currentStepIndex;
            const timelineEvent = ret.timeline.find((t) => t.status === step);

            return (
              <div key={step} className="relative">
                <span
                  className={`absolute -left-[45px] top-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isCompleted
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                      : 'bg-neutral-100 border-border-light text-neutral-400'
                  }`}
                >
                  <RotateCcw size={13} />
                </span>

                <div className="space-y-1 font-mono">
                  <h4
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isActive ? 'text-text-primary underline underline-offset-4 decoration-2' : isCompleted ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {step.replace('_', ' ')}
                  </h4>

                  {timelineEvent ? (
                    <>
                      <p className="text-xs text-text-secondary font-normal font-sans leading-relaxed">{timelineEvent.note}</p>
                      <span className="text-[9px] text-text-secondary block">
                        {new Date(timelineEvent.timestamp).toLocaleDateString()} at{' '}
                        {new Date(timelineEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  ) : (
                    <p className="text-[10px] text-neutral-400 font-normal">Pending milestone.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
