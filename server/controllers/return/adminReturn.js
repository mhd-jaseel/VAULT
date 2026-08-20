import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Return from '../../models/Return.js';
import User from '../../models/User.js';
import { paginateAggregate } from '../../utils/paginate.js';
import { creditReturnToWallet } from '../../services/walletService.js';

// Strict Admin State Transition Map
const ALLOWED_ADMIN_TRANSITIONS = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: [], // Admin cannot jump directly to PRODUCT_RECEIVED; customer must mark as ITEM_SHIPPED
  ITEM_SHIPPED: ['PRODUCT_RECEIVED'],
  PRODUCT_RECEIVED: ['WALLET_CREDITED', 'REPLACEMENT_APPROVED'],
  REPLACEMENT_APPROVED: ['REPLACEMENT_SHIPPED'],
  WALLET_CREDITED: ['COMPLETED'],
  REPLACEMENT_SHIPPED: ['COMPLETED'],
  REJECTED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

// GET /api/returns/admin/all
export const getAllReturnsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, returnType } = req.query;
    const matchQuery = {};

    if (status) matchQuery.status = status;
    if (returnType) matchQuery.returnType = returnType;

    const sortOptions = { createdAt: -1 };
    const lookupStages = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItem.product',
          foreignField: '_id',
          as: 'populatedProduct',
        },
      },
      { $unwind: { path: '$populatedProduct', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'wallettransactions',
          localField: 'walletTransaction',
          foreignField: '_id',
          as: 'walletTransaction',
        },
      },
      { $unwind: { path: '$walletTransaction', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'user.password': 0,
        },
      },
    ];

    const result = await paginateAggregate(Return, matchQuery, sortOptions, page, limit, lookupStages);

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

