import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Return from '../../models/Return.js';
import Wallet from '../../models/Wallet.js';
import { calculateProductDiscounts } from '../../services/discountService.js';
import { createNotificationHelper } from '../../services/notificationHelper.js';
import { uploadToCloudinary } from '../../services/cloudinaryService.js';

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
    if (!order.deliveredAt) {
      return res.status(400).json({
        success: false,
        message: 'Order delivery timestamp is missing. Please contact customer support.',
        code: 'DELIVERY_DATE_MISSING',
      });
    }

    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // Exact 72 hours
    const deliveredTime = new Date(order.deliveredAt).getTime();
    const returnDeadline = deliveredTime + THREE_DAYS_MS;
    const nowTime = Date.now();

    if (nowTime > returnDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Return window has expired. Returns can only be requested within 3 days of delivery.',
        code: 'RETURN_PERIOD_EXPIRED',
        data: {
          deliveredAt: order.deliveredAt,
          returnDeadline: new Date(returnDeadline),
        },
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

    // Verify item is active and eligible
    if (['CANCELLED', 'RETURNED'].includes(orderItem.status)) {
      return res.status(400).json({
        success: false,
        message: `This item is already ${orderItem.status.toLowerCase()} and cannot be returned.`,
        code: 'ITEM_NOT_ELIGIBLE',
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

    // Handle evidence images if uploaded via Cloudinary
    let evidenceImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadedUrl = await uploadToCloudinary(file.path || file.filename, 'vault/returns');
        if (uploadedUrl) {
          evidenceImages.push(uploadedUrl);
        }
      }
    }

    // Use snapshot paid amount if available
    const totalOriginalPaid = orderItem.linePaidAmount !== undefined 
      ? orderItem.linePaidAmount 
      : (orderItem.price * orderItem.quantity);

    // Create Return Record
    const returnRecord = new Return({
      returnId: generateReturnId(),
      activeItemKey: `${order._id}_${orderItem.product}`,
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
    if (error.code === 11000) {
      const existingReturn = await Return.findOne({
        order: orderId,
        'orderItem.product': productId,
        status: { $ne: 'REJECTED' },
      });
      return res.status(409).json({
        success: false,
        message: 'A return request already exists for this item.',
        code: 'RETURN_ALREADY_EXISTS',
        data: existingReturn,
      });
    }

    console.error('[VAULT] createReturnRequest error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};
