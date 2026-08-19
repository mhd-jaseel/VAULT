import mongoose from 'mongoose';
import Return from '../../models/Return.js';
import { paginateAggregate } from '../../utils/paginate.js';

// GET /api/returns/my-returns
export const getMyReturns = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userIdObj = typeof req.user._id === 'string' ? new mongoose.Types.ObjectId(req.user._id) : req.user._id;
    const matchQuery = { user: userIdObj };
    const sortOptions = { createdAt: -1 };

    const result = await paginateAggregate(Return, matchQuery, sortOptions, page, limit);

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

// GET /api/returns/:id
export const getReturnById = async (req, res) => {
  try {
    const returnRecord = await Return.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('order')
      .populate('orderItem.product');

    if (!returnRecord) {
      return res.status(404).json({ success: false, message: 'Return record not found.' });
    }

    if (returnRecord.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Prefer saved snapshot on returnRecord, fallback gracefully to current Settings
    let returnAddress = returnRecord.returnShippingAddressSnapshot;
    if (!returnAddress || !returnAddress.addressLine1) {
      const Setting = (await import('../../models/Setting.js')).default;
      const settings = await Setting.findOne();
      const addr = settings?.returnAddress || {};
      returnAddress = {
        recipientName: addr.recipientName || 'VAULT Returns Department',
        addressLine1: addr.addressLine1 || addr.street || 'Unit 4B, Signature Tower',
        addressLine2: addr.addressLine2 || '',
        city: addr.city || 'Mumbai',
        district: addr.district || 'Mumbai Suburban',
        state: addr.state || 'Maharashtra',
        pinCode: addr.pinCode || addr.zip || '400051',
        phone: addr.phone || '+91 98765 43210',
        whatsapp: addr.whatsapp || '+91 98765 43210',
        instructions: addr.instructions || 'Pack the product securely in its original packaging with all tags attached. Please write the Return Reference ID clearly on top of the outer shipping box.',
      };
    }

    const returnObj = returnRecord.toObject ? returnRecord.toObject() : { ...returnRecord };
    returnObj.returnAddress = returnAddress;

    res.json({ success: true, data: returnObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/returns/:id/ship (Customer: Confirm I have shipped the product)
export const markItemShippedCustomer = async (req, res) => {
  try {
    const { courierName, trackingNumber, notes } = req.body;
    const returnRecord = await Return.findById(req.params.id);

    if (!returnRecord) {
      return res.status(404).json({ success: false, message: 'Return record not found.' });
    }

    if (returnRecord.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (returnRecord.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: `Product shipping can only be submitted when return is APPROVED. Current status is ${returnRecord.status}.`,
      });
    }

    const now = new Date();
    returnRecord.customerShipment = {
      courierName: courierName ? courierName.trim() : 'Standard Courier',
      trackingNumber: trackingNumber ? trackingNumber.trim() : '',
      notes: notes ? notes.trim() : '',
      shippedAt: now,
    };
    returnRecord.customerShippedAt = now;

    returnRecord.status = 'ITEM_SHIPPED';
    returnRecord.timeline.push({
      status: 'ITEM_SHIPPED',
      note: `Customer confirmed product shipment via ${courierName || 'Courier'}${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}.`,
    });

    await returnRecord.save();

    res.json({
      success: true,
      message: 'Return shipment details saved. Our team will verify upon receipt.',
      data: returnRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
