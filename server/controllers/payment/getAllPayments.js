import Payment from '../../models/Payment.js';
import { paginateAggregate } from '../../utils/paginate.js';

// GET /api/payments — Admin: list all payment records
export const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchQuery = {};
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
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'user.password': 0,
          'order.items': 0,
          'order.shippingAddress': 0,
        },
      },
    ];

    const result = await paginateAggregate(Payment, matchQuery, sortOptions, page, limit, lookupStages);

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
