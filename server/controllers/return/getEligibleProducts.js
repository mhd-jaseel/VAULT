import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

// GET /api/returns/eligible-products/:orderId/:productId
export const getEligibleReplacementProducts = async (req, res) => {
  const { orderId, productId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const orderItem = order.items.find((i) => i.product.toString() === productId.toString());
    if (!orderItem) return res.status(404).json({ success: false, message: 'Item not in order.' });

    const totalOriginalPaid = orderItem.price * orderItem.quantity;
    const unitOriginalPaid = orderItem.price;

    // RULE: Only products where individual unit price >= unit original paid (or total price >= total original paid)
    const eligibleProducts = await Product.find({
      isDeleted: false,
      status: 'active',
      stock: { $gte: orderItem.quantity },
      price: { $gte: unitOriginalPaid },
    }).populate('category', 'name');

    res.json({
      success: true,
      data: {
        originalItem: {
          name: orderItem.name,
          quantity: orderItem.quantity,
          unitOriginalPaid,
          totalOriginalPaid,
        },
        eligibleProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
