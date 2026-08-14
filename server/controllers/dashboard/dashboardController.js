import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Payment from '../../models/Payment.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Calculate revenue (sum of non-cancelled valid orders)
    const completedOrders = await Order.find({
      status: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' },
    });
    const revenue = completedOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);

    const customersCount = await User.countDocuments({ role: 'customer' });
    const productsCount = await Product.countDocuments();

    // Pending manual payments
    const pendingPaymentsCount = await Payment.countDocuments({ status: 'pending' });

    // Low stock products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .populate('category', 'name')
      .lean();

    // Recent 5 orders for dashboard feed
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .lean();

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        revenue,
        customers: customersCount,
        products: productsCount,
        pendingPayments: pendingPaymentsCount,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
