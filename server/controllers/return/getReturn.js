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

    res.json({ success: true, data: returnRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
