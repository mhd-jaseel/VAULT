import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import razorpay from '../../services/razorpayService.js';

// POST /api/payments/retry
export const retryPayment = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required to retry payment.' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verify ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized order retry.' });
    }

    // Verify order is still payable & not cancelled
    if (['cancelled', 'packed', 'shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'This order is no longer payable or has been cancelled.' });
    }

    if (order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'captured') {
      return res.status(400).json({ success: false, message: 'Order has already been paid successfully.' });
    }

    // Stock check
    for (const item of order.items) {
      if (item.status !== 'CANCELLED') {
        const product = await Product.findById(item.product);
        if (!product || product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock no longer available for ${item.name}.`,
          });
        }
      }
    }

    // Calculate payable amount server-side (only active items)
    let activeSubtotal = 0;
    order.items.forEach(item => {
      if (item.status !== 'CANCELLED') {
        activeSubtotal += item.linePaidAmount || (item.price * item.quantity);
      }
    });

    const payableAmount = Math.max(0, activeSubtotal + order.shippingCharges - (order.walletAmountPaid || 0));
    const payablePaise = Math.round(payableAmount * 100);

    if (payablePaise <= 0) {
      return res.status(400).json({ success: false, message: 'Order has zero payable amount.' });
    }

    const rpOrderOptions = {
      amount: payablePaise,
      currency: 'INR',
      receipt: `retry_${order._id}_${Date.now().toString().slice(-4)}`,
      notes: {
        internal_order_id: String(order._id),
        is_retry: 'true',
      },
    };

    const rpOrder = await razorpay.orders.create(rpOrderOptions);

    order.razorpayOrderId = rpOrder.id;
    order.paymentStatus = 'PENDING';
    order.paymentAttempts.push({
      attemptId: `ATT-${Date.now()}`,
      razorpayOrderId: rpOrder.id,
      amount: payableAmount,
      status: 'PENDING',
    });

    await order.save();

    return res.json({
      success: true,
      data: {
        razorpayOrderId: rpOrder.id,
        amount: payablePaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        internalOrderId: String(order._id),
        grandTotal: payableAmount,
      },
    });
  } catch (error) {
    console.error('[VAULT] retryPayment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
