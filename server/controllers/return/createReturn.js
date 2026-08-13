import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Return from '../../models/Return.js';
import Wallet from '../../models/Wallet.js';
import { calculateProductDiscounts } from '../../services/discountService.js';
import { createNotificationHelper } from '../../services/notificationHelper.js';

const generateReturnId = () => {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `RET-${rand}`;
};

// POST /api/returns
export const createReturnRequest = async (req, res) => {
  const {
    orderId,
    productId,
    settlementMethod,
    returnType: inputReturnType,
    reason,
    customerNotes,
  } = req.body;

  const actualSettlement = 'WALLET';
  const actualReturnType = (inputReturnType === 'REPLACEMENT') ? 'REPLACEMENT' : 'RETURN';

  if (!orderId || !productId || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Missing required return details.',
      code: 'VALIDATION_ERROR',
    });
  }



  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
        code: 'ORDER_NOT_FOUND',
      });
    }

    // Security: Verify ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized for this order.',
        code: 'UNAUTHORIZED_ACCESS',
      });
    }

    // Must be delivered
    if (order.status !== 'delivered') {
      return res.status(422).json({
        success: false,
        message: 'Return is only available for delivered orders.',
        code: 'ORDER_NOT_DELIVERED',
      });
    }

    // ── 3-Day Return Window Rule (Strict Server-Side Enforcement) ────────────
    const deliveredTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : new Date(order.updatedAt).getTime();
    const nowTime = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    if (nowTime - deliveredTime > THREE_DAYS_MS) {
      return res.status(422).json({
        success: false,
        message: 'Return period has expired. Returns can only be requested within 3 days of delivery.',
        code: 'RETURN_PERIOD_EXPIRED',
      });
    }

    // Find the order item
    const orderItem = order.items.find((item) => item.product.toString() === productId.toString());
    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in this order.',
        code: 'ITEM_NOT_FOUND',
      });
    }

    // If REPLACEMENT, validate current stock
    if (actualReturnType === 'REPLACEMENT') {
      const productDoc = await Product.findById(productId);
      if (!productDoc || productDoc.stock < orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Same product replacement is currently unavailable because this product is out of stock.',
          code: 'OUT_OF_STOCK',
        });
      }
    }

    // Check if an active return already exists for this order item (HTTP 409 Conflict)
    const existingReturn = await Return.findOne({
      order: order._id,
      'orderItem.product': orderItem.product,
      status: { $ne: 'REJECTED' },
    });

    if (existingReturn) {
      return res.status(409).json({
        success: false,
        message: 'A return request already exists for this item.',
        code: 'RETURN_ALREADY_EXISTS',
        data: existingReturn,
      });
    }

    // Handle evidence images if uploaded
    let evidenceImages = [];
    if (req.files && req.files.length > 0) {
      evidenceImages = req.files.map((file) => `/uploads/${file.filename}`);
    }

    // Use snapshot paid amount if available
    const totalOriginalPaid = orderItem.linePaidAmount !== undefined 
      ? orderItem.linePaidAmount 
      : (orderItem.price * orderItem.quantity);

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
      returnType: actualReturnType,
      settlementMethod: actualSettlement,
      reason,
      customerNotes: customerNotes ? String(customerNotes).slice(0, 1000) : '',
      evidenceImages,
      walletCreditStatus: (actualSettlement === 'WALLET' && actualReturnType === 'RETURN') ? 'PENDING' : 'NOT_APPLICABLE',
      status: 'REQUESTED',
      deliveredAtSnapshot: new Date(deliveredTime),
      timeline: [
        {
          status: 'REQUESTED',
          note: `${actualReturnType === 'REPLACEMENT' ? 'Replacement' : 'Return'} request submitted by customer. Reason: ${reason}`,
        },
      ],
    });

    const savedReturn = await returnRecord.save();

    // Trigger Admin Notification
    try {
      const notifType = actualReturnType === 'REPLACEMENT' ? 'REPLACEMENT_REQUEST' : 'RETURN_REQUEST';
      const notifAction = actualReturnType === 'REPLACEMENT' ? 'REVIEW_REPLACEMENT' : 'REVIEW_RETURN';
      
      await createNotificationHelper({
        type: notifType,
        title: `New ${actualReturnType === 'REPLACEMENT' ? 'Replacement' : 'Return'} Request`,
        message: `${req.user.name || 'Customer'} requested a ${actualReturnType.toLowerCase()} for ${orderItem.name} (${savedReturn.returnId})`,
        relatedId: savedReturn._id,
        relatedType: 'Return',
        action: notifAction,
      });
    } catch (notifErr) {
      console.error(`[VAULT] Failed to create notification for ${actualReturnType}`, notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully.',
      data: savedReturn,
    });
  } catch (error) {
    console.error('[VAULT] createReturnRequest error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};
