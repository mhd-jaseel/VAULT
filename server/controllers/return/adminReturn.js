import Product from '../../models/Product.js';
import Return from '../../models/Return.js';
import User from '../../models/User.js';
import { paginateAggregate } from '../../utils/paginate.js';
import { creditReturnToWallet } from '../../services/walletService.js';

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
    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return record not found.',
        code: 'RETURN_NOT_FOUND',
      });
    }

    const currentStatus = returnRecord.status;

    // Protection: Once COMPLETED or REJECTED, status cannot be mutated arbitrarily
    if (['COMPLETED', 'REJECTED'].includes(currentStatus)) {
      return res.status(409).json({
        success: false,
        message: `This return is already ${currentStatus} and cannot be modified further.`,
        code: 'INVALID_RETURN_STATUS',
      });
    }

    // Validate status transition safety
    const allowedStatuses = [
      'REQUESTED',
      'APPROVED',
      'REPLACEMENT_APPROVED',
      'REPLACEMENT_SHIPPED',
      'REJECTED',
      'WALLET_CREDITED',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid return status value.',
        code: 'INVALID_STATUS_VALUE',
      });
    }

    if (status === 'REJECTED' && rejectionReason) {
      returnRecord.rejectionReason = String(rejectionReason).slice(0, 500);
    }

    // Atomic Stock Validation and Deduction for Replacement
    if (status === 'REPLACEMENT_APPROVED' && currentStatus !== 'REPLACEMENT_APPROVED') {
      const repProduct = await Product.findById(returnRecord.orderItem.product);
      if (!repProduct || repProduct.stock < returnRecord.orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Replacement cannot be confirmed because the product is currently out of stock.',
          code: 'OUT_OF_STOCK',
        });
      }
      // Deduct stock
      repProduct.stock -= returnRecord.orderItem.quantity;
      await repProduct.save();
      returnRecord.stockReserved = true;
    }

    returnRecord.status = status;
    returnRecord.timeline.push({
      status,
      note: note ? String(note).slice(0, 500) : `Return status updated to ${status} by admin.`,
    });

    await returnRecord.save();

    // Trigger wallet credit if settlementMethod === 'WALLET' and approved/credited
    if (returnRecord.settlementMethod === 'WALLET' && ['APPROVED', 'WALLET_CREDITED'].includes(status)) {
      if (returnRecord.walletCreditStatus !== 'CREDITED') {
        await creditReturnToWallet(returnRecord._id, req.user._id);
      }
    }

    const updatedRecord = await Return.findById(req.params.id).populate('walletTransaction');
    console.log(`Return status updated: #${updatedRecord.returnId || updatedRecord._id}`);
    console.log(`Previous status: ${currentStatus}`);
    console.log(`New status: ${status}`);

    res.json({ success: true, statusUpdated: true, message: `Return status updated to ${status}.`, data: updatedRecord });
  } catch (error) {
    console.error('[VAULT] updateReturnStatusAdmin error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};


// PATCH /api/returns/admin/:id/replacement-ship
export const processReplacementShipAdmin = async (req, res) => {
  const { trackingNote } = req.body;

  try {
    const returnRecord = await Return.findById(req.params.id);
    if (!returnRecord) return res.status(404).json({ success: false, message: 'Return record not found.' });

    if (returnRecord.returnType !== 'REPLACEMENT') {
      return res.status(400).json({ success: false, message: 'This request is not a replacement.' });
    }

    const currentStatus = returnRecord.status;
    returnRecord.status = 'REPLACEMENT_SHIPPED';
    returnRecord.timeline.push({
      status: 'REPLACEMENT_SHIPPED',
      note: trackingNote || 'Replacement dispatch confirmed by admin.',
    });

    await returnRecord.save();
    console.log(`Return status updated: #${returnRecord.returnId || returnRecord._id}`);
    console.log(`Previous status: ${currentStatus}`);
    console.log(`New status: REPLACEMENT_SHIPPED`);

    res.json({ success: true, statusUpdated: true, message: 'Replacement shipped successfully.', data: returnRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
