import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import { paginateAggregate } from '../../utils/paginate.js';

// Get logged in user orders
export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchQuery = { user: new mongoose.Types.ObjectId(req.user._id) };
    const sortOptions = { createdAt: -1 };

    const result = await paginateAggregate(Order, matchQuery, sortOptions, page, limit);

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

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization: User must be creator or an admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
