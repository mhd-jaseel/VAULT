import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Return from '../../models/Return.js';
import { creditWallet } from '../../services/walletService.js';
import { createNotificationHelper } from '../../services/notificationHelper.js';

/**
 * Customer Endpoint: POST /api/orders/:id/cancel-item
 * Cancels a single item within an order before it becomes PACKED.
 */
export const cancelOrderItem = async (req, res) => {
  const { itemId, reason } = req.body;
  const orderId = req.params.id;

  if (!itemId) {
    return res.status(400).json({ success: false, message: 'Item ID is required for per-item cancellation.' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security: Ownership verification
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to order.' });
    }

    // Window validation: Cancellation allowed ONLY before PACKED
    const packedIndex = order.timeline.findIndex(t => t.status === 'packed');
    if (['packed', 'shipped', 'delivered'].includes(order.status) || packedIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: 'This item can no longer be cancelled because the order has been packed.',
      });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found.' });
    }

    if (item.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'This item has already been cancelled.' });
    }

    if (item.status === 'CANCEL_REQUESTED') {
      return res.status(400).json({ success: false, message: 'Cancellation request is already pending for this item.' });
    }

    // Determine credit amount STRICTLY from the order item's snapshot
    // The amount actually paid by the customer for this specific item line
    if (item.linePaidAmount === undefined || item.linePaidAmount === null) {
      return res.status(400).json({ success: false, message: 'Unable to calculate exact refund amount from order history.' });
    }

    const linePaid = item.linePaidAmount;
    
    // Strict hard validation: Refund must never exceed the actual amount paid
    if (linePaid > (item.price * item.quantity)) {
      console.error(`[VAULT] Refund Validation Failed: Attempted to refund ₹${linePaid} for item priced at ₹${item.price * item.quantity}.`);
      return res.status(400).json({ success: false, message: 'Refund calculation error: Refund exceeds item value.' });
    }

    // Update item status directly to CANCELLED
    item.status = 'CANCELLED';

    // Restore Product Stock idempotently
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });

    // Check overall order status
    const allCancelled = order.items.every(i => i.status === 'CANCELLED');
    if (allCancelled) {
      order.status = 'cancelled';
      order.timeline.push({ status: 'cancelled', note: `All items cancelled. Last item: ${item.name}` });
    } else {
      order.status = 'partially_cancelled';
      order.timeline.push({ status: 'partially_cancelled', note: `Cancelled item: ${item.name}` });
    }

    await order.save();

    // Automatically credit user wallet for actual paid amount
    const randId = Math.floor(10000 + Math.random() * 90000);
    const cancellationRecord = new Return({
      returnId: `CAN-${randId}`,
      user: req.user._id,
      order: order._id,
      orderItem: {
        product: item.product,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        totalOriginalPaid: linePaid,
      },
      returnType: 'CANCELLATION',
      settlementMethod: 'WALLET',
      reason: reason || 'Customer requested item cancellation',
      status: 'WALLET_CREDITED',
      deliveredAtSnapshot: order.deliveredAt || new Date(),
    });

    // Execute atomic credit
    const walletResult = await creditWallet({
      userId: req.user._id,
      amount: linePaid,
      source: 'CANCELLATION_CREDIT',
      referenceId: cancellationRecord._id.toString(),
      description: `Cancellation credit for ${item.name} (Order #${order._id.toString().slice(-6).toUpperCase()})`,
      adminUserId: 'SYSTEM',
    });

    cancellationRecord.walletCreditStatus = 'CREDITED';
    cancellationRecord.walletTransaction = walletResult.transaction._id;
    await cancellationRecord.save();

    // Notify Admin
    try {
      await createNotificationHelper({
        type: 'ORDER_CANCELLED',
        title: 'Item Cancelled',
        message: `Item ${item.name} in order #${order._id.toString().slice(-6).toUpperCase()} was cancelled. ₹${linePaid} credited to wallet.`,
        relatedId: order._id,
        relatedType: 'Order',
        action: 'REVIEW_CANCELLATION',
      });
    } catch (notifErr) {
      console.error('[VAULT] Failed to create notification for ORDER_CANCELLED', notifErr);
    }

    return res.json({
      success: true,
      message: 'Item cancelled successfully. ₹' + linePaid + ' credited to your Vault Wallet.',
      data: {
        order,
        cancellation: cancellationRecord,
        creditedAmount: linePaid,
      },
    });
  } catch (error) {
    console.error('[VAULT] cancelOrderItem error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
