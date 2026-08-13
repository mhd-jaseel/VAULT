import crypto from 'crypto';
import Order from '../../models/Order.js';
import Payment from '../../models/Payment.js';
import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';
import { deductStockForOrder } from './paymentHelper.js';

// POST /api/payments/razorpay/verify
export const verifyRazorpayPayment = async (req, res) => {
  const { internalOrderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!internalOrderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment verification data.' });
  }

  try {
    // ── 1. Fetch internal order ───────────────────────────────────────────────
    const order = await Order.findById(internalOrderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // ── 2. Ownership check ───────────────────────────────────────────────────
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // ── 3. Already captured — idempotent return ──────────────────────────────
    if (order.paymentStatus === 'captured') {
      return res.json({ success: true, message: 'Payment already confirmed.', data: { orderId: order._id } });
    }

    // ── 4. Use OUR stored Razorpay order ID (not the one from browser) ───────
    const storedRazorpayOrderId = order.razorpayOrderId;
    if (!storedRazorpayOrderId) {
      return res.status(400).json({ success: false, message: 'No Razorpay order associated with this order.' });
    }

    // ── 5. HMAC-SHA256 signature verification ────────────────────────────────
    // Razorpay signature = HMAC-SHA256( razorpay_order_id + "|" + razorpay_payment_id, key_secret )
    const body = storedRazorpayOrderId + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const sigBuffer = Buffer.from(razorpay_signature, 'hex');
    const expBuffer = Buffer.from(expectedSignature, 'hex');

    let isSignatureValid = false;
    try {
      isSignatureValid = sigBuffer.length === expBuffer.length && crypto.timingSafeEqual(sigBuffer, expBuffer);
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      // Mark order as failed
      order.paymentStatus = 'failed';
      order.timeline.push({ status: order.status, note: 'Payment signature verification failed.' });
      await order.save();

      await Payment.findOneAndUpdate(
        { razorpayOrderId: storedRazorpayOrderId },
        { razorpayPaymentId: razorpay_payment_id, status: 'failed' }
      );

      return res.status(400).json({ success: false, message: 'Payment verification failed. Please contact support.' });
    }

    // ── 6. Signature valid — confirm order ───────────────────────────────────
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignatureVerified = true;
    order.paymentStatus = 'captured';
    order.status = 'confirmed';
    order.timeline.push({ status: 'confirmed', note: 'Payment captured and verified by Razorpay.' });

    // Trigger Admin Notification
    try {
      const { createNotificationHelper } = await import('../../services/notificationHelper.js');
      const User = (await import('../../models/User.js')).default;
      const user = await User.findById(order.user);
      
      await createNotificationHelper({
        type: 'NEW_ORDER',
        title: 'New Checkout Order',
        message: `New order #${order._id.toString().slice(-6).toUpperCase()} placed by ${user?.name || 'Customer'} (₹${order.grandTotal})`,
        relatedId: order._id,
        relatedType: 'Order',
        action: 'REVIEW_ORDER',
      });
    } catch (notifErr) {
      console.error('[VAULT] Failed to create notification for NEW_ORDER', notifErr);
    }

    // ── 7. Deduct stock (idempotent via stockDeducted flag) ──────────────────
    await deductStockForOrder(order); // also calls order.save()

    // ── 8. Log coupon usage now that payment is confirmed ────────────────────
    if (order.coupon) {
      const coupon = await Coupon.findById(order.coupon);
      if (coupon) {
        coupon.usedCount += 1;
        await coupon.save();

        await CouponUsage.create({
          userId: req.user._id,
          couponId: coupon._id,
          orderId: order._id,
          discountAmount: order.discountAmount,
        });
      }
    }

    // ── 9. Update Payment record ─────────────────────────────────────────────
    await Payment.findOneAndUpdate(
      { razorpayOrderId: storedRazorpayOrderId },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'captured',
      }
    );

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed.',
      data: { orderId: order._id },
    });
  } catch (error) {
    console.error('[VAULT] verifyRazorpayPayment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
