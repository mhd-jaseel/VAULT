import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import {
  X,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Lock,
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

export default function ReturnModal({ isOpen, onClose, order, item, onSuccess }) {
  const [step, setStep] = useState(1);
  const [returnType, setReturnType] = useState('refund');
  const [reason, setReason] = useState('Damaged product');
  const [customerNotes, setCustomerNotes] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  // Replacement selection state
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [selectedReplacement, setSelectedReplacement] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setReturnType('refund');
      setReason('Damaged product');
      setCustomerNotes('');
      setEvidenceFiles([]);
      setSelectedReplacement(null);
    }
  }, [isOpen]);

  if (!isOpen || !order || !item) return null;

  const totalOriginalPaid = item.price * item.quantity;

  const handleFetchEligibleProducts = async () => {
    setLoadingEligible(true);
    try {
      const res = await axios.get(`/returns/eligible-products/${order._id}/${item.product._id || item.product}`);
      if (res.data.success) {
        setEligibleProducts(res.data.data.eligibleProducts || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch eligible replacement products.');
    } finally {
      setLoadingEligible(false);
    }
  };

  const handleNextStep1 = () => {
    if (returnType === 'replacement') {
      handleFetchEligibleProducts();
      setStep(2); // Choose Replacement
    } else {
      setStep(3); // Enter Reason & Submit Refund
    }
  };

  const handleSelectReplacement = (prod) => {
    setSelectedReplacement(prod);
    setStep(3); // Proceed to reason & final submit
  };

  const handleSubmitReturn = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderId', order._id);
      formData.append('productId', item.product._id || item.product);
      formData.append('returnType', returnType);
      formData.append('reason', reason);
      formData.append('customerNotes', customerNotes);

      if (returnType === 'replacement' && selectedReplacement) {
        formData.append('replacementProductId', selectedReplacement._id);
      }

      evidenceFiles.forEach((file) => {
        formData.append('evidenceImages', file);
      });

      const res = await axios.post('/returns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const returnRecord = res.data.data;
        const additionalAmount = returnRecord.additionalAmount || 0;

        // If replacement requires higher amount difference payment
        if (returnType === 'replacement' && additionalAmount > 0) {
          toast.info(`Additional payment of ₹${additionalAmount.toLocaleString('en-IN')} required.`);
          
          const sdkLoaded = await loadRazorpay();
          if (!sdkLoaded) {
            toast.error('Payment gateway failed to load. Please complete additional payment from My Returns page.');
            onSuccess();
            onClose();
            return;
          }

          const payOrderRes = await axios.post(`/returns/${returnRecord._id}/pay-difference`);
          if (payOrderRes.data.success) {
            const { razorpayOrderId, amount, currency, keyId } = payOrderRes.data.data;

            const options = {
              key: keyId,
              amount,
              currency,
              name: 'VAULT.',
              description: `Replacement Difference #${returnRecord.returnId}`,
              order_id: razorpayOrderId,
              theme: { color: '#111111' },
              modal: {
                ondismiss: () => {
                  toast.warning('Replacement created, but additional payment is pending.');
                  onSuccess();
                  onClose();
                },
              },
              handler: async (response) => {
                try {
                  const verifyRes = await axios.post(`/returns/${returnRecord._id}/verify-difference`, {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                  if (verifyRes.data.success) {
                    toast.success('Additional payment successful! Replacement confirmed.');
                    onSuccess();
                    onClose();
                  }
                } catch {
                  toast.error('Payment verification failed. You can retry from My Returns page.');
                  onSuccess();
                  onClose();
                }
              },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
            return;
          }
        } else {
          toast.success('Return request submitted successfully!');
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting return request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6 z-10 text-neutral-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
          <div>
            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">
              Order #{order._id.toString().slice(-6).toUpperCase()}
            </span>
            <h3 className="text-base font-extrabold uppercase tracking-tight text-neutral-950 font-sans">
              Return / Replace Item
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Returned Item Summary Banner */}
        <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200/60 rounded-xl mb-5">
          <div className="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center text-white flex-shrink-0 font-mono text-[9px] font-bold">
            VAULT
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-xs text-neutral-900 truncate uppercase">{item.name}</h5>
            <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
              Original Paid Amount: <span className="font-bold text-neutral-900">₹{totalOriginalPaid.toLocaleString('en-IN')}</span> ({item.quantity} × ₹{item.price})
            </p>
          </div>
        </div>

        {/* ── STEP 1: Choose Action (Refund vs Replacement) ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-700">
              Step 1: What would you like to do?
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Refund Option */}
              <div
                onClick={() => setReturnType('refund')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  returnType === 'refund'
                    ? 'border-neutral-900 bg-neutral-900/5 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-400 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-900">1. Refund</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${returnType === 'refund' ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'}`}>
                    {returnType === 'refund' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-600 leading-relaxed font-sans">
                  Return item for a full manual refund of <strong className="text-neutral-900">₹{totalOriginalPaid.toLocaleString('en-IN')}</strong> directly to your account.
                </p>
              </div>

              {/* Replacement Option */}
              <div
                onClick={() => setReturnType('replacement')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  returnType === 'replacement'
                    ? 'border-neutral-900 bg-neutral-900/5 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-400 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-900">2. Replace</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${returnType === 'replacement' ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'}`}>
                    {returnType === 'replacement' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-600 leading-relaxed font-sans">
                  Choose another product worth <strong className="text-neutral-900">₹{totalOriginalPaid.toLocaleString('en-IN')}</strong> or higher. Pay difference only if higher.
                </p>
              </div>
            </div>

            <button
              onClick={handleNextStep1}
              className="btn-dark w-full py-3 text-xs uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-2 mt-4"
            >
              Continue <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Choose Replacement Product (If Replacement Selected) ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-800">
                Choose a Replacement
              </h4>
              <button onClick={() => setStep(1)} className="text-[10px] font-mono text-neutral-500 hover:text-neutral-900 underline">
                ← Back
              </button>
            </div>

            <p className="text-[11px] text-neutral-600 font-sans">
              You can choose a replacement worth <strong className="text-neutral-900 font-mono">₹{totalOriginalPaid.toLocaleString('en-IN')}</strong> or more.
            </p>

            {loadingEligible ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
              </div>
            ) : eligibleProducts.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-xl border border-neutral-200">
                <p className="text-xs text-neutral-600 font-mono">No eligible replacement products available at or above this value right now.</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                {eligibleProducts.map((prod) => {
                  const repTotal = prod.price * item.quantity;
                  const diff = repTotal - totalOriginalPaid;

                  return (
                    <div
                      key={prod._id}
                      className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-white transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.images && prod.images.length > 0 ? (prod.images[0].startsWith('/') ? `http://localhost:5000${prod.images[0]}` : prod.images[0]) : ''}
                          alt={prod.name}
                          className="w-10 h-10 object-cover rounded-lg bg-neutral-100 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h6 className="font-bold text-xs text-neutral-900 truncate uppercase font-sans">{prod.name}</h6>
                          <p className="text-[10px] font-mono text-neutral-500">
                            Price: <span className="font-bold text-neutral-900">₹{prod.price.toLocaleString('en-IN')}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          diff === 0 ? 'bg-neutral-100 text-neutral-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {diff === 0 ? 'Same Value' : `+ ₹${diff.toLocaleString('en-IN')}`}
                        </span>

                        <button
                          onClick={() => handleSelectReplacement(prod)}
                          className="btn-gold !py-1.5 !px-3 text-[9px] uppercase tracking-wider font-mono font-bold"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Return Reason, Notes, Evidence & Final Submit ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-800">
                {returnType === 'replacement' ? 'Confirm Replacement Details' : 'Refund Request Details'}
              </h4>
              <button onClick={() => setStep(returnType === 'replacement' ? 2 : 1)} className="text-[10px] font-mono text-neutral-500 hover:text-neutral-900 underline">
                ← Back
              </button>
            </div>

            {/* If Replacement selected, show comparison card */}
            {returnType === 'replacement' && selectedReplacement && (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Original Item Value:</span>
                  <span className="font-bold text-neutral-900">₹{totalOriginalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Replacement ({selectedReplacement.name}):</span>
                  <span className="font-bold text-neutral-900">₹{(selectedReplacement.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-neutral-200 pt-2 flex justify-between font-bold text-sm">
                  <span className="uppercase text-neutral-900">Additional Amount Due:</span>
                  <span className={selectedReplacement.price * item.quantity - totalOriginalPaid > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    ₹{(selectedReplacement.price * item.quantity - totalOriginalPaid).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {/* Return Reason Select */}
            <div>
              <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">Reason for Return</label>
              <select
                className="form-input text-xs"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="Damaged product">Damaged product</option>
                <option value="Wrong product received">Wrong product received</option>
                <option value="Defective product">Defective product</option>
                <option value="Product doesn't match description">Product doesn't match description</option>
                <option value="Quality issue">Quality issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Customer Notes */}
            <div>
              <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">Additional Customer Notes (Optional)</label>
              <textarea
                placeholder="Explain the issue in detail..."
                className="form-input text-xs min-h-[60px]"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
              />
            </div>

            {/* Upload Evidence Images */}
            <div>
              <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">Upload Photo Evidence (Optional)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="text-xs text-neutral-500 font-mono file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-mono file:bg-neutral-900 file:text-white hover:file:bg-neutral-800"
                onChange={(e) => setEvidenceFiles(Array.from(e.target.files))}
              />
            </div>

            {/* Action Submit Button */}
            <button
              onClick={handleSubmitReturn}
              disabled={submitting}
              className="btn-gold w-full py-3 text-xs uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : returnType === 'replacement' && selectedReplacement && (selectedReplacement.price * item.quantity - totalOriginalPaid > 0) ? (
                <>
                  <Lock size={13} /> Pay ₹{(selectedReplacement.price * item.quantity - totalOriginalPaid).toLocaleString('en-IN')} & Confirm Replacement
                </>
              ) : (
                'Submit Return Request'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