// PATCH /api/returns/admin/:id/status
export const updateReturnStatusAdmin = async (req, res) => {
  const { status: targetStatus, note, rejectionReason, courierName, trackingNumber, notes } = req.body;

  try {
    const returnRecord = await Return.findById(req.params.id);
    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return record not found.',
        code: 'RETURN_NOT_FOUND',
      });
    }

    const currentStatus = returnRecord.status;

    // 1. Check if already in target status
    if (currentStatus === targetStatus) {
      return res.status(400).json({
        success: false,
        message: `Return is already in ${currentStatus} status.`,
        code: 'ALREADY_IN_STATUS',
      });
    }

    // 2. Protection: COMPLETED returns cannot be modified further
    if (currentStatus === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'This return is already completed and cannot be modified.',
        code: 'RETURN_ALREADY_COMPLETED',
      });
    }

    // 3. Strict State Machine Validation
    const allowedTargets = ALLOWED_ADMIN_TRANSITIONS[currentStatus] || [];
    if (!allowedTargets.includes(targetStatus)) {
      // Provide high-context descriptive error messages
      if (currentStatus === 'REQUESTED' && targetStatus === 'WALLET_CREDITED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot process wallet refund before the return is approved and the product is received.',
          code: 'INVALID_TRANSITION',
        });
      }
      if (currentStatus === 'REQUESTED' && targetStatus === 'PRODUCT_RECEIVED') {
        return res.status(400).json({
          success: false,
          message: 'Product cannot be marked received before the return is approved and shipped by customer.',
          code: 'INVALID_TRANSITION',
        });
      }
      if (currentStatus === 'REQUESTED' && ['REPLACEMENT_APPROVED', 'REPLACEMENT_SHIPPED'].includes(targetStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot approve or ship replacement before the return is approved and product is received.',
          code: 'INVALID_TRANSITION',
        });
      }
      if (currentStatus === 'APPROVED' && targetStatus === 'PRODUCT_RECEIVED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot mark product received before the customer confirms shipment.',
          code: 'INVALID_TRANSITION',
        });
      }
      if (currentStatus === 'APPROVED' && targetStatus === 'WALLET_CREDITED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot process wallet refund before the returned product is received.',
          code: 'INVALID_TRANSITION',
        });
      }
      if (currentStatus === 'ITEM_SHIPPED' && targetStatus === 'WALLET_CREDITED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot process wallet refund before the returned product is received at warehouse.',
          code: 'INVALID_TRANSITION',
        });
      }
      if (currentStatus === 'WALLET_CREDITED' && targetStatus === 'REPLACEMENT_APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'This return has already been refunded to the customer wallet.',
          code: 'INVALID_TRANSITION',
        });
      }
      if (currentStatus === 'REPLACEMENT_SHIPPED' && targetStatus === 'WALLET_CREDITED') {
        return res.status(400).json({
          success: false,
          message: 'Replacement has already been shipped.',
          code: 'INVALID_TRANSITION',
        });
      }
      if (currentStatus === 'REJECTED' && targetStatus !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'A rejected return can only be closed as completed.',
          code: 'INVALID_TRANSITION',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid return status transition from ${currentStatus} to ${targetStatus}.`,
        code: 'INVALID_TRANSITION',
      });
    }

    // 4. Handle State Specific Actions

    // A) APPROVE RETURN: Capture Return Shipping Address Snapshot
    if (targetStatus === 'APPROVED') {
      const Setting = (await import('../../models/Setting.js')).default;
      const settings = await Setting.findOne();
      const addr = settings?.returnAddress || {};
      returnRecord.returnShippingAddressSnapshot = {
        recipientName: addr.recipientName || 'VAULT Returns Department',
        addressLine1: addr.addressLine1 || 'Unit 4B, Signature Tower',
        addressLine2: addr.addressLine2 || 'G-Block, BKC Road',
        city: addr.city || 'Mumbai',
        district: addr.district || 'Mumbai Suburban',
        state: addr.state || 'Maharashtra',
        pinCode: addr.pinCode || '400051',
        phone: addr.phone || '+91 98765 43210',
        whatsapp: addr.whatsapp || '+91 98765 43210',
        instructions: addr.instructions || 'Pack the product securely in its original packaging with all tags attached. Please write the Return Reference ID clearly on top of the outer shipping box.',
      };
      returnRecord.status = 'APPROVED';
      returnRecord.timeline.push({
        status: 'APPROVED',
        note: note ? String(note).slice(0, 500) : 'Return request approved by admin. Return shipping address provided to customer.',
      });
      await returnRecord.save();
    }

    // B) REJECT RETURN
    else if (targetStatus === 'REJECTED') {
      const reasonText = rejectionReason?.trim() || note?.trim() || 'Return request rejected by admin.';
      returnRecord.rejectionReason = String(reasonText).slice(0, 500);
      returnRecord.activeItemKey = null;
      returnRecord.status = 'REJECTED';
      returnRecord.timeline.push({
        status: 'REJECTED',
        note: `Return request rejected by admin. Reason: ${reasonText}`,
      });
      await returnRecord.save();
    }

    // C) PRODUCT RECEIVED
    else if (targetStatus === 'PRODUCT_RECEIVED') {
      returnRecord.productReceivedAt = new Date();
      returnRecord.status = 'PRODUCT_RECEIVED';
      returnRecord.timeline.push({
        status: 'PRODUCT_RECEIVED',
        note: note ? String(note).slice(0, 500) : 'Returned product received at warehouse and verified.',
      });
      await returnRecord.save();
    }

    // D) WALLET REFUND (Idempotent Wallet Credit)
    else if (targetStatus === 'WALLET_CREDITED') {
      if (returnRecord.walletCreditStatus === 'CREDITED') {
        return res.status(400).json({
          success: false,
          message: 'This return has already been refunded to wallet.',
          code: 'ALREADY_REFUNDED',
        });
      }

      await creditReturnToWallet(returnRecord._id, req.user._id);
    }

    // E) REPLACEMENT APPROVAL (Atomic Stock Validation & Deduction)
    else if (targetStatus === 'REPLACEMENT_APPROVED') {
      const prodId = returnRecord.orderItem?.product?._id || returnRecord.orderItem?.product;
      const qtyRequired = returnRecord.orderItem?.quantity || 1;

      if (!prodId) {
        return res.status(400).json({
          success: false,
          message: 'Product information is missing for this return item.',
          code: 'PRODUCT_NOT_FOUND',
        });
      }

      // Atomic stock deduction preventing race conditions
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: prodId, stock: { $gte: qtyRequired } },
        { $inc: { stock: -qtyRequired } },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(400).json({
          success: false,
          message: 'Replacement cannot be approved because the product is out of stock.',
          code: 'OUT_OF_STOCK',
        });
      }

      returnRecord.stockReserved = true;
      returnRecord.status = 'REPLACEMENT_APPROVED';
      returnRecord.timeline.push({
        status: 'REPLACEMENT_APPROVED',
        note: note ? String(note).slice(0, 500) : 'Replacement request approved by admin. Replacement unit stock has been reserved.',
      });
      await returnRecord.save();
    }

    // F) REPLACEMENT SHIPPED
    else if (targetStatus === 'REPLACEMENT_SHIPPED') {
      const carrier = courierName?.trim() || 'Vault Express Logistics';
      const tracking = trackingNumber?.trim() || '';
      const shipNotes = notes?.trim() || note?.trim() || '';
      const now = new Date();

      returnRecord.replacementShipment = {
        courierName: carrier,
        trackingNumber: tracking,
        shippedAt: now,
        notes: shipNotes,
      };
      returnRecord.replacementShippedAt = now;
      returnRecord.status = 'REPLACEMENT_SHIPPED';
      returnRecord.timeline.push({
        status: 'REPLACEMENT_SHIPPED',
        note: `Replacement shipped via ${carrier}${tracking ? ` (Tracking: ${tracking})` : ''}.`,
      });
      await returnRecord.save();
    }

    // G) COMPLETED
    else if (targetStatus === 'COMPLETED') {
      returnRecord.status = 'COMPLETED';
      returnRecord.timeline.push({
        status: 'COMPLETED',
        note: note ? String(note).slice(0, 500) : 'Return resolution completed and request closed.',
      });
      await returnRecord.save();
    }

    const updatedRecord = await Return.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('order')
      .populate('orderItem.product')
      .populate('walletTransaction');

    res.json({
      success: true,
      statusUpdated: true,
      message: `Return status updated to ${targetStatus}.`,
      data: updatedRecord,
    });
  } catch (error) {
    console.error('[VAULT] updateReturnStatusAdmin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

// PATCH /api/returns/admin/:id/replacement-ship
export const processReplacementShipAdmin = async (req, res) => {
  const { courierName, trackingNumber, notes, trackingNote } = req.body;

  try {
    const returnRecord = await Return.findById(req.params.id);
    if (!returnRecord) {
      return res.status(404).json({ success: false, message: 'Return record not found.' });
    }

    if (returnRecord.status !== 'REPLACEMENT_APPROVED') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark replacement shipped. Current status is ${returnRecord.status}. Must be REPLACEMENT_APPROVED.`,
      });
    }

    const carrier = courierName?.trim() || 'Vault Express Logistics';
    const tracking = trackingNumber?.trim() || '';
    const shipNotes = notes?.trim() || trackingNote?.trim() || '';
    const now = new Date();

    returnRecord.replacementShipment = {
      courierName: carrier,
      trackingNumber: tracking,
      shippedAt: now,
      notes: shipNotes,
    };
    returnRecord.replacementShippedAt = now;
    returnRecord.status = 'REPLACEMENT_SHIPPED';
    returnRecord.timeline.push({
      status: 'REPLACEMENT_SHIPPED',
      note: `Replacement shipped via ${carrier}${tracking ? ` (Tracking: ${tracking})` : ''}.`,
    });

    await returnRecord.save();

    const updatedRecord = await Return.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('order')
      .populate('orderItem.product')
      .populate('walletTransaction');

    res.json({
      success: true,
      statusUpdated: true,
      message: 'Replacement shipped successfully.',
      data: updatedRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
