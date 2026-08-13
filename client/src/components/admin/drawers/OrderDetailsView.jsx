import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DrawerSection, DrawerRow, DrawerBadge } from '../AdminDetailsDrawer';

export default function OrderDetailsView({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await axios.get(`/orders/${orderId}`);
        if (isMounted && res.data.success) {
          setOrder(res.data.data);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (orderId) {
      fetchDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#6b7280] font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-3" />
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center font-mono">
        <p className="text-xs text-[#dc2626] font-bold uppercase mb-4">Unable to load details.</p>
      </div>
    );
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'shipped':
      case 'packed':
        return 'info';
      default:
        return 'warning';
    }
  };

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
      
      {/* ── Status & Payment ── */}
      <DrawerSection title="Overview">
        <DrawerRow 
          label="Order Status" 
          valueNode={<DrawerBadge variant={getStatusVariant(order.status)}>{order.status}</DrawerBadge>} 
        />
        <DrawerRow 
          label="Payment Status" 
          valueNode={<DrawerBadge variant={getPaymentVariant(order.paymentStatus)}>{order.paymentStatus}</DrawerBadge>} 
        />
        <DrawerRow 
          label="Payment Method" 
          value={order.paymentMethod?.replace(/_/g, ' ').toUpperCase() || 'N/A'} 
        />
        {order.razorpayPaymentId && (
          <DrawerRow 
            label="Payment ID" 
            value={order.razorpayPaymentId} 
          />
        )}
        <DrawerRow 
          label="Date Placed" 
          value={new Date(order.createdAt).toLocaleString()} 
        />
      </DrawerSection>

      {/* ── Customer ── */}
      <DrawerSection title="Customer">
        <DrawerRow label="Name" value={order.user?.name || order.shippingAddress?.name || 'N/A'} />
        <DrawerRow label="Email" value={order.user?.email || 'N/A'} />
        {order.shippingAddress?.phone && <DrawerRow label="Phone" value={order.shippingAddress.phone} />}
      </DrawerSection>

      {/* ── Shipping ── */}
      {order.shippingAddress && (
        <DrawerSection title="Shipping Address">
          <div className="text-xs font-sans text-[#111111] bg-[#f9fafb] border border-[#e5e5e5] p-3 rounded-xl leading-relaxed">
            <p className="font-bold">{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </DrawerSection>
      )}

      {/* ── Items ── */}
      <DrawerSection title="Items">
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 bg-white border border-[#e5e5e5] p-3 rounded-xl items-start">
              <div className="w-12 h-12 bg-[#f3f4f6] rounded flex items-center justify-center shrink-0 border border-[#e5e5e5] overflow-hidden">
                {item.product?.images?.[0] ? (
                  <img src={item.product.images[0]} alt="product" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] text-[#9ca3af] font-mono">NO IMG</span>
                )}
              </div>
              <div className="flex-1 min-w-0 font-mono">
                <p className="text-xs font-bold text-[#111111] truncate">{item.name}</p>
                <p className="text-[10px] text-[#6b7280]">
                  Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                </p>
                {item.status !== 'ACTIVE' && (
                  <div className="mt-1">
                    <DrawerBadge variant={item.status === 'CANCELLED' ? 'danger' : 'warning'}>
                      {item.status}
                    </DrawerBadge>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-[#111111]">
                  ₹{(item.linePaidAmount || (item.price * item.quantity)).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DrawerSection>

      {/* ── Price Breakdown ── */}
      <DrawerSection title="Price Breakdown">
        <div className="bg-[#f9fafb] border border-[#e5e5e5] p-4 rounded-xl space-y-2">
          <DrawerRow label="Subtotal" value={`₹${(order.totalAmount || 0).toLocaleString('en-IN')}`} />
          {(order.discountAmount || 0) > 0 && (
            <DrawerRow label="Discount" value={`-₹${order.discountAmount.toLocaleString('en-IN')}`} />
          )}
          <DrawerRow label="Shipping" value={`₹${(order.shippingCharges || 0).toLocaleString('en-IN')}`} />
          
          {(order.walletAmountPaid || 0) > 0 && (
            <DrawerRow label="Vault Wallet Used" value={`-₹${order.walletAmountPaid.toLocaleString('en-IN')}`} />
          )}

          <div className="pt-2 mt-2 border-t border-[#e5e5e5] flex justify-between font-extrabold text-[#111111] text-sm">
            <span>Grand Total</span>
            <span>₹{(order.grandTotal || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </DrawerSection>

      {/* ── Timeline ── */}
      {order.timeline && order.timeline.length > 0 && (
        <DrawerSection title="Timeline">
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-[#e5e5e5]">
            {order.timeline.map((event, idx) => (
              <div key={idx} className="relative flex items-start gap-3">
                <div className="w-4 h-4 mt-0.5 rounded-full bg-[#111111] border-4 border-white shrink-0 shadow-sm z-10 relative left-0 md:left-auto" />
                <div className="flex-1 font-mono min-w-0 bg-[#f9fafb] border border-[#e5e5e5] p-3 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">{event.status}</span>
                    <span className="text-[9px] text-[#6b7280]">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {event.note && <p className="text-[10px] text-[#6b7280]">{event.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </DrawerSection>
      )}
    </div>
  );
}
