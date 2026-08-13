import React from 'react';
import { DrawerSection, DrawerRow, DrawerBadge } from '../AdminDetailsDrawer';

export default function PaymentDetailsView({ payment }) {
  if (!payment) return null;

  const getPaymentVariant = (status) => {
    switch (status) {
      case 'captured':
      case 'SUCCESS':
        return 'success';
      case 'failed':
      case 'FAILED':
        return 'danger';
      case 'refunded':
        return 'highlight';
      default:
        return 'warning';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── Status ── */}
      <DrawerSection title="Payment Overview">
        <DrawerRow 
          label="Status" 
          valueNode={<DrawerBadge variant={getPaymentVariant(payment.status)}>{payment.status}</DrawerBadge>} 
        />
        <DrawerRow 
          label="Amount" 
          value={`₹${(payment.order?.grandTotal || payment.amountPaise / 100 || 0).toLocaleString('en-IN')}`} 
        />
        <DrawerRow 
          label="Date Initiated" 
          value={new Date(payment.createdAt).toLocaleString()} 
        />
      </DrawerSection>

      {/* ── Identifiers ── */}
      <DrawerSection title="Identifiers">
        <DrawerRow 
          label="Razorpay Order ID" 
          value={payment.razorpayOrderId || 'N/A'} 
        />
        <DrawerRow 
          label="Razorpay Payment ID" 
          value={payment.razorpayPaymentId || 'N/A'} 
        />
        <DrawerRow 
          label="Internal Order ID" 
          value={payment.order?._id || payment.order || 'N/A'} 
        />
      </DrawerSection>

      {/* ── Customer ── */}
      {payment.user && (
        <DrawerSection title="Customer Info">
          <DrawerRow label="Name" value={payment.user.name || 'N/A'} />
          <DrawerRow label="Email" value={payment.user.email || 'N/A'} />
        </DrawerSection>
      )}

      {/* ── Additional Info ── */}
      {(payment.razorpaySignature || payment.errorDescription) && (
        <DrawerSection title="Technical Details">
          {payment.razorpaySignature && (
            <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5] text-[9px] font-mono break-all text-[#6b7280]">
              <span className="font-bold text-[#111111] uppercase tracking-widest block mb-1">Signature</span>
              {payment.razorpaySignature}
            </div>
          )}
          {payment.errorDescription && (
            <div className="bg-[#fef2f2] p-3 rounded-xl border border-[#fecaca] text-[10px] font-mono text-[#dc2626] mt-3">
              <span className="font-bold uppercase tracking-widest block mb-1">Error</span>
              {payment.errorDescription}
            </div>
          )}
        </DrawerSection>
      )}

    </div>
  );
}
