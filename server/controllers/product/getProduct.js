import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Discount from '../../models/Discount.js';
import Setting from '../../models/Setting.js';
import Return from '../../models/Return.js';
import { paginateAggregate } from '../../utils/paginate.js';
import { calculateProductDiscounts } from '../../services/discountService.js';

// Get all products with filters, sorting & search
export const getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 12, inStockOnly, showOnHomepage, returnId } = req.query;
    const query = {};

    let replacementContext = null;

    // ── Replacement Mode Context Verification ─────────────────────────────────
    if (returnId && mongoose.Types.ObjectId.isValid(returnId)) {
      const returnRecord = await Return.findById(returnId).populate('order');
      if (returnRecord && returnRecord.status !== 'REJECTED' && returnRecord.status !== 'CANCELLED' && returnRecord.status !== 'COMPLETED') {
        const unitOriginalPaid = returnRecord.orderItem?.price || 0;
        const totalOriginalPaid = returnRecord.orderItem?.totalOriginalPaid || 0;

        replacementContext = {
          returnId: returnRecord._id,
          returnCode: returnRecord.returnId,
          orderItemName: returnRecord.orderItem?.name,
          quantity: returnRecord.orderItem?.quantity || 1,
          unitOriginalPaid,
          totalOriginalPaid,
          walletCreditStatus: returnRecord.walletCreditStatus,
        };
      }
    }

    // Category Filter
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = new mongoose.Types.ObjectId(category);
    }

    // Homepage deals filter
    if (showOnHomepage === 'true') {
      const now = new Date();
      const homepageDiscounts = await Discount.find({
        status: 'active',
        showOnHomepage: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      });

      const productIds = [];
      const categoryIds = [];

      homepageDiscounts.forEach(d => {
        if (d.applyType === 'product' && d.product) {
          productIds.push(d.product);
        } else if (d.applyType === 'selectedProducts' && d.selectedProducts) {
          productIds.push(...d.selectedProducts);
        } else if (d.applyType === 'category' && d.category) {
          categoryIds.push(d.category);
        }
      });

      const matchCriteria = [];
      if (productIds.length > 0) {
        matchCriteria.push({ _id: { $in: productIds } });
      }
      if (categoryIds.length > 0) {
        matchCriteria.push({ category: { $in: categoryIds } });
      }

      if (matchCriteria.length > 0) {
        query.$or = matchCriteria;
      } else {
        query._id = new mongoose.Types.ObjectId();
      }
    }

    // Keyword Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Price Range Filter
    if (minPrice || maxPrice) {
      if (!query.price) query.price = {};
      if (minPrice) {
        const userMin = Number(minPrice);
        query.price.$gte = query.price.$gte ? Math.max(query.price.$gte, userMin) : userMin;
      }
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Stock Filter
    if (inStockOnly === 'true' || inStockOnly === true) {
      query.stock = { $gt: 0 };
    }

    // Sorting options
    let sortOptions = { createdAt: -1 }; // default newest
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'name_asc') {
      sortOptions = { name: 1 };
    } else if (sort === 'name_desc') {
      sortOptions = { name: -1 };
    }

    // Lookup stages to populate category and brand details
    const lookupStages = [
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $unwind: {
          path: '$brand',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const result = await paginateAggregate(
      Product,
      query,
      sortOptions,
      page,
      limit,
      lookupStages
    );

    let productsWithDiscounts = await calculateProductDiscounts(result.data);

    res.json({
      success: true,
      data: productsWithDiscounts,
      page: result.page,
      pages: result.pages,
      total: result.total,
      replacementContext,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single product details
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('brand', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const productWithDiscount = await calculateProductDiscounts(product);
    res.json({ success: true, data: productWithDiscount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get related products (same category, excluding current product)
export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .limit(4)
      .populate('category', 'name')
      .populate('brand', 'name');

    const relatedWithDiscounts = await calculateProductDiscounts(related);

    res.json({ success: true, data: relatedWithDiscounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get products with active discounts for homepage Deals section
export const getDiscountedProducts = async (req, res) => {
  try {
    const now = new Date();
    // 1. Fetch active discounts where showOnHomepage = true
    const activeDiscounts = await Discount.find({
      status: 'active',
      showOnHomepage: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    if (activeDiscounts.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. Extract productIds, categoryIds, selectedProducts
    const productIds = [];
    const categoryIds = [];
    activeDiscounts.forEach(d => {
      if (d.applyType === 'product' && d.product) {
        productIds.push(d.product);
      } else if (d.applyType === 'selectedProducts' && d.selectedProducts) {
        productIds.push(...d.selectedProducts);
      } else if (d.applyType === 'category' && d.category) {
        categoryIds.push(d.category);
      }
    });

    // 3. Find products
    const query = {
      $or: []
    };
    if (productIds.length > 0) {
      query.$or.push({ _id: { $in: productIds } });
    }
    if (categoryIds.length > 0) {
      query.$or.push({ category: { $in: categoryIds } });
    }

    if (query.$or.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('brand', 'name');

    // 4. Calculate prices with existing discount logic
    let productsWithDiscounts = await calculateProductDiscounts(products);
    
    // Filter out items without active discount
    productsWithDiscounts = productsWithDiscounts.filter(p => p.isDiscounted);

    // 5. Fetch settings to determine sorting order
    const settings = await Setting.findOne();
    const displayOrder = settings?.discountProductsDisplayOrder || 'priority';

    // 6. Sort products accordingly
    if (displayOrder === 'highest') {
      productsWithDiscounts.sort((a, b) => {
        const aPct = ((a.originalPrice - a.finalPrice) / a.originalPrice) * 100;
        const bPct = ((b.originalPrice - b.finalPrice) / b.originalPrice) * 100;
        return bPct - aPct;
      });
    } else if (displayOrder === 'lowest') {
      productsWithDiscounts.sort((a, b) => {
        const aPct = ((a.originalPrice - a.finalPrice) / a.originalPrice) * 100;
        const bPct = ((b.originalPrice - b.finalPrice) / b.originalPrice) * 100;
        return aPct - bPct;
      });
    } else if (displayOrder === 'latest') {
      productsWithDiscounts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      // Manual priority (sort by discount priority field from best discount)
      productsWithDiscounts.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    res.json({ success: true, data: productsWithDiscounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
