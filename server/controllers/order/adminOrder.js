import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import { paginateAggregate } from '../../utils/paginate.js';
import {
  validateStatusTransition,
  validateStatusCorrection,
  ALLOWED_TRANSITIONS,
  ALLOWED_CORRECTIONS,
} from '../../services/orderStatusValidator.js';

// Update order status (Admin only — strict forward transition)
export const updateOrderStatus = async (req, res) => {
  const status = typeof req.body.status === 'string' ? req.body.status.toLowerCase().trim() : req.body.status;
  const { note } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = order.status;

    // Transition Validation
    const validation = validateStatusTransition(currentStatus, status);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        same: validation.same || false,
      });
    }

    // If order is cancelled, return items back to stock
    if (status === 'cancelled' && currentStatus !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    order.status = status;
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }
    order.timeline.push({ status, note: note || `Order status updated to ${status}` });

    const updatedOrder = await order.save();
    console.log(`Order status updated: #${updatedOrder.orderId || updatedOrder._id}`);
    console.log(`Previous status: ${currentStatus}`);
    console.log(`New status: ${status}`);

    res.json({ success: true, statusUpdated: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Correct order status (Admin/Super Admin only — backward status correction with audit reason)
export const correctOrderStatus = async (req, res) => {
  const { targetStatus, reason } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = order.status;

    // Correction Validation
    const validation = validateStatusCorrection(currentStatus, targetStatus, reason);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Apply correction
    order.status = targetStatus;
    if (currentStatus === 'delivered' && targetStatus !== 'delivered') {
      order.deliveredAt = null; // Clear delivered date if corrected backwards from delivered
    }

    const auditNote = `STATUS CORRECTION: Moved from '${currentStatus}' to '${targetStatus}'. Reason: ${reason.trim()}`;
    order.timeline.push({
      status: targetStatus,
      note: auditNote,
    });

    const updatedOrder = await order.save();
    console.log(`Order status updated: #${updatedOrder.orderId || updatedOrder._id}`);
    console.log(`Previous status: ${currentStatus}`);
    console.log(`New status: ${targetStatus}`);

    res.json({
      success: true,
      statusUpdated: true,
      message: `Order status corrected to ${targetStatus} successfully.`,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all orders with search, filtering, and sorting (Admin only)
export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      paymentStatus,
      sort = 'newest',
      dateRange = 'all',
      startDate,
      endDate,
      amountRange = 'all',
    } = req.query;

    const matchQuery = {};

    // 1. Order Status Filter
    if (status && status !== 'all') {
      matchQuery.status = status.toLowerCase();
    }

    // 2. Payment Status Filter
    if (paymentStatus && paymentStatus !== 'all') {
      const pStatus = paymentStatus.toLowerCase();
      if (pStatus === 'verified' || pStatus === 'captured' || pStatus === 'success') {
        matchQuery.paymentStatus = { $in: ['captured', 'authorized', 'SUCCESS', 'verified'] };
      } else if (pStatus === 'cod_pending') {
        matchQuery.paymentStatus = { $in: ['pending', 'PENDING'] };
        matchQuery.paymentMethod = { $regex: /cod/i };
      } else {
        matchQuery.paymentStatus = { $regex: new RegExp(`^${pStatus}$`, 'i') };
      }
    }

    // 3. Date Range Filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let fromDate = null;
      let toDate = null;

      if (dateRange === 'today') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (dateRange === 'this_week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        fromDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (dateRange === 'this_month') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (dateRange === 'custom') {
        if (startDate) {
          fromDate = new Date(startDate);
          fromDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
          toDate = new Date(endDate);
          toDate.setHours(23, 59, 59, 999);
        }
      }

      if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = fromDate;
        if (toDate) matchQuery.createdAt.$lte = toDate;
      }
    }

    // 4. Amount Range Filter
    if (amountRange && amountRange !== 'all') {
      if (amountRange === 'under_1000') {
        matchQuery.grandTotal = { $lt: 1000 };
      } else if (amountRange === '1000_5000') {
        matchQuery.grandTotal = { $gte: 1000, $lte: 5000 };
      } else if (amountRange === '5000_10000') {
        matchQuery.grandTotal = { $gte: 5000, $lte: 10000 };
      } else if (amountRange === 'above_10000') {
        matchQuery.grandTotal = { $gt: 10000 };
      }
    }

    // Lookup stages for User information
    const lookupStages = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'user.password': 0,
        },
      },
    ];

    // 5. Search Query across Order ID, User name, User email, User phone, and Shipping name/phone
    let postMatchQuery = null;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      let objectIdQuery = null;

      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        objectIdQuery = new mongoose.Types.ObjectId(search.trim());
      }

      const orConditions = [
        { 'user.name': searchRegex },
        { 'user.email': searchRegex },
        { 'user.phone': searchRegex },
        { 'shippingAddress.name': searchRegex },
        { 'shippingAddress.phone': searchRegex },
        { razorpayOrderId: searchRegex },
        { razorpayPaymentId: searchRegex },
      ];

      if (objectIdQuery) {
        orConditions.push({ _id: objectIdQuery });
      }

      // Also support matching last 6 hex chars of ObjectId (e.g. #6994E6)
      const hexClean = search.trim().replace(/^#/, '');
      if (/^[0-9a-fA-F]{4,24}$/.test(hexClean)) {
        orConditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: '$_id' },
              regex: hexClean,
              options: 'i',
            },
          },
        });
      }

      postMatchQuery = { $or: orConditions };
    }

    // 6. Sorting
    let sortOptions = { createdAt: -1 }; // default Newest First
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'highest_amount') {
      sortOptions = { grandTotal: -1 };
    } else if (sort === 'lowest_amount') {
      sortOptions = { grandTotal: 1 };
    } else if (sort === 'recently_updated') {
      sortOptions = { updatedAt: -1 };
    } else if (sort === 'customer_asc') {
      sortOptions = { 'user.name': 1, 'shippingAddress.name': 1 };
    } else if (sort === 'customer_desc') {
      sortOptions = { 'user.name': -1, 'shippingAddress.name': -1 };
    }

    // Build aggregation pipeline for pagination
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: matchQuery },
      ...lookupStages,
    ];

    if (postMatchQuery) {
      pipeline.push({ $match: postMatchQuery });
    }

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: sortOptions },
          { $skip: skip },
          { $limit: limitNum },
        ],
      },
    });

    const aggregateResult = await Order.aggregate(pipeline);
    const total = aggregateResult[0]?.metadata[0]?.total || 0;
    const ordersData = aggregateResult[0]?.data || [];

    // Total orders count across the system (without filters) for summary stats
    const totalSystemOrders = await Order.countDocuments({});

    res.json({
      success: true,
      data: ordersData,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      total,
      totalSystemOrders,
    });
  } catch (error) {
    console.error('[VAULT] getAllOrders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Endpoint: PATCH /api/orders/:id/cancel
 * Admin cancels an order prior to delivery.
 * - Restores stock idempotently if stock was previously deducted.
 * - Sets refundStatus to 'NOT_REFUNDED' if order was paid, or 'NOT_APPLICABLE' if unpaid.
 * - Does NOT credit wallet.
 * - Does NOT automatically refund.
 * - Records cancellation reason, cancelledBy = 'ADMIN', cancelledAt.
 */
export const adminCancelOrder = async (req, res) => {
  const { reason } = req.body;
  const orderId = req.params.id;

  if (!reason || !reason.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Cancellation reason is required.',
    });
  }

  const trimmedReason = reason.trim();

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Validation: Delivered orders cannot be cancelled
    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Delivered orders cannot be cancelled. Please use the return/replacement process.',
      });
    }

    // Validation: Idempotency - check if already cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled.',
      });
    }

    // Mark items as CANCELLED
    for (const item of order.items) {
      if (item.status !== 'CANCELLED') {
        item.status = 'CANCELLED';
      }
    }

    // Stock Restoration: Restore stock only if stock was deducted previously
    if (order.stockDeducted) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
      order.stockDeducted = false;
    }

    // Check if order was paid
    const isPaid = ['captured', 'SUCCESS', 'authorized'].includes(order.paymentStatus) || order.walletAmountPaid > 0;
    
    // Set cancellation metadata
    order.status = 'cancelled';
    order.cancellationReason = trimmedReason;
    order.cancelledBy = 'ADMIN';
    order.cancelledAt = new Date();

    if (isPaid) {
      order.refundStatus = 'NOT_REFUNDED';
    } else {
      order.refundStatus = 'NOT_APPLICABLE';
    }

    order.timeline.push({
      status: 'cancelled',
      note: `Cancelled by Admin. Reason: ${trimmedReason}`,
    });

    const updatedOrder = await order.save();

    // Send customer notification
    try {
      const { createNotificationHelper } = await import('../../services/notificationHelper.js');
      await createNotificationHelper({
        type: 'ORDER_CANCELLED',
        title: 'Order Cancelled by Admin',
        message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled by the admin. Reason: ${trimmedReason}`,
        relatedId: order._id,
        relatedType: 'Order',
        action: 'REVIEW_ORDER',
      });
    } catch (notifErr) {
      console.error('[VAULT] Failed to create notification for admin cancellation:', notifErr.message);
    }

    console.log(`[VAULT] Order #${order._id} cancelled by admin. Reason: ${trimmedReason}`);

    return res.json({
      success: true,
      message: `Order #${order._id.toString().slice(-6).toUpperCase()} cancelled successfully.`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('[VAULT] adminCancelOrder error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Endpoint: PATCH /api/orders/:id/mark-refunded
 * Admin marks a cancelled paid order as manually refunded (via GPay / UPI / Bank Transfer).
 * - Verifies order is cancelled.
 * - Verifies payment was made and refund is NOT_REFUNDED.
 * - Sets refundStatus = 'REFUNDED', records refundedAmount, refundedAt, refundedBy, and optional transaction reference (UTR).
 * - Does NOT credit wallet.
 * - Does NOT modify stock.
 */
export const markOrderRefunded = async (req, res) => {
  const { transactionReference, refundAmount } = req.body;
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verify order is cancelled
    if (order.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled orders can be marked as refunded.',
      });
    }

    // Verify duplicate refund
    if (order.refundStatus === 'REFUNDED') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been marked as refunded.',
      });
    }

    const isPaid = ['captured', 'SUCCESS', 'authorized'].includes(order.paymentStatus) || order.walletAmountPaid > 0;
    if (!isPaid) {
      return res.status(400).json({
        success: false,
        message: 'This order was not paid. No refund is required.',
      });
    }

    const eligibleRefundAmount = refundAmount !== undefined && refundAmount !== null
      ? Number(refundAmount)
      : order.grandTotal;

    order.refundStatus = 'REFUNDED';
    order.refundedAmount = eligibleRefundAmount;
    order.refundedAt = new Date();
    order.refundedBy = req.user._id;
    if (transactionReference && transactionReference.trim()) {
      order.refundTransactionReference = transactionReference.trim();
    }

    order.timeline.push({
      status: 'cancelled',
      note: `Manual refund of ₹${eligibleRefundAmount} marked as completed by Admin.${order.refundTransactionReference ? ` Reference/UTR: ${order.refundTransactionReference}` : ''}`,
    });

    const updatedOrder = await order.save();

    // Send customer notification for completed refund
    try {
      const { createNotificationHelper } = await import('../../services/notificationHelper.js');
      await createNotificationHelper({
        type: 'REFUND_ACTION_REQUIRED',
        title: 'Payment Refunded',
        message: `Your payment of ₹${eligibleRefundAmount} for order #${order._id.toString().slice(-6).toUpperCase()} has been refunded.${order.refundTransactionReference ? ` (Ref: ${order.refundTransactionReference})` : ''}`,
        relatedId: order._id,
        relatedType: 'Order',
        action: 'REVIEW_ORDER',
      });
    } catch (notifErr) {
      console.error('[VAULT] Failed to create notification for refund completion:', notifErr.message);
    }

    console.log(`[VAULT] Order #${order._id} marked as refunded (₹${eligibleRefundAmount}).`);

    return res.json({
      success: true,
      message: `Order #${order._id.toString().slice(-6).toUpperCase()} marked as refunded successfully.`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('[VAULT] markOrderRefunded error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

