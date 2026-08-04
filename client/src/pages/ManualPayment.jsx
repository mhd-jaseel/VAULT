import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { QrCode, Upload, CheckCircle } from 'lucide-react';

export default function ManualPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      toast.warning('Please enter your UPI transaction ID.');
      return;
    }
    if (!screenshot) {
      toast.warning('Please upload a screenshot of your payment receipt.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('transactionId', transactionId);
      formData.append('screenshot', screenshot);

      const res = await axios.post('/payments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        navigate(`/order-success/${orderId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payment details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!order || !settings) {
    return (
      <div className="py-20 text-center min-h-screen">
        <h2 className="text-text-primary font-bold font-mono text-xs uppercase">Details not found.</h2>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-12 max-w-3xl mx-auto w-full min-h-screen">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-neutral-100 border border-border-light flex items-center justify-center mx-auto mb-3">
          <QrCode className="text-text-primary" size={24} />
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary">
          UPI QR Payment
        </h1>
        <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
          Order Total: <span className="text-text-primary font-bold font-mono">₹{order.grandTotal.toLocaleString('en-IN')}</span>. Please complete payment using QR code details below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* QR Display */}
        <div className="glass-card flex flex-col items-center gap-4 text-center">
          <h4 className="font-mono font-bold text-[10px] uppercase tracking-wider text-text-secondary">Scan & Pay</h4>
          
          <div className="w-52 h-52 bg-white border-2 border-border-light rounded-2xl p-4 flex items-center justify-center shadow-sm">
            {settings.upiQrCode ? (
              <img 
                src={`http://localhost:5000${settings.upiQrCode}`} 
                alt="UPI QR Code" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-neutral-400 font-bold font-mono text-[10px] uppercase">QR Code Image Pending</div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-mono text-text-secondary uppercase">UPI ID:</p>
            <p className="text-xs text-text-primary font-bold font-mono tracking-wide bg-neutral-50 px-3 py-1.5 rounded-lg border border-border-light select-all">
              {settings.upiId}
            </p>
          </div>
        </div>

        {/* Form Submission */}
        <form onSubmit={handleSubmit} className="glass-card flex flex-col gap-5">
          <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
            Submit Verification
          </h4>

          {/* TXN ID */}
          <div>
            <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">UPI Transaction ID</label>
            <input
              type="text"
              placeholder="12-digit transaction ID"
              className="form-input text-xs"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
          </div>

          {/* Upload Screenshot */}
          <div>
            <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1.5">Payment Screenshot</label>
            
            {screenshotPreview ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border-light bg-neutral-50 flex items-center justify-center p-4">
                <img src={screenshotPreview} alt="Receipt preview" className="max-h-full max-w-full object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setScreenshot(null);
                    setScreenshotPreview('');
                  }}
                  className="absolute top-2 right-2 bg-red-50 border border-red-200 text-red-600 text-[9px] font-mono font-bold py-1.5 px-3 rounded-full cursor-pointer shadow-sm"
                >
                  CHANGE
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-video rounded-xl border border-dashed border-border-light bg-neutral-50 hover:border-text-primary cursor-pointer transition-colors p-4">
                <Upload className="text-text-secondary mb-2" size={20} />
                <span className="text-[11px] font-bold text-text-primary uppercase tracking-wide">Upload Screenshot</span>
                <span className="text-[9px] font-mono text-text-secondary mt-1">Accepts PNG, JPG, JPEG</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  required
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-gold text-[10px] py-3.5 mt-2"
          >
            {submitting ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>I HAVE PAID <CheckCircle size={14} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
