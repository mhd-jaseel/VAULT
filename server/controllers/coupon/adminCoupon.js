import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import { paginateAggregate } from '../../utils/paginate.js';

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
