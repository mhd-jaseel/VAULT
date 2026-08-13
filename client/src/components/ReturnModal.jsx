import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [settlementMethod, setSettlementMethod] = useState('WALLET');
  const [reason, setReason] = useState('Damaged product');
  const [customerNotes, setCustomerNotes] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [returnType, setReturnType] = useState('RETURN');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setReturnType('RETURN');
      setReason('Damaged product');
      setCustomerNotes('');
      setEvidenceFiles([]);
    }
  }, [isOpen]);

  if (!isOpen || !order || !item) return null;

  const totalOriginalPaid = item.price * item.quantity;

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleSubmitReturn = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderId', order._id);
      formData.append('productId', item.product._id || item.product);
      formData.append('settlementMethod', 'WALLET');
      formData.append('returnType', returnType);
      formData.append('reason', reason);
      if (customerNotes) formData.append('customerNotes', customerNotes);

      evidenceFiles.forEach((file) => {
        formData.append('evidenceImages', file);
      });

      const res = await axios.post('/returns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success(
          returnType === 'REPLACEMENT' 
            ? 'Replacement request submitted! Admin will confirm your replacement.' 
            : 'Return request submitted! Vault Store Credit will be issued upon return approval.'
        );
        onSuccess && onSuccess();
        onClose();
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

      <div className="relative w-full max-w-2xl bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6 z-10 text-neutral-900 overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
          <div>
            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">
              Order #{order._id.toString().slice(-6).toUpperCase()}
            </span>
            <h3 className="text-base font-extrabold uppercase tracking-tight text-neutral-950 font-sans">
              Return Item
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
          <div className="min-w-0 flex-1 font-mono">
            <h5 className="font-bold text-xs text-neutral-900 truncate uppercase font-sans">{item.name}</h5>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              Original Amount Paid: <span className="font-bold text-neutral-900">₹{totalOriginalPaid.toLocaleString('en-IN')}</span> ({item.quantity} × ₹{item.price.toLocaleString('en-IN')})
            </p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-800">
                Return Request Details
              </h4>
            </div>

            {/* Request Type Select */}
            <div>
              <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">Request Type</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setReturnType('RETURN')}
                  className={`py-3 px-4 border rounded-xl text-xs font-mono font-bold uppercase transition-colors ${
                    returnType === 'RETURN' 
                      ? 'border-neutral-900 bg-neutral-900 text-white' 
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  Return Product
                </button>
                <button
                  type="button"
                  onClick={() => setReturnType('REPLACEMENT')}
                  className={`py-3 px-4 border rounded-xl text-xs font-mono font-bold uppercase transition-colors flex flex-col items-center justify-center ${
                    returnType === 'REPLACEMENT' 
                      ? 'border-neutral-900 bg-neutral-900 text-white' 
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  Replace with Same
                  {item.product?.stock <= 0 && <span className="text-[8px] text-red-500 font-sans tracking-normal font-normal mt-0.5 lowercase">(Out of stock)</span>}
                </button>
              </div>
              {returnType === 'REPLACEMENT' && item.product?.stock < item.quantity && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-700 font-mono mb-4 flex gap-2 items-start">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <p>Same product replacement is currently unavailable because this product is out of stock.</p>
                </div>
              )}
            </div>

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
              disabled={submitting || (returnType === 'REPLACEMENT' && item.product?.stock < item.quantity)}
              className="btn-gold w-full py-3 text-xs uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                returnType === 'REPLACEMENT' ? 'Request Replacement' : 'Submit Return Request'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
