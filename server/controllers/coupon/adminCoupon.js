import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import { paginateAggregate } from '../../utils/paginate.js';
import crypto from 'crypto';

/**
 * Generates a unique, readable, uppercase alphanumeric coupon code.
 * Example formats: VAULT10, VAULT20, VAULT50, VAULTX7K9P, SAVE25X8Q
 */
export const generateUniqueCouponCode = async (prefix = 'VAULT') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude confusing chars like 0, O, 1, I
  let attempts = 0;
  while (attempts < 10) {
    attempts++;
    let randomPart = '';
    const bytes = crypto.randomBytes(5);
    for (let i = 0; i < 5; i++) {
      randomPart += chars[bytes[i] % chars.length];
    }
    const candidate = `${prefix}${randomPart}`.toUpperCase();
    const existing = await Coupon.findOne({ couponCode: candidate });
    if (!existing) {
      return candidate;
    }
  }
  // Fallback timestamp-based code
  return `${prefix}${Date.now().toString(36).toUpperCase().slice(-5)}`;
};

// Generate a new unique coupon code (for Admin UI)
export const getGeneratedCouponCode = async (req, res) => {
  try {
    const prefix = (req.query.prefix || 'VAULT').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'VAULT';
    const code = await generateUniqueCouponCode(prefix);
    res.json({ success: true, code });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Coupon
export const createCoupon = async (req, res) => {
  try {
    let {
      couponCode,
      code,
      description,
      discountType,
      discountValue,
      minimumPurchase,
      minOrderAmount,
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

    let finalCode = String(couponCode || code || '').toUpperCase().trim();

    // Auto-generate if not provided
    if (!finalCode) {
      finalCode = await generateUniqueCouponCode('VAULT');
    }

    const typeLower = String(discountType || 'percentage').toLowerCase();
    const discountNum = Number(discountValue) || 0;
    const minSpend = minimumPurchase !== undefined ? Number(minimumPurchase) : (minOrderAmount !== undefined ? Number(minOrderAmount) : 0);
    const maxDiscountNum = typeLower === 'percentage' && maximumDiscount ? Number(maximumDiscount) : undefined;
    const uLimit = Number(usageLimit) || 0;
    const userLim = Number(userLimit) || 1;

    // Check existing code in DB
    const existing = await Coupon.findOne({ couponCode: finalCode, isDeleted: false });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    if (discountNum <= 0) {
      return res.status(400).json({ success: false, message: 'Discount value must be greater than 0' });
    }

    if (typeLower === 'percentage' && discountNum > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
    }

    if (minSpend < 0) {
      return res.status(400).json({ success: false, message: 'Minimum purchase cannot be negative' });
    }

    const start = new Date(startDate);
    const expiry = new Date(expiryDate);
    if (expiry <= start) {
      return res.status(400).json({ success: false, message: 'Expiry date must be greater than start date' });
    }

    if (uLimit < 0) {
      return res.status(400).json({ success: false, message: 'Usage limit cannot be negative' });
    }

    if (uLimit > 0 && userLim > uLimit) {
      return res.status(400).json({ success: false, message: 'Per-user limit cannot exceed total usage limit' });
    }

    const coupon = new Coupon({
      couponCode: finalCode,
      description,
      discountType: typeLower,
      discountValue: discountNum,
      minimumPurchase: minSpend,
      maximumDiscount: maxDiscountNum,
      usageLimit: uLimit,
      userLimit: userLim,
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
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
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
