import crypto from 'crypto';
import Order from '../../models/Order.js';
import Payment from '../../models/Payment.js';
import { deductStockForOrder } from './paymentHelper.js';

// POST /api/payments/razorpay/webhook
export const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  // ── 1. Signature verification ────────────────────────────────────────────
  if (!signature || !webhookSecret) {
    return res.status(400).json({ success: false, message: 'Missing webhook signature.' });
  }

  const rawBody = req.body; // Buffer from express.raw()
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  let isValid = false;
  try {
    isValid =
      Buffer.from(signature, 'hex').length === Buffer.from(expectedSignature, 'hex').length &&
      crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    isValid = false;
  }

  if (!isValid) {
    console.warn('[VAULT Webhook] Invalid signature received.');
    return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
  }

  // ── 2. Parse event ───────────────────────────────────────────────────────
  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid JSON body.' });
  }

  const eventId = event.id;
  const eventType = event.event;
  const payload = event.payload?.payment?.entity || event.payload?.refund?.entity;

  // ── 3. Idempotency — skip if event already processed ────────────────────
  if (eventId) {
    const existingEvent = await Payment.findOne({ webhookEventId: eventId });
    if (existingEvent) {
      console.log(`[VAULT Webhook] Duplicate event ${eventId} — skipped.`);
      return res.status(200).json({ success: true, message: 'Duplicate event.' });
    }
  }

  // ── 4. Handle events ─────────────────────────────────────────────────────
  try {
    if (eventType === 'payment.captured' && payload) {
      const rpOrderId = payload.order_id;
      const rpPaymentId = payload.id;

      const order = await Order.findOne({ razorpayOrderId: rpOrderId });

      if (order && order.paymentStatus !== 'captured') {
        order.razorpayPaymentId = rpPaymentId;
        order.paymentStatus = 'captured';
        order.razorpaySignatureVerified = true;

        if (order.status === 'pending') {
          order.status = 'confirmed';
          order.timeline.push({ status: 'confirmed', note: 'Payment captured via Razorpay webhook.' });
        }

        await deductStockForOrder(order); // idempotent

        await Payment.findOneAndUpdate(
          { razorpayOrderId: rpOrderId },
          { razorpayPaymentId: rpPaymentId, status: 'captured', webhookEventId: eventId, webhookEvent: eventType },
          { upsert: false }
        );

        console.log(`[VAULT Webhook] payment.captured — Order ${order._id} confirmed.`);
      }
    } else if (eventType === 'payment.failed' && payload) {
      const rpOrderId = payload.order_id;

      const order = await Order.findOne({ razorpayOrderId: rpOrderId });
      if (order && order.paymentStatus === 'pending') {
        order.paymentStatus = 'failed';
        order.timeline.push({ status: order.status, note: 'Payment failed (webhook).' });
        await order.save();

        await Payment.findOneAndUpdate(
          { razorpayOrderId: rpOrderId },
          { status: 'failed', webhookEventId: eventId, webhookEvent: eventType }
        );

        console.log(`[VAULT Webhook] payment.failed — Order ${order._id} marked failed.`);
      }
    } else if (eventType === 'refund.created' && payload) {
      const rpPaymentId = payload.payment_id;
      const refundId = payload.id;
      const refundAmount = payload.amount; // in paise

      await Order.findOneAndUpdate(
        { razorpayPaymentId: rpPaymentId },
        { paymentStatus: 'refunded' }
      );
      await Payment.findOneAndUpdate(
        { razorpayPaymentId: rpPaymentId },
        { razorpayRefundId: refundId, refundAmount, refundStatus: 'full', webhookEventId: eventId, webhookEvent: eventType }
      );

      console.log(`[VAULT Webhook] refund.created — Refund ${refundId} processed.`);
    } else {
      // Log unknown events but return 200 so Razorpay doesn't retry
      console.log(`[VAULT Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (err) {
    console.error('[VAULT Webhook] Processing error:', err);
  }

  // ── 5. Always return 200 quickly ─────────────────────────────────────────
  return res.status(200).json({ success: true });
};
