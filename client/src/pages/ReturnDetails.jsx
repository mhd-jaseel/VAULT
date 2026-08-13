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



export default function ReturnDetails() {
  const { id } = useParams();
  const [ret, setRet] = useState(null);
  const [loading, setLoading] = useState(true);


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
  let steps = walletSteps;
  if (ret.returnType === 'REPLACEMENT') {
    if (ret.status === 'WALLET_CREDITED') {
      steps = ['REQUESTED', 'WALLET_CREDITED', 'COMPLETED'];
    } else if (ret.status === 'REJECTED') {
      steps = ['REQUESTED', 'REJECTED'];
    } else {
      steps = replacementSteps;
    }
  } else if (ret.status === 'REJECTED') {
    steps = ['REQUESTED', 'REJECTED'];
  }

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

        {/* Replacement Info */}
        {ret.returnType === 'REPLACEMENT' && (
          <div className="mt-4 pt-4 border-t border-border-light text-xs font-mono space-y-2 text-text-secondary">
            {ret.status === 'WALLET_CREDITED' ? (
              <p className="text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertTriangle size={14} className="inline-block mr-1.5 -mt-0.5" />
                <strong>Replacement Unavailable.</strong> The same product is out of stock. A fallback Vault Wallet credit of ₹{ret.orderItem.totalOriginalPaid.toLocaleString('en-IN')} has been issued instead.
              </p>
            ) : ret.status === 'REJECTED' ? (
              <p className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertTriangle size={14} className="inline-block mr-1.5 -mt-0.5" />
                <strong>Replacement Rejected.</strong> Your original product is being returned to you.
              </p>
            ) : (
              <>
                <p>Your request is for a <strong>same-product replacement</strong>.</p>
                <p>No Vault Wallet credit will be generated.</p>
              </>
            )}
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
