import Discount from '../../models/Discount.js';
import Product from '../../models/Product.js';
import { paginateAggregate } from '../../utils/paginate.js';

// Get List of Discounts
export const getDiscounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const matchQuery = {};

    if (search) {
      matchQuery.discountName = { $regex: search, $options: 'i' };
    }

    const lookupStages = [
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: { path: '$product', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: { path: '$category', preserveNullAndEmptyArrays: true }
      }
    ];

    const result = await paginateAggregate(
      Discount,
      matchQuery,
      { priority: -1, createdAt: -1 },
      page,
      limit,
      lookupStages
    );

    res.json({
      success: true,
      data: result.data,
      page: result.page,
      pages: result.pages,
      total: result.total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Discount
export const getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('product', 'name price')
      .populate('category', 'name')
      .populate('selectedProducts', 'name price');
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }
    res.json({ success: true, data: discount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
