import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Calculate revenue (only sum verified payments)
    const completedOrders = await Order.find({
      status: { $ne: 'cancelled' },
      paymentStatus: 'verified',
    });
    const revenue = completedOrders.reduce((sum, order) => sum + order.grandTotal, 0);

    const customersCount = await User.countDocuments({ role: 'customer' });
    const productsCount = await Product.countDocuments();

    // Pending manual payments
    const pendingPaymentsCount = await Payment.countDocuments({ status: 'pending' });

    // Low stock products (stock < 5)
    const lowStockProducts = await Product.find({ stock: { $lt: 5 } }).populate('category', 'name');

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
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
