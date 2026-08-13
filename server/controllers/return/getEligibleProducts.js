import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { calculateProductDiscounts } from '../../services/discountService.js';

// GET /api/returns/eligible-products/:orderId/:productId
export const getEligibleReplacementProducts = async (req, res) => {
  const { orderId, productId } = req.params;

  try {
    const order = await Order.findById(orderId).select('user items');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const orderItem = order.items.find((i) => i.product.toString() === productId.toString());
    if (!orderItem) return res.status(404).json({ success: false, message: 'Item not in order.' });

    const totalOriginalPaid = Number(orderItem.price) * Number(orderItem.quantity);
    const unitOriginalPaid = Number(orderItem.price);

    // Query active in-stock products with field projection (only necessary card fields)
    const rawProducts = await Product.find({
      isDeleted: { $ne: true },
      stock: { $gte: Number(orderItem.quantity) },
    })
      .select('name price stock images category isFeatured createdAt')
      .populate('category', 'name')
      .lean();

    // Calculate active discount final prices using standard Vault discount engine
    const productsWithDiscounts = await calculateProductDiscounts(rawProducts);

    // Filter products whose effective selling price >= unit original paid
    const eligibleProducts = productsWithDiscounts.filter((p) => {
      const sellingPrice = p.finalPrice ?? p.price;
      return sellingPrice >= unitOriginalPaid;
    });

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
    console.error('[VAULT] getEligibleReplacementProducts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
