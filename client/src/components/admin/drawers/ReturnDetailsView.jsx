import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
  Truck,
  ShieldCheck,
  CreditCard,
  X,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { DrawerSection, DrawerRow, DrawerBadge } from '../AdminDetailsDrawer';

export default function ReturnDetailsView({ returnId, onStatusUpdated }) {
  const [ret, setRet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(''); // e.g. 'APPROVE', 'REJECT', 'RECEIVE', 'REFUND', 'REPLACEMENT_APPROVE', 'REPLACEMENT_SHIP', 'COMPLETE'

  // Modal / Form states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [courierName, setCourierName] = useState('Vault Express Logistics');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [selectedResolution, setSelectedResolution] = useState(null); // 'REFUND' | 'REPLACEMENT'

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await axios.get(`/returns/${returnId}`);
      if (res.data.success) {
        const returnData = res.data.data;
        setRet(returnData);
        // Default selected resolution based on returnType
        if (returnData.returnType === 'REPLACEMENT') {
          setSelectedResolution('REPLACEMENT');
        } else {
          setSelectedResolution('REFUND');
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to fetch return details:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (returnId) {
      fetchDetails();
    }
  }, [returnId]);

  // Execute a state transition
  const executeTransition = async ({ status, note, rejectionReasonText, courier, tracking, notes }) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const payload = {
        status,
        note,
        rejectionReason: rejectionReasonText,
        courierName: courier,
        trackingNumber: tracking,
        notes,
      };

      const res = await axios.patch(`/returns/admin/${returnId}/status`, payload);
      if (res.data.success) {
        toast.success(res.data.message || `Return updated to ${status}`);
        setRet(res.data.data);
        setShowRejectModal(false);
        setShowRefundConfirm(false);
        setShowShipModal(false);
        if (onStatusUpdated) onStatusUpdated(res.data.data);
      }
    } catch (err) {
      console.error('Error updating return status:', err);
      toast.error(err.response?.data?.message || 'Failed to update return status.');
    } finally {
      setActionLoading(false);
      setActiveAction('');
    }
  };

  // Handlers for specific actions
  const handleApproveReturn = () => {
    setActiveAction('APPROVE');
    executeTransition({
      status: 'APPROVED',
      note: 'Return request approved by admin.',
    });
  };

  const handleRejectReturn = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.warning('Please provide a rejection reason.');
      return;
    }
    setActiveAction('REJECT');
    executeTransition({
      status: 'REJECTED',
      rejectionReasonText: rejectionReason.trim(),
    });
  };

  const handleMarkProductReceived = () => {
    setActiveAction('RECEIVE');
    executeTransition({
      status: 'PRODUCT_RECEIVED',
      note: 'Returned product received at warehouse and inspected.',
    });
  };

  const handleConfirmWalletRefund = () => {
    setActiveAction('REFUND');
    executeTransition({
      status: 'WALLET_CREDITED',
      note: `Wallet refund processed for ₹${ret?.orderItem?.totalOriginalPaid?.toLocaleString('en-IN')}.`,
    });
  };

  const handleApproveReplacement = () => {
    setActiveAction('REPLACEMENT_APPROVE');
    executeTransition({
      status: 'REPLACEMENT_APPROVED',
      note: 'Replacement approved and replacement stock reserved.',
    });
  };

  const handleConfirmReplacementShipped = (e) => {
    e.preventDefault();
    setActiveAction('REPLACEMENT_SHIP');
    executeTransition({
      status: 'REPLACEMENT_SHIPPED',
      courier: courierName,
      tracking: trackingNumber,
      notes: dispatchNotes,
    });
  };

  const handleCompleteReturn = () => {
    setActiveAction('COMPLETE');
    executeTransition({
      status: 'COMPLETED',
      note: 'Return process completed.',
    });
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#6b7280] font-mono text-xs py-16">
        <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-3" />
        Loading return details...
      </div>
    );
  }

  if (error || !ret) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center font-mono py-16">
        <p className="text-xs text-[#dc2626] font-bold uppercase mb-4">Unable to load details.</p>
        <button
          onClick={fetchDetails}
          className="px-4 py-2 bg-[#111111] text-white text-[10px] font-bold uppercase rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'REQUESTED': return 'neutral';
      case 'APPROVED': return 'info';
      case 'ITEM_SHIPPED': return 'warning';
      case 'PRODUCT_RECEIVED': return 'info';
      case 'REPLACEMENT_APPROVED': return 'info';
      case 'REPLACEMENT_SHIPPED': return 'highlight';
      case 'WALLET_CREDITED': return 'highlight';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  };

  const availableProductStock = ret.orderItem?.product?.stock ?? 0;
  const requestedQty = ret.orderItem?.quantity || 1;
  const isStockAvailable = availableProductStock >= requestedQty;
  const originalPaid = ret.orderItem?.totalOriginalPaid || (ret.orderItem?.price * requestedQty) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-[#111111] font-sans pb-10">

      {/* ── 1. RETURN DETAILS & SUMMARY ── */}
      <DrawerSection title="Return Information">
        <div className="bg-[#f9fafb] border border-[#e5e5e5] rounded-xl p-4 space-y-3 font-mono text-xs">
          <DrawerRow 
            label="Return ID" 
            value={ret.returnId} 
          />
          <DrawerRow 
            label="Current Status" 
            valueNode={<DrawerBadge variant={getStatusBadgeStyle(ret.status)}>{ret.status.replace(/_/g, ' ')}</DrawerBadge>} 
          />
          <DrawerRow 
            label="Request Type" 
            value={ret.returnType === 'REPLACEMENT' ? 'SAME-PRODUCT REPLACEMENT' : 'RETURN & WALLET REFUND'} 
          />
          <DrawerRow 
            label="Original Amount Paid" 
            value={`₹${originalPaid.toLocaleString('en-IN')}`} 
          />
          <DrawerRow 
            label="Requested Date" 
            value={new Date(ret.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} 
          />
          <DrawerRow 
            label="Return Window" 
            valueNode={
              <span className="text-[9px] font-bold uppercase text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-0.5 rounded-full inline-block">
                REQUESTED IN TIME (Within 3 Days)
              </span>
            } 
          />
        </div>
      </DrawerSection>

      {/* ── 2. CUSTOMER & ORDER INFO ── */}
      <DrawerSection title="Customer & Order Details">
        <div className="bg-[#f9fafb] border border-[#e5e5e5] rounded-xl p-4 space-y-3 font-mono text-xs">
          <DrawerRow label="Customer Name" value={ret.user?.name || 'Customer'} />
          <DrawerRow label="Customer Email" value={ret.user?.email || '—'} />
          <DrawerRow label="Customer Phone" value={ret.user?.phone || '—'} />
          <DrawerRow label="Order ID" value={`#${ret.order?._id || ret.order}`} />
          {ret.deliveredAtSnapshot && (
            <DrawerRow 
              label="Delivered Date" 
              value={new Date(ret.deliveredAtSnapshot).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} 
            />
          )}
        </div>
      </DrawerSection>

      {/* ── 3. RETURNED PRODUCT ── */}
      <DrawerSection title="Returned Product">
        <div className="bg-[#f9fafb] border border-[#e5e5e5] rounded-xl p-4 space-y-3 font-mono text-xs">
          <DrawerRow label="Product Name" value={ret.orderItem?.name || 'Product'} />
          <DrawerRow label="Unit Price" value={`₹${(ret.orderItem?.price || 0).toLocaleString('en-IN')}`} />
          <DrawerRow label="Returned Quantity" value={requestedQty} />
          <DrawerRow label="Current Live Stock" value={`${availableProductStock} available in inventory`} />
          <DrawerRow label="Return Reason" value={ret.reason} />
          {ret.customerNotes && (
            <DrawerRow label="Customer Note" value={`"${ret.customerNotes}"`} />
          )}

          {ret.evidenceImages && ret.evidenceImages.length > 0 && (
            <div className="pt-2 border-t border-[#e5e5e5]">
              <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-2">Evidence Photos</span>
              <div className="flex flex-wrap gap-2">
                {ret.evidenceImages.map((imgUrl, i) => (
                  <a
                    key={i}
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-16 h-16 rounded-lg overflow-hidden border border-[#e5e5e5] hover:opacity-80 transition-opacity bg-white"
                  >
                    <img src={imgUrl} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DrawerSection>

      {/* ── 4. RETURN SHIPPING ADDRESS SNAPSHOT (If Approved) ── */}
      {ret.returnShippingAddressSnapshot && ret.returnShippingAddressSnapshot.addressLine1 && (
        <DrawerSection title="Return Shipping Destination">
          <div className="bg-neutral-50 border border-[#e5e5e5] rounded-xl p-4 space-y-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 text-[#111111] font-bold uppercase text-[11px] mb-1">
              <Truck size={14} /> Shipping Instructions Provided to Customer
            </div>
            <p className="font-bold text-[#111111]">{ret.returnShippingAddressSnapshot.recipientName}</p>
            <p className="text-[#6b7280]">{ret.returnShippingAddressSnapshot.addressLine1}</p>
            {ret.returnShippingAddressSnapshot.addressLine2 && (
              <p className="text-[#6b7280]">{ret.returnShippingAddressSnapshot.addressLine2}</p>
            )}
            <p className="text-[#6b7280]">
              {[ret.returnShippingAddressSnapshot.city, ret.returnShippingAddressSnapshot.district].filter(Boolean).join(', ')}
            </p>
            <p className="text-[#6b7280] font-bold">
              {[ret.returnShippingAddressSnapshot.state, ret.returnShippingAddressSnapshot.pinCode].filter(Boolean).join(' – ')}
            </p>
            {ret.returnShippingAddressSnapshot.instructions && (
              <p className="text-[11px] text-[#374151] bg-white p-2.5 rounded-lg border border-[#e5e5e5] mt-2">
                {ret.returnShippingAddressSnapshot.instructions}
              </p>
            )}
          </div>
        </DrawerSection>
      )}

      {/* ── 5. CUSTOMER SHIPMENT DETAILS (If shipped by customer) ── */}
      {ret.customerShipment && ret.customerShipment.shippedAt && (
        <DrawerSection title="Customer Return Shipment">
          <div className="bg-[#f9fafb] border border-[#e5e5e5] rounded-xl p-4 space-y-3 font-mono text-xs">
            <DrawerRow label="Courier / Carrier" value={ret.customerShipment.courierName || 'Standard Courier'} />
            <DrawerRow label="Tracking / AWB No." value={ret.customerShipment.trackingNumber || '—'} />
            <DrawerRow 
              label="Shipped On" 
              value={new Date(ret.customerShipment.shippedAt).toLocaleString('en-IN')} 
            />
            {ret.customerShipment.notes && (
              <DrawerRow label="Customer Shipment Note" value={ret.customerShipment.notes} />
            )}
          </div>
        </DrawerSection>
      )}

      {/* ── 6. RETURN TIMELINE ── */}
      {ret.timeline && ret.timeline.length > 0 && (
        <DrawerSection title="Return Timeline">
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-[#e5e5e5]">
            {ret.timeline.map((item, idx) => (
              <div key={idx} className="relative flex items-start gap-3 pl-6">
                <div className="absolute left-0.5 top-1.5 w-3.5 h-3.5 rounded-full bg-[#111111] border-2 border-white shrink-0 shadow-xs" />
                <div className="flex-1 font-mono bg-white border border-[#e5e5e5] p-3 rounded-xl shadow-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[9px] text-[#6b7280]">
                      {new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {item.note && <p className="text-[10px] text-[#6b7280] leading-relaxed">{item.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </DrawerSection>
      )}

      {/* ── 7. CURRENT ACTION (Contextual Workflow Engine) ── */}
      <DrawerSection title="Required Action">

        {/* ── STATE: REQUESTED ── */}
        {ret.status === 'REQUESTED' && (
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#111111] uppercase">
              <Clock size={16} className="text-[#3b82f6]" />
              Return Request Pending Review
            </div>
            <p className="text-xs text-[#6b7280] font-sans">
              Review customer reason and evidence photos above. Approve to provide the customer with warehouse return shipping instructions, or reject the request.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-white border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50"
              >
                Reject Return
              </button>
              <button
                type="button"
                onClick={handleApproveReturn}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && activeAction === 'APPROVE' ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Approve Return
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STATE: APPROVED ── */}
        {ret.status === 'APPROVED' && (
          <div className="bg-white border border-[#bfdbfe] bg-[#eff6ff]/30 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2563eb] uppercase">
              <Truck size={16} />
              Return Approved — Awaiting Customer Shipment
            </div>
            <p className="text-xs text-[#374151] font-sans leading-relaxed">
              The return address and packing instructions have been shared with the customer.
            </p>
            <div className="bg-white p-3 rounded-xl border border-[#dbeafe] text-xs font-mono text-[#6b7280]">
              <span className="font-bold text-[#111111] block mb-1">Status Policy:</span>
              The customer must ship the item and confirm dispatch before the warehouse can mark the product as received.
            </div>
          </div>
        )}

        {/* ── STATE: ITEM_SHIPPED ── */}
        {ret.status === 'ITEM_SHIPPED' && (
          <div className="bg-white border border-[#fef08a] bg-[#fefce8]/40 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#ca8a04] uppercase">
              <Package size={16} />
              Customer Has Shipped Product
            </div>
            <p className="text-xs text-[#374151] font-sans">
              Customer confirmed dispatch via <strong>{ret.customerShipment?.courierName || 'Courier'}</strong>{' '}
              {ret.customerShipment?.trackingNumber && `(Tracking: ${ret.customerShipment.trackingNumber})`}.
              Inspect the package upon arrival at warehouse before proceeding.
            </p>

            <button
              type="button"
              onClick={handleMarkProductReceived}
              disabled={actionLoading}
              className="w-full px-4 py-3 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
            >
              {actionLoading && activeAction === 'RECEIVE' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Receiving Product...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Mark Product Received
                </>
              )}
            </button>
          </div>
        )}

        {/* ── STATE: PRODUCT_RECEIVED (Choose Resolution) ── */}
        {ret.status === 'PRODUCT_RECEIVED' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                Choose Resolution
              </h4>
              <span className="text-[10px] font-mono text-[#6b7280]">Select action to execute</span>
            </div>

            {/* Resolution Selector Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedResolution('REFUND')}
                className={`p-3 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                  selectedResolution === 'REFUND'
                    ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                    : 'border-[#e5e5e5] bg-white text-[#6b7280] hover:text-[#111111] hover:bg-[#f9fafb]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase mb-1">
                  <CreditCard size={14} /> Refund To Wallet
                </div>
                <p className={`text-[10px] ${selectedResolution === 'REFUND' ? 'text-[#e5e5e5]' : 'text-[#9ca3af]'}`}>
                  Credit ₹{originalPaid.toLocaleString('en-IN')} to customer wallet
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedResolution('REPLACEMENT')}
                className={`p-3 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                  selectedResolution === 'REPLACEMENT'
                    ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                    : 'border-[#e5e5e5] bg-white text-[#6b7280] hover:text-[#111111] hover:bg-[#f9fafb]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase mb-1">
                  <Package size={14} /> Replacement
                </div>
                <p className={`text-[10px] ${selectedResolution === 'REPLACEMENT' ? 'text-[#e5e5e5]' : 'text-[#9ca3af]'}`}>
                  {isStockAvailable ? `${availableProductStock} in stock` : 'Out of stock'}
                </p>
              </button>
            </div>

            {/* Resolution Form: REFUND TO WALLET */}
            {selectedResolution === 'REFUND' && (
              <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 space-y-4 shadow-xs font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
                  <span className="font-bold text-[#111111] uppercase">Return Refund</span>
                  <span className="text-[10px] font-bold text-[#16a34a] bg-[#f0fdf4] px-2 py-0.5 rounded-full border border-[#bbf7d0]">
                    VAULT WALLET
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Refund Amount:</span>
                    <span className="font-bold text-[#111111] text-sm">₹{originalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Original Paid Amount:</span>
                    <span className="text-[#111111]">₹{originalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Refund Method:</span>
                    <span className="text-[#111111]">Vault.Co Wallet</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRefundConfirm(true)}
                  disabled={actionLoading}
                  className="w-full px-4 py-3 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                >
                  <CreditCard size={14} /> Credit ₹{originalPaid.toLocaleString('en-IN')} To Wallet
                </button>
              </div>
            )}

            {/* Resolution Form: REPLACEMENT */}
            {selectedResolution === 'REPLACEMENT' && (
              <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 space-y-4 shadow-xs font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
                  <span className="font-bold text-[#111111] uppercase">Replacement Request</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isStockAvailable 
                      ? 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]' 
                      : 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]'
                  }`}>
                    {isStockAvailable ? 'STOCK AVAILABLE' : 'OUT OF STOCK'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Replacement Product:</span>
                    <span className="font-bold text-[#111111] text-right truncate max-w-[200px]" title={ret.orderItem?.name}>
                      {ret.orderItem?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Required Quantity:</span>
                    <span className="text-[#111111]">{requestedQty} unit(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Available Live Stock:</span>
                    <span className={`font-bold ${isStockAvailable ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                      {availableProductStock} unit(s)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Original Paid Amount:</span>
                    <span className="text-[#111111]">₹{originalPaid.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {isStockAvailable ? (
                  <div className="space-y-3 pt-2">
                    <div className="bg-[#f0fdf4] p-3 rounded-xl border border-[#bbf7d0] text-[11px] text-[#16a34a]">
                      ✓ Sufficient stock available ({availableProductStock} in inventory). Ready for replacement approval.
                    </div>
                    <button
                      type="button"
                      onClick={handleApproveReplacement}
                      disabled={actionLoading}
                      className="w-full px-4 py-3 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                    >
                      {actionLoading && activeAction === 'REPLACEMENT_APPROVE' ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Approving Replacement...
                        </>
                      ) : (
                        <>
                          <Package size={14} /> Approve Replacement
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="bg-[#fef2f2] p-3 rounded-xl border border-[#fecaca] text-[11px] text-[#dc2626]">
                      <AlertTriangle size={14} className="inline mr-1 -mt-0.5" />
                      <strong>Replacement Unavailable:</strong> Insufficient stock available in warehouse.
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRefundConfirm(true)}
                      disabled={actionLoading}
                      className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                    >
                      <CreditCard size={14} /> Refund Paid Amount (₹{originalPaid.toLocaleString('en-IN')}) To Wallet
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STATE: REPLACEMENT_APPROVED ── */}
        {ret.status === 'REPLACEMENT_APPROVED' && (
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 space-y-4 shadow-xs font-mono text-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2563eb] uppercase">
              <CheckCircle2 size={16} />
              Replacement Approved &amp; Stock Reserved
            </div>
            <p className="text-xs text-[#6b7280] font-sans">
              Replacement unit has been allocated from inventory. Dispatch the package to the customer and enter tracking details below.
            </p>

            <form onSubmit={handleConfirmReplacementShipped} className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">
                  Courier / Carrier Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. BlueDart, Delhivery, Vault Logistics"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-[#111111]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">
                  Tracking Number / AWB
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRK12345678"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">
                  Dispatch Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shipped via express courier"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full px-4 py-3 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs mt-2"
              >
                {actionLoading && activeAction === 'REPLACEMENT_SHIP' ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Shipping Replacement...
                  </>
                ) : (
                  <>
                    <Truck size={14} /> Mark Replacement Shipped
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── STATE: WALLET_CREDITED ── */}
        {ret.status === 'WALLET_CREDITED' && (
          <div className="bg-white border border-[#bbf7d0] bg-[#f0fdf4]/40 rounded-2xl p-5 space-y-4 shadow-xs font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#bbf7d0] pb-3">
              <div className="flex items-center gap-2 font-bold text-[#16a34a] uppercase">
                <CheckCircle2 size={16} /> Refund Credited To Wallet
              </div>
              <span className="text-[9px] font-bold bg-white text-[#16a34a] border border-[#bbf7d0] px-2 py-0.5 rounded-full">
                COMPLETED REFUND
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Refunded Amount:</span>
                <span className="font-bold text-[#111111]">₹{originalPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Settlement Method:</span>
                <span className="text-[#111111]">Vault.Co Wallet</span>
              </div>
              {ret.walletTransaction && (
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Transaction ID:</span>
                  <span className="font-bold text-[#111111]">
                    {ret.walletTransaction?.transactionId || ret.walletTransaction?._id || 'Recorded'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCompleteReturn}
              disabled={actionLoading}
              className="w-full px-4 py-3 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
            >
              {actionLoading && activeAction === 'COMPLETE' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Closing Request...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} /> Close &amp; Mark Completed
                </>
              )}
            </button>
          </div>
        )}

        {/* ── STATE: REPLACEMENT_SHIPPED ── */}
        {ret.status === 'REPLACEMENT_SHIPPED' && (
          <div className="bg-white border border-[#c7d2fe] bg-[#e0e7ff]/30 rounded-2xl p-5 space-y-4 shadow-xs font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#c7d2fe] pb-3">
              <div className="flex items-center gap-2 font-bold text-[#4f46e5] uppercase">
                <Truck size={16} /> Replacement Shipped
              </div>
              <span className="text-[9px] font-bold bg-white text-[#4f46e5] border border-[#c7d2fe] px-2 py-0.5 rounded-full">
                IN TRANSIT
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Courier:</span>
                <span className="font-bold text-[#111111]">{ret.replacementShipment?.courierName || 'Vault Logistics'}</span>
              </div>
              {ret.replacementShipment?.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Tracking No:</span>
                  <span className="font-bold text-[#111111]">{ret.replacementShipment.trackingNumber}</span>
                </div>
              )}
              {ret.replacementShippedAt && (
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Shipped Date:</span>
                  <span className="text-[#111111]">
                    {new Date(ret.replacementShippedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCompleteReturn}
              disabled={actionLoading}
              className="w-full px-4 py-3 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
            >
              {actionLoading && activeAction === 'COMPLETE' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Closing Request...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} /> Close &amp; Mark Completed
                </>
              )}
            </button>
          </div>
        )}

        {/* ── STATE: REJECTED ── */}
        {ret.status === 'REJECTED' && (
          <div className="bg-white border border-[#fecaca] bg-[#fef2f2]/40 rounded-2xl p-5 space-y-4 shadow-xs font-mono text-xs">
            <div className="flex items-center gap-2 font-bold text-[#dc2626] uppercase">
              <X size={16} /> Return Request Rejected
            </div>
            {ret.rejectionReason && (
              <div className="bg-white p-3 rounded-xl border border-[#fecaca]">
                <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">Rejection Reason</span>
                <p className="text-xs text-[#dc2626]">{ret.rejectionReason}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleCompleteReturn}
              disabled={actionLoading}
              className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] text-[#374151] rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50"
            >
              Close As Completed
            </button>
          </div>
        )}

        {/* ── STATE: COMPLETED ── */}
        {ret.status === 'COMPLETED' && (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-5 space-y-2 shadow-xs font-mono text-xs text-center">
            <div className="w-10 h-10 bg-[#16a34a] text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="font-bold text-sm text-[#16a34a] uppercase">Return Completed</h4>
            <p className="text-xs text-[#374151] font-sans">
              This return workflow has been resolved and closed. No further modifications are permitted.
            </p>
          </div>
        )}

      </DrawerSection>

      {/* ── CONFIRMATION MODAL: WALLET REFUND ── */}
      {showRefundConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl font-mono text-[#111111]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#111111] border-b border-[#e5e5e5] pb-3">
              <CreditCard size={16} className="text-[#16a34a]" /> Credit Refund To Wallet?
            </div>

            <p className="text-xs text-[#374151] font-sans leading-relaxed">
              <strong>₹{originalPaid.toLocaleString('en-IN')}</strong> will be credited directly to customer{' '}
              <strong>{ret.user?.name || 'Customer'}</strong>'s Vault.Co wallet.
            </p>

            <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5] text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Customer:</span>
                <span className="font-bold truncate max-w-[150px]">{ret.user?.name || 'Customer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Return ID:</span>
                <span className="font-bold">{ret.returnId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Total Credit:</span>
                <span className="font-bold text-[#16a34a]">₹{originalPaid.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setShowRefundConfirm(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWalletRefund}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && activeAction === 'REFUND' ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Refund'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REJECT RETURN ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl font-mono text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#dc2626]">
                <X size={16} /> Reject Return Request
              </div>
              <button onClick={() => setShowRejectModal(false)} className="text-[#6b7280] hover:text-[#111111]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRejectReturn} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this return is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl p-2.5 text-xs font-mono focus:bg-white focus:outline-none focus:border-[#111111]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && activeAction === 'REJECT' ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
