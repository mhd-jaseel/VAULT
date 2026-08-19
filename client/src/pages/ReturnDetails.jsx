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

  // Customer Return Shipping Form state
  const [showShipForm, setShowShipForm] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipNote, setShipNote] = useState('');
  const [submittingShip, setSubmittingShip] = useState(false);

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

  const handleConfirmShipped = async (e) => {
    e.preventDefault();
    if (!courierName.trim()) {
      toast.warning('Please enter the courier or shipping carrier name.');
      return;
    }
    setSubmittingShip(true);
    try {
      const res = await axios.patch(`/returns/${id}/ship`, {
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim(),
        notes: shipNote.trim(),
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Return shipment confirmed successfully!');
        setShowShipForm(false);
        fetchReturn();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return shipment.');
    } finally {
      setSubmittingShip(false);
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
  const walletSteps = ['REQUESTED', 'APPROVED', 'ITEM_SHIPPED', 'PRODUCT_RECEIVED', 'WALLET_CREDITED', 'COMPLETED'];
  const replacementSteps = ['REQUESTED', 'APPROVED', 'ITEM_SHIPPED', 'PRODUCT_RECEIVED', 'REPLACEMENT_APPROVED', 'REPLACEMENT_SHIPPED', 'COMPLETED'];

  let steps = walletSteps;
  if (ret.returnType === 'REPLACEMENT') {
    if (ret.status === 'WALLET_CREDITED') {
      steps = ['REQUESTED', 'APPROVED', 'ITEM_SHIPPED', 'PRODUCT_RECEIVED', 'WALLET_CREDITED', 'COMPLETED'];
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

      {/* Return Shipping Address & Customer Shipping Action (Shown when Return is APPROVED or in transit) */}
      {ret.status === 'APPROVED' && (
        <div className="glass-card mb-6 border-2 border-brand-primary/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-border-light pb-3">
            <Truck size={16} className="text-text-primary" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary">
              Return Shipping Address &amp; Instructions
            </h3>
          </div>

          <div className="bg-neutral-50 p-5 rounded-xl border border-border-light space-y-3 font-mono">
            <div className="border-b border-border-light/70 pb-3">
              <span className="text-[9px] text-[#ca8a04] uppercase font-bold tracking-widest block mb-1">
                RETURN APPROVED — PLEASE SEND PRODUCT TO:
              </span>
              <p className="font-extrabold text-text-primary text-sm uppercase">
                {ret.returnAddress?.recipientName || 'VAULT Returns Department'}
              </p>
              <p className="text-xs text-text-primary mt-1">
                {ret.returnAddress?.addressLine1 || ret.returnAddress?.street || 'Unit 4B, Signature Tower'}
              </p>
              {ret.returnAddress?.addressLine2 && (
                <p className="text-xs text-text-secondary">
                  {ret.returnAddress.addressLine2}
                </p>
              )}
              <p className="text-xs text-text-primary mt-0.5">
                {[ret.returnAddress?.city, ret.returnAddress?.district].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs text-text-primary font-bold mt-0.5">
                {[ret.returnAddress?.state, (ret.returnAddress?.pinCode || ret.returnAddress?.zip)].filter(Boolean).join(' – ')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              {ret.returnAddress?.phone && (
                <p className="text-text-secondary">
                  Phone: <span className="font-bold text-text-primary">{ret.returnAddress.phone}</span>
                </p>
              )}
              {ret.returnAddress?.whatsapp && (
                <p className="text-text-secondary">
                  WhatsApp: <span className="font-bold text-text-primary">{ret.returnAddress.whatsapp}</span>
                </p>
              )}
            </div>

            {ret.returnAddress?.instructions && (
              <div className="p-3 bg-white rounded-lg border border-border-light text-[11px] text-text-secondary font-sans leading-relaxed mt-2">
                <strong className="font-mono uppercase text-[10px] text-text-primary block mb-0.5">Return Instructions:</strong>
                {ret.returnAddress.instructions}
              </div>
            )}
          </div>

          <div className="pt-2">
            {!showShipForm ? (
              <button
                type="button"
                onClick={() => setShowShipForm(true)}
                className="btn-gold w-full text-xs uppercase tracking-widest py-3 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Package size={14} /> I Have Shipped The Product
              </button>
            ) : (
              <form onSubmit={handleConfirmShipped} className="bg-white p-4 rounded-xl border border-border-light space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-border-light pb-2">
                  <span className="font-bold uppercase text-text-primary text-[11px]">Submit Return Shipment Details</span>
                  <button type="button" onClick={() => setShowShipForm(false)} className="text-text-secondary hover:text-text-primary text-[10px] uppercase cursor-pointer">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase block mb-1">Courier / Carrier Name</label>
                    <input
                      type="text"
                      placeholder="e.g. BlueDart, Delhivery, India Post"
                      className="form-input text-xs"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase block mb-1">Tracking Number / AWB</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234567890"
                      className="form-input text-xs"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-text-secondary uppercase block mb-1">Additional Note (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Shipped today via local post"
                      className="form-input text-xs"
                      value={shipNote}
                      onChange={(e) => setShipNote(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingShip}
                  className="btn-dark w-full text-xs uppercase tracking-widest py-2.5 mt-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingShip ? 'Submitting...' : 'Confirm Shipment'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Customer Return Shipment Details (when in transit) */}
      {ret.customerShipment && ret.customerShipment.shippedAt && (
        <div className="glass-card mb-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-border-light pb-3">
            <CheckCircle2 size={16} className="text-[#16a34a]" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary">
              PRODUCT SHIPPED
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div>
              <span className="text-[9px] text-text-secondary uppercase tracking-wider block">Courier / Carrier</span>
              <p className="font-bold text-text-primary mt-0.5">{ret.customerShipment.courierName || 'Standard Courier'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase tracking-wider block">Tracking No.</span>
              <p className="font-bold text-text-primary mt-0.5">{ret.customerShipment.trackingNumber || '—'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase tracking-wider block">Shipped Date</span>
              <p className="font-bold text-text-primary mt-0.5">{new Date(ret.customerShipment.shippedAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
          {ret.status === 'ITEM_SHIPPED' && (
            <p className="text-[11px] text-[#ca8a04] bg-[#fefce8] p-3 rounded-lg border border-[#fef08a] font-mono leading-relaxed">
              Your returned product has been shipped.<br />
              <strong>Waiting for Vault.Co to receive the product.</strong>
            </p>
          )}
        </div>
      )}

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
