import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Return from '../../models/Return.js';
import { paginateAggregate } from '../../utils/paginate.js';

// Get logged in user orders
export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userIdObj = typeof req.user._id === 'string' ? new mongoose.Types.ObjectId(req.user._id) : req.user._id;
    const matchQuery = { user: userIdObj };
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
      .populate('items.product', 'images stock');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization: User must be creator or an admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    // Fetch existing return requests for this order
    const returns = await Return.find({ order: order._id }).lean();
    const orderObj = order.toObject();

    orderObj.items = orderObj.items.map((item) => {
      const activeReturn = returns.find(
        (r) => r.orderItem?.product?.toString() === (item.product?._id || item.product)?.toString()
      );
      return {
        ...item,
        returnRecord: activeReturn || null,
      };
    });

    res.json({ success: true, data: orderObj, returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
