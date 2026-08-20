import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import { calculateProductDiscounts } from '../../services/discountService.js';

// Apply Coupon (Validation and discount computation)
export const applyCoupon = async (req, res) => {
  try {
    const { couponCode, code, items } = req.body;
    const inputCode = String(couponCode || code || '').toUpperCase().trim();

    if (!inputCode) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is currently empty.' });
    }

    const coupon = await Coupon.findOne({ couponCode: inputCode, isDeleted: false });

    // 1. Coupon exists
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon code not found.' });
    }

    // 2. Coupon is active
    if (coupon.status === 'inactive') {
      return res.status(400).json({ success: false, message: 'This coupon is currently inactive.' });
    }

    // 3. Date checks
    const now = new Date();
    if (now < coupon.startDate) {
      return res.status(400).json({ success: false, message: 'This coupon offer has not started yet.' });
    }
    if (now > coupon.expiryDate) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }

    // 4. Usage limit check (Global)
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its maximum total usage limit.' });
    }

    // 5. User usage limit check (One-time or Per-user limit)
    const userUsageCount = await CouponUsage.countDocuments({
      userId: req.user._id,
      couponId: coupon._id
    });
    if (userUsageCount >= (coupon.userLimit || 1)) {
      const msg = (coupon.userLimit || 1) === 1
        ? 'Coupon has already been used.'
        : 'You have reached the maximum allowed redemptions for this coupon.';
      return res.status(400).json({ success: false, message: msg });
    }

    // 6. First Order check
    if (coupon.firstOrderOnly) {
      const ordersCount = await Order.countDocuments({
        user: req.user._id,
        status: { $ne: 'cancelled' }
      });
      if (ordersCount > 0) {
        return res.status(400).json({ success: false, message: 'This coupon is valid only for your first order.' });
      }
    }

    // 7. Check whether products in the cart have active discounts
    // Business Rule: Discounted products cannot receive coupon discounts.
    // In mixed carts, the coupon applies ONLY to eligible non-discounted products.
    const productIdsInCart = items.map(item => item.product._id || item.product);
    const cartProductDetails = await Product.find({ _id: { $in: productIdsInCart } })
      .populate('category', 'name')
      .populate('brand', 'name');

    const decoratedProducts = await calculateProductDiscounts(cartProductDetails);
    const decoratedList = Array.isArray(decoratedProducts) ? decoratedProducts : [decoratedProducts];

    // 8. Applicable products & categories subtotal calculation (excluding discounted items)
    let eligibleSubtotal = 0;
    let hasEligibleItem = false;

    for (const item of items) {
      const prodIdStr = String(item.product._id || item.product);
      const details = cartProductDetails.find(p => String(p._id) === prodIdStr);
      const decorated = decoratedList.find(p => String(p._id) === prodIdStr);

      if (!details) continue;

      // Exclude already discounted items from coupon benefits
      if (decorated && decorated.isDiscounted) {
        continue;
      }

      // Check excluded products
      const isExcluded = Array.isArray(coupon.excludedProducts) && coupon.excludedProducts.some(p => String(p) === prodIdStr);
      if (isExcluded) continue;

      // Check applicable products
      const hasProductRestriction = Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0;
      const isApplicableProduct = hasProductRestriction && coupon.applicableProducts.some(p => String(p) === prodIdStr);

      // Check applicable categories
      const hasCategoryRestriction = Array.isArray(coupon.applicableCategories) && coupon.applicableCategories.length > 0;
      const itemCategoryId = details.category?._id ? String(details.category._id) : (details.category ? String(details.category) : '');
      const isApplicableCategory = hasCategoryRestriction && itemCategoryId && coupon.applicableCategories.some(c => String(c) === itemCategoryId);

      const isEligible = 
        (!hasProductRestriction && !hasCategoryRestriction) ||
        (hasProductRestriction && isApplicableProduct) ||
        (hasCategoryRestriction && isApplicableCategory);

      if (isEligible) {
        const itemPrice = decorated ? decorated.finalPrice : Number(item.price);
        eligibleSubtotal += Number(itemPrice) * Number(item.quantity);
        hasEligibleItem = true;
      }
    }

    if (!hasEligibleItem) {
      const anyDiscounted = decoratedList.some(p => p && p.isDiscounted);
      return res.status(400).json({ 
        success: false, 
        message: anyDiscounted
          ? 'Coupons cannot be applied to products that are already discounted.'
          : 'This coupon is not applicable to any items in your cart.' 
      });
    }

    // Check minimum purchase restriction
    if (eligibleSubtotal < (coupon.minimumPurchase || 0)) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum order amount of ₹${coupon.minimumPurchase} required to apply this coupon.` 
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
      message: 'Coupon applied successfully.',
      data: {
        couponId: coupon._id,
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
        freeShipping: !!coupon.freeShipping
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

