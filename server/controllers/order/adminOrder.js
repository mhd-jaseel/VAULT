import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import { paginateAggregate } from '../../utils/paginate.js';

// Update order status (Admin only)
export const updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If order is cancelled, return items back to stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
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

    res.json({ success: true, data: updatedOrder });
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
