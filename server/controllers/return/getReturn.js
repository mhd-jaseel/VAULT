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
    const now = new Date();
    const courier = courierName ? courierName.trim() : 'Standard Courier';
    const tracking = trackingNumber ? trackingNumber.trim() : '';
    const note = notes ? notes.trim() : '';

    // Atomic update: only transition if current status is strictly 'APPROVED'
    const returnRecord = await Return.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        status: 'APPROVED',
      },
      {
        $set: {
          status: 'ITEM_SHIPPED',
          customerShippedAt: now,
          customerShipment: {
            courierName: courier,
            trackingNumber: tracking,
            notes: note,
            shippedAt: now,
          },
        },
        $push: {
          timeline: {
            status: 'ITEM_SHIPPED',
            timestamp: now,
            note: `Customer confirmed product shipment via ${courier}${tracking ? ` (Tracking: ${tracking})` : ''}.`,
          },
        },
      },
      { new: true }
    );

    if (!returnRecord) {
      // Find return without status condition to return accurate message
      const existing = await Return.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Return record not found.' });
      }
      if (existing.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
      return res.status(400).json({
        success: false,
        message: `Product shipping cannot be submitted. Current status is ${existing.status}.`,
      });
    }

    res.json({
      success: true,
      message: 'Return shipment details saved. Our team will verify upon receipt.',
      data: returnRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
