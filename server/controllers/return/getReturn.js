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

    // Attach current return address from Settings
    const Setting = (await import('../../models/Setting.js')).default;
    const settings = await Setting.findOne();
    const returnAddress = settings?.returnAddress || {
      street: 'VAULT Logistics Hub, Unit 4B, Signature Tower',
      city: 'Bandra Kurla Complex, Mumbai',
      state: 'Maharashtra',
      zip: '400051',
      phone: '+91 98765 43210',
      instructions: 'Pack the product securely in original packaging with tags and reference ID written on the box.',
    };

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

    returnRecord.customerShipment = {
      courierName: courierName ? courierName.trim() : 'Standard Courier',
      trackingNumber: trackingNumber ? trackingNumber.trim() : '',
      notes: notes ? notes.trim() : '',
      shippedAt: new Date(),
    };

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
