import Discount from '../models/Discount.js';
import Product from '../models/Product.js';
import { paginateAggregate } from '../utils/paginate.js';

// Create Discount
export const createDiscount = async (req, res) => {
  try {
    const {
      discountName,
      description,
      discountType,
      discountValue,
      applyType,
      product,
      category,
      selectedProducts,
      startDate,
      endDate,
      status,
      showOnHomepage,
      priority,
      showCountdown
    } = req.body;

    if (showCountdown === true && !endDate) {
      return res.status(400).json({ success: false, message: 'End Date is required when Countdown Timer is enabled.' });
    }

    // Basic Validations
    if (Number(discountValue) < 0) {
      return res.status(400).json({ success: false, message: 'Discount value cannot be negative' });
    }

    if (discountType === 'percentage' && Number(discountValue) > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be greater than start date' });
    }

    // Fixed amount pricing validation
    if (discountType === 'fixed' && applyType === 'product' && product) {
      const targetProd = await Product.findById(product);
      if (targetProd && Number(discountValue) > targetProd.price) {
        return res.status(400).json({ success: false, message: 'Fixed discount amount cannot exceed product price' });
      }
    }

    const discount = new Discount({
      discountName,
      description,
      discountType,
      discountValue: Number(discountValue),
      applyType,
      product: applyType === 'product' ? product : undefined,
      category: applyType === 'category' ? category : undefined,
      selectedProducts: applyType === 'selectedProducts' ? selectedProducts : undefined,
      startDate: start,
      endDate: end,
      status: status || 'active',
      showOnHomepage: !!showOnHomepage,
      priority: Number(priority) || 0,
      showCountdown: !!showCountdown,
      createdBy: req.user._id
    });

    const saved = await discount.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

// Update Discount
export const updateDiscount = async (req, res) => {
  try {
    const {
      discountName,
      description,
      discountType,
      discountValue,
      applyType,
      product,
      category,
      selectedProducts,
      startDate,
      endDate,
      status,
      showOnHomepage,
      priority,
      showCountdown
    } = req.body;

    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    if (showCountdown === true && !endDate && !discount.endDate) {
      return res.status(400).json({ success: false, message: 'End Date is required when Countdown Timer is enabled.' });
    }

    if (discountValue !== undefined && Number(discountValue) < 0) {
      return res.status(400).json({ success: false, message: 'Discount value cannot be negative' });
    }

    if (discountType === 'percentage' && discountValue !== undefined && Number(discountValue) > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
    }

    const start = startDate ? new Date(startDate) : discount.startDate;
    const end = endDate ? new Date(endDate) : discount.endDate;
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be greater than start date' });
    }

    discount.discountName = discountName || discount.discountName;
    discount.description = description || discount.description;
    discount.discountType = discountType || discount.discountType;
    if (discountValue !== undefined) discount.discountValue = Number(discountValue);
    discount.applyType = applyType || discount.applyType;
    discount.product = applyType === 'product' ? product : undefined;
    discount.category = applyType === 'category' ? category : undefined;
    discount.selectedProducts = applyType === 'selectedProducts' ? selectedProducts : undefined;
    discount.startDate = start;
    discount.endDate = end;
    if (status !== undefined) discount.status = status;
    if (showOnHomepage !== undefined) discount.showOnHomepage = !!showOnHomepage;
    if (priority !== undefined) discount.priority = Number(priority);
    if (showCountdown !== undefined) discount.showCountdown = !!showCountdown;

    const saved = await discount.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Enable / Disable status
export const toggleDiscountStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const discount = await Discount.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    res.json({ success: true, data: discount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Discount
export const deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }
    res.json({ success: true, message: 'Discount deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
