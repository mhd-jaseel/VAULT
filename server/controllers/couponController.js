import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';
import CouponUsage from '../models/CouponUsage.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { paginateAggregate } from '../utils/paginate.js';

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

// Create Coupon
export const createCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      description,
      discountType,
      discountValue,
      minimumPurchase,
      maximumDiscount,
      usageLimit,
      userLimit,
      startDate,
      expiryDate,
      applicableCategories,
      applicableProducts,
      excludedProducts,
      firstOrderOnly,
      freeShipping,
      status
    } = req.body;

    // Convert code to uppercase
    const codeUpper = String(couponCode).toUpperCase().trim();

    // Validations
    const existing = await Coupon.findOne({ couponCode: codeUpper, isDeleted: false });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    if (Number(discountValue) < 0) {
      return res.status(400).json({ success: false, message: 'Discount value cannot be negative' });
    }

    if (discountType === 'percentage' && Number(discountValue) > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
    }

    if (Number(minimumPurchase) < 0) {
      return res.status(400).json({ success: false, message: 'Minimum purchase cannot be negative' });
    }

    if (discountType === 'percentage' && (!maximumDiscount || Number(maximumDiscount) <= 0)) {
      return res.status(400).json({ success: false, message: 'Maximum discount amount is required for percentage coupons' });
    }

    const start = new Date(startDate);
    const expiry = new Date(expiryDate);
    if (expiry <= start) {
      return res.status(400).json({ success: false, message: 'Expiry date must be greater than start date' });
    }

    if (Number(usageLimit) < 0) {
      return res.status(400).json({ success: false, message: 'Usage limit cannot be negative' });
    }

    if (Number(usageLimit) > 0 && Number(userLimit) > Number(usageLimit)) {
      return res.status(400).json({ success: false, message: 'Per-user limit cannot exceed total usage limit' });
    }

    const coupon = new Coupon({
      couponCode: codeUpper,
      description,
      discountType,
      discountValue: Number(discountValue),
      minimumPurchase: Number(minimumPurchase) || 0,
      maximumDiscount: discountType === 'percentage' ? Number(maximumDiscount) : undefined,
      usageLimit: Number(usageLimit) || 0,
      userLimit: Number(userLimit) || 1,
      startDate: start,
      expiryDate: expiry,
      applicableCategories: applicableCategories || [],
      applicableProducts: applicableProducts || [],
      excludedProducts: excludedProducts || [],
      firstOrderOnly: !!firstOrderOnly,
      freeShipping: !!freeShipping,
      status: status || 'active'
    });

    const saved = await coupon.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// View Coupon List
