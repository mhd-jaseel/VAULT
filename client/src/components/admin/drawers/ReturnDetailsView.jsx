import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DrawerSection, DrawerRow, DrawerBadge } from '../AdminDetailsDrawer';
export default function ReturnDetailsView({
  returnId, 
  onActionStatus 
}) {
  const [ret, setRet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await axios.get(`/returns/${returnId}`);
        if (isMounted && res.data.success) {
          setRet(res.data.data);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch return details:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (returnId) {
      fetchDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [returnId]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#6b7280] font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-3" />
        Loading return details...
      </div>
    );
  }

  if (error || !ret) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center font-mono">
        <p className="text-xs text-[#dc2626] font-bold uppercase mb-4">Unable to load details.</p>
      </div>
    );
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'REQUESTED': return 'neutral';
      case 'APPROVED': return 'info';
      case 'REPLACEMENT_APPROVED': return 'info';
      case 'REPLACEMENT_SHIPPED': return 'highlight';
      case 'WALLET_CREDITED': return 'highlight';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  };

  const settlement = 'WALLET';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── Summary ── */}
      <DrawerSection title="Return Summary">
        <DrawerRow 
          label="Status" 
          valueNode={<DrawerBadge variant={getStatusBadgeStyle(ret.status)}>{ret.status.replace(/_/g, ' ')}</DrawerBadge>} 
        />
        <DrawerRow 
          label="Request Type" 
          value={ret.returnType === 'REPLACEMENT' ? 'SAME-PRODUCT REPLACEMENT' : 'RETURN & WALLET CREDIT'} 
        />
        {ret.returnType !== 'REPLACEMENT' && (
          <DrawerRow 
            label="Wallet Credit" 
            value={`₹${(ret.orderItem?.totalOriginalPaid || 0).toLocaleString('en-IN')}`} 
          />
        )}
        <DrawerRow 
          label="Requested On" 
          value={new Date(ret.createdAt).toLocaleDateString('en-IN')} 
        />
      </DrawerSection>

      {/* ── Customer & Order ── */}
      <DrawerSection title="Customer & Order">
        <DrawerRow label="Customer" value={ret.user?.name || 'Customer'} />
        <DrawerRow label="Email" value={ret.user?.email || 'N/A'} />
        <DrawerRow label="Phone" value={ret.user?.phone || 'N/A'} />
        <DrawerRow label="Order ID" value={`#${ret.order?._id || ret.order}`} />
        <DrawerRow 
          label="Delivered" 
          value={ret.deliveredAtSnapshot ? new Date(ret.deliveredAtSnapshot).toLocaleDateString('en-IN') : 'N/A'} 
        />
      </DrawerSection>

      {/* ── Returned Product ── */}
      <DrawerSection title="Returned Product">
        <DrawerRow 
          label="Product" 
          value={ret.orderItem?.name || 'N/A'} 
        />
        <DrawerRow 
          label="Quantity" 
          value={ret.orderItem?.quantity || 1} 
        />
        {ret.returnType === 'REPLACEMENT' && (
          <DrawerRow 
            label="Current Stock" 
            value={ret.orderItem?.product?.stock ?? 'N/A'} 
          />
        )}
        <DrawerRow 
          label="Reason" 
          value={ret.reason} 
        />
        {ret.customerNotes && (
          <DrawerRow 
            label="Note" 
            value={ret.customerNotes} 
          />
        )}
      </DrawerSection>

      {/* ── Timeline ── */}
      {ret.timeline && ret.timeline.length > 0 && (
        <DrawerSection title="Timeline">
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-[#e5e5e5]">
            {ret.timeline.map((item, idx) => (
              <div key={idx} className="relative flex items-start gap-3">
                <div className="w-4 h-4 mt-0.5 rounded-full bg-[#111111] border-4 border-white shrink-0 shadow-sm z-10 relative left-0 md:left-auto" />
                <div className="flex-1 font-mono min-w-0 bg-[#f9fafb] border border-[#e5e5e5] p-3 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">{item.status.replace(/_/g, ' ')}</span>
                    <span className="text-[9px] text-[#6b7280]">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {item.note && <p className="text-[10px] text-[#6b7280]">{item.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </DrawerSection>
      )}

      {/* ── Actions ── */}
      <div className="pt-4 border-t border-[#e5e5e5] flex flex-wrap gap-2 justify-end">
        {ret.status === 'REQUESTED' && (
          <>
            <button
              onClick={() => onActionStatus(ret, 'REJECTED')}
              className="px-3.5 py-2 bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] hover:bg-[#fee2e2] rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
            >
              {ret.returnType === 'REPLACEMENT' ? 'Reject & Return Original' : 'Reject Request'}
            </button>
            {ret.returnType === 'REPLACEMENT' ? (
              <>
                <button
                  onClick={() => onActionStatus(ret, 'WALLET_CREDITED')}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
                >
                  Credit ₹{ret.orderItem.totalOriginalPaid.toLocaleString('en-IN')} to Wallet
                </button>
                <button
                  onClick={() => onActionStatus(ret, 'REPLACEMENT_APPROVED')}
                  disabled={(ret.orderItem?.product?.stock ?? 0) < (ret.orderItem?.quantity || 1)}
                  className="px-3.5 py-2 bg-[#064e3b] hover:bg-[#065f46] text-white rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title={(ret.orderItem?.product?.stock ?? 0) < (ret.orderItem?.quantity || 1) ? 'Out of stock' : ''}
                >
                  Confirm Replacement
                </button>
              </>
            ) : (
              <button
                onClick={() => onActionStatus(ret, 'WALLET_CREDITED')}
                className="px-3.5 py-2 bg-[#064e3b] hover:bg-[#065f46] text-white rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
              >
                Approve & Credit
              </button>
            )}
          </>
        )}

        {ret.status === 'REPLACEMENT_APPROVED' && (
          <button
            onClick={() => onActionStatus(ret, 'REPLACEMENT_SHIPPED')}
            className="px-3.5 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
          >
            Mark as Shipped
          </button>
        )}
      </div>

    </div>
  );
}
