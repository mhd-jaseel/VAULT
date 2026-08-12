import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Return from '../../models/Return.js';

const generateReturnId = () => {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `RET-${rand}`;
};

// POST /api/returns
export const createReturnRequest = async (req, res) => {
  const {
    orderId,
    productId,
    returnType,
    reason,
    customerNotes,
    replacementProductId,
  } = req.body;

  if (!orderId || !productId || !returnType || !reason) {
    return res.status(400).json({ success: false, message: 'Missing required return details.' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security: Verify ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order.' });
    }

    // Must be delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Return is only available for delivered orders.' });
    }

    // ── 3-Day Return Window Rule (Strict Server-Side Enforcement) ────────────
    const deliveredTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : new Date(order.updatedAt).getTime();
    const nowTime = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    if (nowTime - deliveredTime > THREE_DAYS_MS) {
      return res.status(400).json({
        success: false,
        message: 'Return window expired. Returns can only be requested within 3 days of delivery.',
      });
    }

    // Find the order item
    const orderItem = order.items.find((item) => item.product.toString() === productId.toString());
    if (!orderItem) {
      return res.status(404).json({ success: false, message: 'Product not found in this order.' });
    }

    // Check if an active return already exists for this order item
    const existingReturn = await Return.findOne({
      order: order._id,
      'orderItem.product': orderItem.product,
      status: { $ne: 'REJECTED' },
    });

    if (existingReturn) {
      return res.status(400).json({
        success: false,
        message: 'A return request has already been submitted for this item.',
      });
    }

    // Handle evidence images if uploaded
    let evidenceImages = [];
    if (req.files && req.files.length > 0) {
      evidenceImages = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const totalOriginalPaid = orderItem.price * orderItem.quantity;
    let replacementProductObj = null;
    let replacementPrice = 0;
    let additionalAmount = 0;
    let replacementPaymentStatus = 'NOT_REQUIRED';

    // ── Replacement Flow Validation ──────────────────────────────────────────
    if (returnType === 'replacement') {
      if (!replacementProductId) {
        return res.status(400).json({ success: false, message: 'Please select a replacement product.' });
      }

      replacementProductObj = await Product.findById(replacementProductId);
      if (!replacementProductObj) {
        return res.status(404).json({ success: false, message: 'Selected replacement product not found.' });
      }

      if (replacementProductObj.status === 'inactive' || replacementProductObj.isDeleted) {
        return res.status(400).json({ success: false, message: 'Selected replacement product is unavailable.' });
      }

      if (replacementProductObj.stock < orderItem.quantity) {
        return res.status(400).json({ success: false, message: 'Selected replacement product is out of stock.' });
      }

      replacementPrice = replacementProductObj.price * orderItem.quantity;

      // RULE: Lower-priced replacement strictly prohibited
      if (replacementPrice < totalOriginalPaid) {
        return res.status(400).json({
          success: false,
          message: 'Replacement product price cannot be less than the original amount paid.',
        });
      }

      // Calculate difference
      additionalAmount = replacementPrice - totalOriginalPaid;
      if (additionalAmount > 0) {
        replacementPaymentStatus = 'PENDING';
      }
    }

    // Create Return Record
    const returnRecord = new Return({
      returnId: generateReturnId(),
      user: req.user._id,
      order: order._id,
      orderItem: {
        product: orderItem.product,
        name: orderItem.name,
        price: orderItem.price,
        quantity: orderItem.quantity,
        totalOriginalPaid,
      },
      returnType,
      reason,
      customerNotes,
      evidenceImages,
      replacementProduct: replacementProductObj ? replacementProductObj._id : undefined,
      replacementProductName: replacementProductObj ? replacementProductObj.name : undefined,
      replacementProductImage: replacementProductObj && replacementProductObj.images?.length > 0 ? replacementProductObj.images[0] : undefined,
      replacementPrice: returnType === 'replacement' ? replacementPrice : undefined,
      additionalAmount,
      replacementPaymentStatus,
      status: 'REQUESTED',
      deliveredAtSnapshot: new Date(deliveredTime),
      timeline: [
        {
          status: 'REQUESTED',
          note: `Return ${returnType} request submitted by customer. Reason: ${reason}`,
        },
      ],
    });

    const savedReturn = await returnRecord.save();

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully.',
      data: savedReturn,
    });
  } catch (error) {
    console.error('[VAULT] createReturnRequest error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
