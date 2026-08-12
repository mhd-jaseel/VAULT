import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Setting from '../../models/Setting.js';
import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';

// Create order
export const createOrder = async (req, res) => {
  const { items, shippingAddress, couponCode } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No order items' });
  }

  try {
    // Get store settings for shipping calculations
    const setting = await Setting.findOne() || { shippingCharges: 100, freeShippingMinAmount: 1500 };

    let totalAmount = 0;
    const orderItems = [];

    // Verify stock and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.name} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });

      // NOTE: Stock is NOT deducted here.
      // Stock deduction happens only after payment is captured/verified.
    }

    // Coupon Validation & Discount Calculation
    let discountAmount = 0;
    let couponObj = null;
    let freeShippingCoupon = false;

    if (couponCode) {
      const codeUpper = String(couponCode).toUpperCase().trim();
      const coupon = await Coupon.findOne({ couponCode: codeUpper, isDeleted: false });

      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Invalid Coupon' });
      }

      if (coupon.status === 'inactive') {
        return res.status(400).json({ success: false, message: 'Coupon Disabled' });
      }

      const now = new Date();
      if (now < coupon.startDate) {
        return res.status(400).json({ success: false, message: 'Coupon Not Started' });
      }
      if (now > coupon.expiryDate) {
        return res.status(400).json({ success: false, message: 'Coupon Expired' });
      }

      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ success: false, message: 'Coupon Usage Limit Reached' });
      }

      const userUsageCount = await CouponUsage.countDocuments({
        userId: req.user._id,
        couponId: coupon._id
      });
      if (userUsageCount >= coupon.userLimit) {
        return res.status(400).json({ success: false, message: 'Coupon Already Used' });
      }

      if (coupon.firstOrderOnly) {
        const ordersCount = await Order.countDocuments({
          user: req.user._id,
          status: { $ne: 'cancelled' }
        });
        if (ordersCount > 0) {
          return res.status(400).json({ success: false, message: 'Coupon Applicable to First Order Only' });
        }
      }

      // Check applicable categories or products eligibility
      const productIdsInCart = orderItems.map(item => item.product);
      const cartProductDetails = await Product.find({ _id: { $in: productIdsInCart } });

      let eligibleSubtotal = 0;
      let hasEligibleItem = false;

      for (const item of orderItems) {
        const prodIdStr = String(item.product);
        const details = cartProductDetails.find(p => String(p._id) === prodIdStr);

        if (!details) continue;

        const isExcluded = coupon.excludedProducts.some(p => String(p) === prodIdStr);
        if (isExcluded) continue;

        const hasProductRestriction = coupon.applicableProducts.length > 0;
        const isApplicableProduct = coupon.applicableProducts.some(p => String(p) === prodIdStr);

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

      if (eligibleSubtotal < coupon.minimumPurchase) {
        return res.status(400).json({ 
          success: false, 
          message: `Minimum Purchase Required: ₹${coupon.minimumPurchase}` 
        });
      }

      if (coupon.discountType === 'percentage') {
        discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
        if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
          discountAmount = coupon.maximumDiscount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }

      if (discountAmount > totalAmount) {
        discountAmount = totalAmount;
      }

      couponObj = coupon;
      freeShippingCoupon = coupon.freeShipping;
    }

    let shippingCharges = totalAmount >= setting.freeShippingMinAmount ? 0 : setting.shippingCharges;
    if (freeShippingCoupon) {
      shippingCharges = 0;
    }

    const grandTotal = totalAmount - discountAmount + shippingCharges;

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      totalAmount,
      shippingCharges,
      grandTotal,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      status: 'pending',
      coupon: couponObj ? couponObj._id : undefined,
      couponCode: couponObj ? couponObj.couponCode : undefined,
      discountAmount,
      timeline: [
        {
          status: 'pending',
          note: 'Order successfully submitted.',
        },
      ],
    });

    const createdOrder = await order.save();

    // Log Coupon Usage
    if (couponObj) {
      couponObj.usedCount += 1;
      await couponObj.save();

      const usage = new CouponUsage({
        userId: req.user._id,
        couponId: couponObj._id,
        orderId: createdOrder._id,
        discountAmount
      });
      await usage.save();
    }

    res.status(201).json({ success: true, data: createdOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
