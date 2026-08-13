import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import Return from '../models/Return.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/sales/report
router.get('/report', protect, isAdmin, async (req, res) => {
  try {
    const { range = 'this_month', startDate, endDate } = req.query;

    let start = new Date();
    let end = new Date();

    const now = new Date();

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === 'yesterday') {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (range === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (range === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (range === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (range === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    // Match query for valid non-cancelled orders within date range
    const orderDateQuery = {
      createdAt: { $gte: start, $lte: end },
    };

    const allRangeOrders = await Order.find(orderDateQuery).populate('items.product').lean();
    
    // Revenue calculations: excluding cancelled & failed
    const validOrders = allRangeOrders.filter(
      (o) => o.status !== 'cancelled' && o.paymentStatus !== 'failed'
    );

    const grossSales = validOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalOrdersCount = validOrders.length;
    
    // Calculate discounts & coupon savings from orders
    const totalDiscount = validOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);

    // Calculate actual refunded returns within range
    const refundedReturns = await Return.find({
      status: { $in: ['REFUNDED', 'COMPLETED'] },
      updatedAt: { $gte: start, $lte: end },
    }).lean();

    const totalRefunds = refundedReturns.reduce(
      (sum, r) => sum + (r.refundDetails?.amount || r.orderItem?.totalOriginalPaid || 0),
      0
    );

    const netRevenue = Math.max(0, grossSales - totalRefunds);
    const averageOrderValue = totalOrdersCount > 0 ? Math.round(grossSales / totalOrdersCount) : 0;

    // Timeline sales & orders aggregation
    const salesOverTimeMap = {};
    validOrders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toISOString().split('T')[0];
      if (!salesOverTimeMap[dateKey]) {
        salesOverTimeMap[dateKey] = { sales: 0, orders: 0 };
      }
      salesOverTimeMap[dateKey].sales += o.grandTotal || 0;
      salesOverTimeMap[dateKey].orders += 1;
    });

    const salesOverTime = Object.keys(salesOverTimeMap)
      .sort()
      .map((date) => ({
        date,
        sales: salesOverTimeMap[date].sales,
        orders: salesOverTimeMap[date].orders,
      }));

    // Top selling products & categories
    const productSalesMap = {};
    const categorySalesMap = {};

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prodName = item.name || 'Product';
        const qty = item.quantity || 1;
        const total = (item.price || 0) * qty;

        if (!productSalesMap[prodName]) {
          productSalesMap[prodName] = { name: prodName, quantity: 0, revenue: 0 };
        }
        productSalesMap[prodName].quantity += qty;
        productSalesMap[prodName].revenue += total;

        const catName = item.product?.category?.name || 'Uncategorized';
        if (!categorySalesMap[catName]) {
          categorySalesMap[catName] = { category: catName, quantity: 0, revenue: 0 };
        }
        categorySalesMap[catName].quantity += qty;
        categorySalesMap[catName].revenue += total;
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const topCategories = Object.values(categorySalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Breakdown maps
    const paymentMethodMap = {};
    const orderStatusMap = {};

    allRangeOrders.forEach((o) => {
      const method = (o.paymentMethod || 'razorpay').toUpperCase();
      paymentMethodMap[method] = (paymentMethodMap[method] || 0) + 1;

      const status = (o.status || 'pending').toUpperCase();
      orderStatusMap[status] = (orderStatusMap[status] || 0) + 1;
    });

    const paymentBreakdown = Object.keys(paymentMethodMap).map((method) => ({
      method,
      count: paymentMethodMap[method],
    }));

    const statusBreakdown = Object.keys(orderStatusMap).map((status) => ({
      status,
      count: orderStatusMap[status],
    }));

    res.json({
      success: true,
      data: {
        summary: {
          grossSales,
          totalOrders: totalOrdersCount,
          totalDiscount,
          totalRefunds,
          netRevenue,
          averageOrderValue,
        },
        salesOverTime,
        topProducts,
        topCategories,
        paymentBreakdown,
        statusBreakdown,
        dateRange: { start, end, range },
      },
    });
  } catch (error) {
    console.error('[VAULT] sales report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
