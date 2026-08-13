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
  const { status, note } = req.body;

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

// Get all orders (Admin only)
export const getAllOrders = async (req, res) => {
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
        $project: {
          'user.password': 0,
        },
      },
    ];

    const result = await paginateAggregate(Order, matchQuery, sortOptions, page, limit, lookupStages);

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
