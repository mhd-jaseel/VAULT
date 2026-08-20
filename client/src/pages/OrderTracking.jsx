import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, Check, Truck, Package, CheckSquare, XCircle, RotateCcw, ChevronRight, X, Star } from 'lucide-react';
import { toast } from 'sonner';
import ReturnModal from '../components/ReturnModal';
import WriteReviewModal from '../components/reviews/WriteReviewModal';
import { setDocumentSEO } from '../utils/seoHelper';

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDocumentSEO({
      title: 'Order Tracking | Vault.Co',
      description: 'Track real-time delivery status of your Vault.Co order.',
      noIndex: true,
      canonicalPath: `/order-tracking/${orderId || ''}`,
    });
  }, [orderId]);

  // Review Modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [itemToReview, setItemToReview] = useState(null);
  const [itemReviewData, setItemReviewData] = useState(null);
  const [orderReviewsMap, setOrderReviewsMap] = useState({});

  // Return Modal states
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Cancel Modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [itemToCancel, setItemToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelClick = (item) => {
    setItemToCancel(item);
    setCancelModalOpen(true);
  };

  const fetchOrderReviews = async (items) => {
    if (!items || items.length === 0) return;
    try {
      const promises = items.map(async (item) => {
        const pId = item.product?._id || item.product;
        if (!pId) return null;
        try {
          const res = await axios.get(`/reviews/eligibility/${pId}`);
          if (res.data.success) {
            return { pId, data: res.data.data };
          }
        } catch (e) {
          return null;
        }
        return null;
      });
      const results = await Promise.all(promises);
      const map = {};
      results.forEach((r) => {
        if (r && r.pId) map[r.pId] = r.data;
      });
      setOrderReviewsMap(map);
    } catch (e) {
      console.error('Error fetching order reviews:', e);
    }
  };

  const confirmCancellation = async () => {
    if (!itemToCancel) return;
    setIsCancelling(true);
    try {
      const res = await axios.post(`/orders/${order._id}/cancel-item`, { itemId: itemToCancel._id });
      if (res.data.success) {
        toast.success(res.data.message);
        setCancelModalOpen(false);
        setItemToCancel(null);
        // Refresh order data
        const updatedOrder = await axios.get(`/orders/${orderId}`);
        if (updatedOrder.data.success) {
          setOrder(updatedOrder.data.data);
          if (updatedOrder.data.data.status === 'delivered') {
            fetchOrderReviews(updatedOrder.data.data.items);
          }
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to cancel this item.');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    axios.get(`/orders/${orderId}`)
      .then((res) => {
        if (res.data.success) {
          setOrder(res.data.data);
          if (res.data.data.status === 'delivered') {
            fetchOrderReviews(res.data.data.items);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center min-h-screen">
        <h2 className="text-text-primary font-bold font-mono text-xs uppercase">Order not found.</h2>
        <Link to="/profile" className="text-text-primary hover:underline mt-2 inline-block font-mono text-xs">Back to Profile</Link>
      </div>
    );
  }

  // Define steps
  const steps = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
  const currentStepIndex = steps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  const getStepIcon = (step) => {
    switch (step) {
      case 'pending': return <Clock size={14} />;
      case 'confirmed': return <CheckSquare size={14} />;
      case 'packed': return <Package size={14} />;
      case 'shipped': return <Truck size={14} />;
      case 'delivered': return <Check size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-3xl mx-auto w-full min-h-screen">
      <Link to="/profile" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors font-mono text-[10px] mb-6 tracking-wider">
        <ArrowLeft size={12} /> BACK TO PROFILE
      </Link>

      <div className="glass-card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-light pb-4 mb-4 gap-2">
          <div>
            <span className="text-[9px] text-text-secondary uppercase tracking-wider block font-mono">Reference ID</span>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              Order #{order._id.toString().toUpperCase()}
            </h2>
          </div>
          <div className="text-left md:text-right font-mono">
            <span className="text-[9px] text-text-secondary uppercase tracking-wider block">Total Amount</span>
            <span className="text-text-primary font-bold text-sm">₹{order.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <p className="text-text-secondary">Payment Method:</p>
            <p className="text-text-primary font-bold mt-0.5 uppercase">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-text-secondary">Payment Status:</p>
            <p className="text-text-primary font-bold mt-0.5 uppercase">{order.paymentStatus}</p>
          </div>
        </div>
      </div>

      {/* Items & Return Action Section */}
      <div className="glass-card mb-6 space-y-3">
        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-2">
          Order Items
        </h3>
        {order.items.map((item) => {
          const isDelivered = order.status === 'delivered';
          const isPrePacked = ['pending', 'confirmed', 'processing'].includes(order.status) && !['packed', 'shipped', 'delivered', 'cancelled'].includes(order.status);
          const hasDeliveredDate = isDelivered && !!order.deliveredAt;
          const deliveredTime = hasDeliveredDate ? new Date(order.deliveredAt).getTime() : 0;
          const returnDeadline = hasDeliveredDate ? deliveredTime + 3 * 24 * 60 * 60 * 1000 : 0;
          const isWithin3Days = hasDeliveredDate && Date.now() <= returnDeadline;
          const daysRemaining = isWithin3Days ? Math.max(1, Math.ceil((returnDeadline - Date.now()) / (24 * 60 * 60 * 1000))) : 0;
          const ret = item.returnRecord;
          const itemStatus = item.status || 'ACTIVE';

          return (
            <div key={item._id} className="p-4 rounded-xl bg-neutral-50 border border-border-light text-xs font-mono space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-text-primary uppercase font-sans text-xs">{item.name}</p>
                    <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      itemStatus === 'CANCELLED' 
                        ? 'bg-red-50 text-red-600 border-red-200' 
                        : itemStatus === 'CANCEL_REQUESTED'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {itemStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary">
                    Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')} 
                    {item.linePaidAmount !== undefined && (
                      <span className="ml-1 text-text-primary font-bold">(Paid: ₹{item.linePaidAmount.toLocaleString('en-IN')})</span>
                    )}
                  </p>

                  {/* Return Window Indicator */}
                  {isDelivered && !ret && itemStatus === 'ACTIVE' && hasDeliveredDate && (
                    <div className="pt-1">
                      {isWithin3Days ? (
                        <p className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                          <RotateCcw size={11} /> Return eligible until{' '}
                          <strong className="underline">
                            {new Date(returnDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </strong>{' '}
                          ({daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining)
                        </p>
                      ) : (
                        <p className="text-[10px] text-neutral-500 italic flex items-center gap-1">
                          <RotateCcw size={11} className="text-neutral-400" /> Return window expired (3 days from delivery passed)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Item Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {isDelivered && itemStatus === 'ACTIVE' && (
                    orderReviewsMap[item.product?._id || item.product]?.hasReviewed ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1">
                          <Check size={10} /> REVIEWED
                        </span>
                        <button
                          onClick={() => {
                            setItemToReview(item);
                            setItemReviewData(orderReviewsMap[item.product?._id || item.product]?.existingReview || null);
                            setReviewModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          EDIT REVIEW
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setItemToReview(item);
                          setItemReviewData(null);
                          setReviewModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white font-mono text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Star size={10} className="text-[#f5a623] fill-[#f5a623]" /> WRITE A REVIEW
                      </button>
                    )
                  )}

                  {itemStatus === 'ACTIVE' && isPrePacked && (
                    <button
                      onClick={() => handleCancelClick(item)}
                      disabled={isCancelling && itemToCancel?._id === item._id}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCancelling && itemToCancel?._id === item._id ? 'CANCELLING...' : 'CANCEL ITEM'}
                    </button>
                  )}

                  {!ret ? (
                    isWithin3Days && itemStatus === 'ACTIVE' ? (
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setReturnModalOpen(true);
                        }}
                        className="btn-gold !py-1.5 !px-3 text-[9px] uppercase tracking-wider font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={10} /> Request Return
                      </button>
                    ) : isDelivered ? (
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-400 border border-neutral-200 font-mono text-[9px] font-bold uppercase tracking-wider cursor-not-allowed"
                        title="Returns can only be requested within 3 days of delivery."
                      >
                        Return Window Closed
                      </button>
                    ) : null
                  ) : (
                    <Link
                      to={`/returns/${ret._id}`}
                      className="btn-dark !py-1.5 !px-3 text-[9px] uppercase tracking-wider font-bold flex items-center gap-1 cursor-pointer"
                    >
                      View Status <ChevronRight size={10} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Active Return Status Banner per Item */}
              {ret && (
                <div className="bg-white p-3 rounded-lg border border-neutral-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold uppercase text-neutral-900">
                        {ret.returnType} {ret.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-600 font-sans">
                    {ret.status === 'REQUESTED' && 'Request submitted. Awaiting admin review.'}
                    {ret.status === 'APPROVED' && 'Return request approved. Please view return details to ship the product.'}
                    {ret.status === 'ITEM_SHIPPED' && 'You have marked the item as shipped. Waiting for product arrival at warehouse.'}
                    {ret.status === 'PRODUCT_RECEIVED' && 'Product received at warehouse. Processing refund / replacement.'}
                    {ret.status === 'REPLACEMENT_APPROVED' && 'Replacement approved. Preparing for dispatch.'}
                    {ret.status === 'REPLACEMENT_SHIPPED' && 'Replacement shipped.'}
                    {ret.status === 'WALLET_CREDITED' && (ret.returnType === 'REPLACEMENT' 
                      ? `Replacement is unavailable. ₹${ret.orderItem?.totalOriginalPaid} has been credited to your Vault Wallet.`
                      : `Amount ₹${ret.orderItem?.totalOriginalPaid} credited to Vault Wallet.`
                    )}
                    {ret.status === 'COMPLETED' && 'Request completed successfully.'}
                    {ret.status === 'REJECTED' && (ret.returnType === 'REPLACEMENT'
                      ? 'Replacement rejected. Original product returning.'
                      : `Request rejected: ${ret.rejectionReason || 'Does not meet criteria.'}`
                    )}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline Section */}
      <div className="glass-card">
        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-6">
          Delivery Status Tracker
        </h3>

        {isCancelled ? (
          <div className="flex gap-4 items-start p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600">
            <XCircle className="flex-shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h5 className="font-bold text-xs uppercase tracking-wide font-mono">Order Cancelled</h5>
              {order.cancelledBy && (
                <p className="text-[11px] text-text-secondary">
                  <strong>Cancelled by:</strong> {order.cancelledBy === 'ADMIN' ? 'Admin' : 'Customer'}
                </p>
              )}
              {order.cancellationReason && (
                <p className="text-[11px] text-text-secondary">
                  <strong>Reason:</strong> {order.cancellationReason}
                </p>
              )}
              {order.refundStatus === 'REFUNDED' ? (
                <p className="text-[11px] text-emerald-600 font-bold mt-1">
                  ₹{order.refundedAmount || order.grandTotal} payment refunded successfully.
                  {order.refundTransactionReference && ` (Ref: ${order.refundTransactionReference})`}
                </p>
              ) : order.refundStatus === 'NOT_REFUNDED' ? (
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  Manual refund of ₹{order.grandTotal} is being processed.
                </p>
              ) : (
                <p className="text-[11px] text-text-secondary mt-1">
                  This order has been cancelled and returned to inventory.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="relative pl-8 border-l border-border-light space-y-8 ml-4 py-2">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isActive = idx === currentStepIndex;
              
              // Get details for this timeline event
              const timelineEvent = order.timeline.find((t) => t.status === step);

              return (
                <div key={step} className="relative">
                  {/* Step Node Icon */}
                  <span className={`absolute -left-[45px] top-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm' 
                      : 'bg-neutral-100 border-border-light text-neutral-400'
                  }`}>
                    {getStepIcon(step)}
                  </span>

                  <div className="space-y-1">
                    <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isActive ? 'text-text-primary underline decoration-2' : isCompleted ? 'text-text-primary' : 'text-text-secondary'
                    }`}>
                      {step.toUpperCase()}
                    </h4>
                    {timelineEvent ? (
                      <>
                        <p className="text-xs text-text-secondary leading-relaxed font-normal">
                          {timelineEvent.note}
                        </p>
                        <span className="text-[9px] font-mono text-text-secondary block">
                          {new Date(timelineEvent.timestamp).toLocaleDateString()} at{' '}
                          {new Date(timelineEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </>
                    ) : (
                      <p className="text-[10px] text-neutral-400 font-normal">Milestone pending.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return Modal */}
      <ReturnModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        order={order}
        item={selectedItem}
        onSuccess={() => {
          axios.get(`/orders/${orderId}`).then((res) => {
            if (res.data.success) setOrder(res.data.data);
          });
        }}
      />
      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && itemToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-900">Cancel this item?</h3>
              <button 
                onClick={() => !isCancelling && setCancelModalOpen(false)} 
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
                disabled={isCancelling}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-neutral-600">Are you sure you want to cancel this item?</p>
              
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-1">
                <p className="font-bold text-xs uppercase tracking-wide text-neutral-900 line-clamp-1">{itemToCancel.name}</p>
                <p className="font-mono text-[10px] text-neutral-500">Qty: {itemToCancel.quantity}</p>
                <p className="font-mono text-[10px] font-bold text-neutral-900">
                  Amount: ₹{(itemToCancel.linePaidAmount !== undefined ? itemToCancel.linePaidAmount : (itemToCancel.price * itemToCancel.quantity)).toLocaleString('en-IN')}
                </p>
              </div>
              
              <p className="text-[10px] text-neutral-500 italic">
                The paid amount will be refunded directly to your VAULT Wallet.
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-neutral-50/50 border-t border-neutral-100">
              <button
                onClick={() => setCancelModalOpen(false)}
                disabled={isCancelling}
                className="flex-1 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                KEEP ITEM
              </button>
              <button
                onClick={confirmCancellation}
                disabled={isCancelling}
                className="flex-1 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors cursor-pointer flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCancelling ? 'CANCELLING...' : 'CANCEL ITEM'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write / Edit Review Modal for Order Item */}
      {itemToReview && (
        <WriteReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setItemToReview(null);
            setItemReviewData(null);
          }}
          productId={itemToReview.product?._id || itemToReview.product}
          productName={itemToReview.name}
          existingReview={itemReviewData}
          onReviewSubmitted={() => {
            toast.success(itemReviewData ? 'Review updated successfully!' : 'Thank you for reviewing your purchased item!');
            if (order && order.items) {
              fetchOrderReviews(order.items);
            }
          }}
        />
      )}
    </div>
  );
}
