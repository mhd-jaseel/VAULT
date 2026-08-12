import mongoose from 'mongoose';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import { paginateAggregate } from '../../utils/paginate.js';

// Admin operation: View all customers with search, filter, pagination
export const getAllCustomers = async (req, res) => {
  try {
    const { page, limit = 10, search, status } = req.query;

    // Build base match
    const matchQuery = { role: 'customer' };

    if (status === 'blocked') {
      matchQuery.isBlocked = true;
    } else if (status === 'active') {
      matchQuery.isBlocked = { $ne: true };
    }

    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (page) {
      // With order stats using aggregation
      const lookupStages = [
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'user',
            as: 'orders',
          },
        },
        {
          $addFields: {
            totalOrders: { $size: '$orders' },
            totalSpent: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$orders',
                      as: 'o',
                      cond: { $ne: ['$$o.status', 'cancelled'] },
                    },
                  },
                  as: 'o',
                  in: '$$o.grandTotal',
                },
              },
            },
          },
        },
        { $project: { password: 0, orders: 0 } },
      ];

      const result = await paginateAggregate(
        User,
        matchQuery,
        { createdAt: -1 },
        page,
        limit,
        lookupStages
      );
      return res.json({
        success: true,
        data: result.data,
        page: result.page,
        pages: result.pages,
        total: result.total,
      });
    }

    const customers = await User.find(matchQuery).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get single user detail with order statistics
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user || user.role === 'admin') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Compute order statistics
    const allOrders = await Order.find({ user: req.params.id });
    const totalOrders = allOrders.length;
    const completedOrders = allOrders.filter(o => o.status === 'delivered').length;
    const pendingOrders = allOrders.filter(o => ['pending', 'confirmed', 'packed', 'shipped'].includes(o.status)).length;
    const cancelledOrders = allOrders.filter(o => o.status === 'cancelled').length;
    const totalSpent = allOrders
      .filter(o => o.status !== 'cancelled' && o.paymentStatus === 'verified')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalOrders,
          completedOrders,
          pendingOrders,
          cancelledOrders,
          totalSpent,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get orders for a specific user
export const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = new mongoose.Types.ObjectId(req.params.id);

    const matchQuery = { user: userId };
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

// Admin: Block a user
export const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role === 'admin') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBlocked = true;
    await user.save();

    res.json({ success: true, message: 'User has been blocked successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role === 'admin') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBlocked = false;
    await user.save();

    res.json({ success: true, message: 'User has been unblocked successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