export const getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const matchQuery = { isDeleted: false };

    if (search) {
      matchQuery.couponCode = { $regex: search, $options: 'i' };
    }

    const result = await paginateAggregate(
      Coupon,
      matchQuery,
      { createdAt: -1 },
      page,
      limit
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

// Get Single Coupon
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, isDeleted: false });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit / Update Coupon
export const updateCoupon = async (req, res) => {
  try {
    const {
      description,
      discountType,
      discountValue,
      minimumPurchase,
      maximumDiscount,
      usageLimit,
      userLimit,
      startDate,
      expiryDate,
      applicableCategories,
      applicableProducts,
      excludedProducts,
      firstOrderOnly,
      freeShipping,
      status
    } = req.body;

    const coupon = await Coupon.findOne({ _id: req.params.id, isDeleted: false });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (discountValue !== undefined && Number(discountValue) < 0) {
      return res.status(400).json({ success: false, message: 'Discount value cannot be negative' });
    }

    if (discountType === 'percentage' && discountValue !== undefined && Number(discountValue) > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
    }

    const start = startDate ? new Date(startDate) : coupon.startDate;
    const expiry = expiryDate ? new Date(expiryDate) : coupon.expiryDate;
    if (expiry <= start) {
      return res.status(400).json({ success: false, message: 'Expiry date must be greater than start date' });
    }

    coupon.description = description || coupon.description;
    coupon.discountType = discountType || coupon.discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minimumPurchase !== undefined) coupon.minimumPurchase = Number(minimumPurchase);
    if (maximumDiscount !== undefined) {
      coupon.maximumDiscount = coupon.discountType === 'percentage' ? Number(maximumDiscount) : undefined;
    }
    if (usageLimit !== undefined) coupon.usageLimit = Number(usageLimit);
    if (userLimit !== undefined) coupon.userLimit = Number(userLimit);
    coupon.startDate = start;
    coupon.expiryDate = expiry;
    coupon.applicableCategories = applicableCategories || coupon.applicableCategories;
    coupon.applicableProducts = applicableProducts || coupon.applicableProducts;
    coupon.excludedProducts = excludedProducts || coupon.excludedProducts;
    if (firstOrderOnly !== undefined) coupon.firstOrderOnly = !!firstOrderOnly;
    if (freeShipping !== undefined) coupon.freeShipping = !!freeShipping;
    if (status !== undefined) coupon.status = status;

    const updated = await coupon.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Enable / Disable Coupon (Change Status)
export const toggleCouponStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft Delete Coupon
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, message: 'Coupon soft deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// CUSTOMER VALIDATIONS
// ==========================================

// Apply Coupon (Validation and discount computation)
export const applyCoupon = async (req, res) => {
  try {
    const { couponCode, items } = req.body;
    if (!couponCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    const codeUpper = String(couponCode).toUpperCase().trim();
    const coupon = await Coupon.findOne({ couponCode: codeUpper, isDeleted: false });

    // 1. Coupon exists
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid Coupon' });
    }

    // 2. Coupon is active
    if (coupon.status === 'inactive') {
      return res.status(400).json({ success: false, message: 'Coupon Disabled' });
    }

    // 3. Date checks
    const now = new Date();
    if (now < coupon.startDate) {
      return res.status(400).json({ success: false, message: 'Coupon Not Started' });
    }
    if (now > coupon.expiryDate) {
      return res.status(400).json({ success: false, message: 'Coupon Expired' });
    }

    // 4. Usage limit check
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon Usage Limit Reached' });
    }

    // 5. User usage limit check
    const userUsageCount = await CouponUsage.countDocuments({
      userId: req.user._id,
      couponId: coupon._id
    });
    if (userUsageCount >= coupon.userLimit) {
      return res.status(400).json({ success: false, message: 'Coupon Already Used' });
    }

    // 6. First Order check
    if (coupon.firstOrderOnly) {
      const ordersCount = await Order.countDocuments({
        user: req.user._id,
        status: { $ne: 'cancelled' }
      });
      if (ordersCount > 0) {
        return res.status(400).json({ success: false, message: 'Coupon Applicable to First Order Only' });
      }
    }

    // 7. Applicable products & categories subtotal calculation
    // Fetch product details for cart items to match categories
    const productIdsInCart = items.map(item => item.product._id || item.product);
    const cartProductDetails = await Product.find({ _id: { $in: productIdsInCart } });

    let eligibleSubtotal = 0;
    let hasEligibleItem = false;

    for (const item of items) {
      const prodIdStr = String(item.product._id || item.product);
      const details = cartProductDetails.find(p => String(p._id) === prodIdStr);

      if (!details) continue;

      // Check excluded products
      const isExcluded = coupon.excludedProducts.some(p => String(p) === prodIdStr);
      if (isExcluded) continue;

      // Check applicable products
      const hasProductRestriction = coupon.applicableProducts.length > 0;
      const isApplicableProduct = coupon.applicableProducts.some(p => String(p) === prodIdStr);

      // Check applicable categories
      const hasCategoryRestriction = coupon.applicableCategories.length > 0;
      const isApplicableCategory = details.category && coupon.applicableCategories.some(c => String(c) === String(details.category));

      const isEligible = 
        (!hasProductRestriction && !hasCategoryRestriction) ||
        (hasProductRestriction && isApplicableProduct) ||
        (hasCategoryRestriction && isApplicableCategory);

      if (isEligible) {
        eligibleSubtotal += Number(item.price) * Number(item.quantity);
        hasEligibleItem = true;
      }
    }

    if (!hasEligibleItem) {
      return res.status(400).json({ success: false, message: 'Coupon Not Applicable' });
    }

    // Check minimum purchase restriction
    if (eligibleSubtotal < coupon.minimumPurchase) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum Purchase Required: ₹${coupon.minimumPurchase}` 
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
      if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
        discountAmount = coupon.maximumDiscount;
      }
    } else {
      // Fixed Amount
      discountAmount = coupon.discountValue;
    }

    // Keep discount from exceeding total subtotal
    const cartSubtotal = items.reduce((acc, item) => acc + Number(item.price) * Number(item.quantity), 0);
    if (discountAmount > cartSubtotal) {
      discountAmount = cartSubtotal;
    }

    res.json({
      success: true,
      message: 'Coupon Applied Successfully',
      data: {
        couponId: coupon._id,
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        freeShipping: coupon.freeShipping
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
