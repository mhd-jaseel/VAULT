import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

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
