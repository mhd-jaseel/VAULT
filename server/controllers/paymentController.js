import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import { paginateAggregate } from '../utils/paginate.js';

// Submit manual payment verification info (Customer)
export const submitPayment = async (req, res) => {
  const { orderId, transactionId } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Screenshot image is required' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    const screenshot = `/uploads/${req.file.filename}`;

    // Create Payment verification entry
    const payment = await Payment.create({
      order: orderId,
      user: req.user._id,
      transactionId,
      screenshot,
      status: 'pending',
    });

    // Update order status/timeline
    order.paymentStatus = 'pending';
    order.timeline.push({
      status: order.status,
      note: `Payment verification details uploaded. TXN ID: ${transactionId}`,
    });
    await order.save();

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify payment receipt (Admin only)
export const verifyPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { adminNotes } = req.body;

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment verification record not found' });
    }

    payment.status = 'verified';
    payment.adminNotes = adminNotes || 'Payment verified by Admin.';
    await payment.save();

    // Update Order payment status
    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = 'verified';
      order.timeline.push({
        status: order.status,
        note: `Payment verified. Note: ${payment.adminNotes}`,
      });
      await order.save();
    }

    res.json({ success: true, message: 'Payment verified successfully', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject payment receipt (Admin only)
export const rejectPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { adminNotes } = req.body; // reason for rejection

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment verification record not found' });
    }

    payment.status = 'rejected';
    payment.adminNotes = adminNotes || 'Payment verification rejected. Invalid transaction ID or receipt.';
    await payment.save();

    // Update Order payment status
    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = 'rejected';
      order.timeline.push({
        status: order.status,
        note: `Payment verification rejected. Reason: ${payment.adminNotes}`,
      });
      await order.save();
    }

    res.json({ success: true, message: 'Payment rejected successfully', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all payment verification requests (Admin only)
export const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchQuery = {};
    const sortOptions = { createdAt: -1 };
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
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'order',
        },
      },
      {
        $unwind: {
          path: '$order',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'user.password': 0,
          'order.items': 0,
          'order.shippingAddress': 0,
        },
      },
    ];

    const result = await paginateAggregate(Payment, matchQuery, sortOptions, page, limit, lookupStages);

    res.json({
      success: true,
      data: result.data,
      page: result.page,
      pages: result.pages,
      total: result.total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
