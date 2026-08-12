import Product from '../../models/Product.js';
import Return from '../../models/Return.js';
import { paginateAggregate } from '../../utils/paginate.js';

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
  const { status, note, rejectionReason } = req.body;

  try {
    const returnRecord = await Return.findById(req.params.id);
    if (!returnRecord) return res.status(404).json({ success: false, message: 'Return record not found.' });

    // Validate status transition safety
    const allowedStatuses = [
      'REQUESTED',
      'APPROVED',
      'REJECTED',
      'RECEIVED',
      'INSPECTING',
      'REFUND_PROCESSING',
      'REFUNDED',
      'REPLACEMENT_PROCESSING',
      'REPLACEMENT_SHIPPED',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid return status.' });
    }

    if (status === 'REJECTED' && rejectionReason) {
      returnRecord.rejectionReason = rejectionReason;
    }

    returnRecord.status = status;
    returnRecord.timeline.push({
      status,
      note: note || `Return status updated to ${status} by admin.`,
    });

    await returnRecord.save();

    res.json({ success: true, message: `Return status updated to ${status}.`, data: returnRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/returns/admin/:id/refund
export const processManualRefundAdmin = async (req, res) => {
  const { amount, method, transactionId, refundDate, adminNotes } = req.body;

  if (!amount || !method || !transactionId) {
    return res.status(400).json({ success: false, message: 'Amount, Method, and Transaction ID are required for manual refund.' });
  }

  try {
    const returnRecord = await Return.findById(req.params.id);
    if (!returnRecord) return res.status(404).json({ success: false, message: 'Return record not found.' });

    if (returnRecord.returnType !== 'refund') {
      return res.status(400).json({ success: false, message: 'This return is not for a refund.' });
    }

    if (returnRecord.status === 'REFUNDED') {
      return res.status(400).json({ success: false, message: 'Refund has already been completed for this return.' });
    }

    let proofImage = undefined;
    if (req.file) {
      proofImage = `/uploads/${req.file.filename}`;
    }

    returnRecord.refundDetails = {
      amount: Number(amount),
      method,
      transactionId,
      refundDate: refundDate ? new Date(refundDate) : new Date(),
      adminNotes,
      proofImage,
    };

    returnRecord.status = 'REFUNDED';
    returnRecord.timeline.push({
      status: 'REFUNDED',
      note: `Manual refund of ₹${amount} issued via ${method}. TXN: ${transactionId}`,
    });

    await returnRecord.save();

    res.json({
      success: true,
      message: 'Manual refund audit details recorded and return completed.',
      data: returnRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/returns/admin/:id/replacement-ship
export const processReplacementShipAdmin = async (req, res) => {
  const { trackingNote } = req.body;

  try {
    const returnRecord = await Return.findById(req.params.id);
    if (!returnRecord) return res.status(404).json({ success: false, message: 'Return record not found.' });

    if (returnRecord.returnType !== 'replacement') {
      return res.status(400).json({ success: false, message: 'This request is not a replacement.' });
    }

    // Check payment if additional amount was required
    if (returnRecord.additionalAmount > 0 && returnRecord.replacementPaymentStatus !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot ship replacement. Customer additional payment is pending.',
      });
    }

    // Deduct stock for replacement product if not already reserved
    if (!returnRecord.stockReserved && returnRecord.replacementProduct) {
      const repProduct = await Product.findById(returnRecord.replacementProduct);
      if (repProduct) {
        repProduct.stock = Math.max(0, repProduct.stock - returnRecord.orderItem.quantity);
        await repProduct.save();
      }
      returnRecord.stockReserved = true;
    }

    returnRecord.status = 'REPLACEMENT_SHIPPED';
    returnRecord.timeline.push({
      status: 'REPLACEMENT_SHIPPED',
      note: trackingNote || 'Replacement dispatch confirmed by admin.',
    });

    await returnRecord.save();

    res.json({ success: true, message: 'Replacement shipped successfully.', data: returnRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
