import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Setting from '../../models/Setting.js';
import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';
import { createNotificationHelper } from '../../services/notificationHelper.js';

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
        itemDiscount: 0,
        allocatedCouponDiscount: 0,
        unitPaidAmount: product.price,
        linePaidAmount: itemTotal,
        status: 'ACTIVE',
      });
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
          item.isCouponEligible = true;
        }
      }

      if (eligibleSubtotal === 0) {
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

      // Allocate coupon discount proportionally across eligible items
      let allocatedTotal = 0;
      const eligibleItems = orderItems.filter(i => i.isCouponEligible);
      
      eligibleItems.forEach((item, idx) => {
        const itemGross = item.price * item.quantity;
        if (idx === eligibleItems.length - 1) {
          item.allocatedCouponDiscount = Math.round((discountAmount - allocatedTotal) * 100) / 100;
        } else {
          const share = Math.round(((itemGross / eligibleSubtotal) * discountAmount) * 100) / 100;
          item.allocatedCouponDiscount = share;
          allocatedTotal += share;
        }
      });

      couponObj = coupon;
      freeShippingCoupon = coupon.freeShipping;
    }

    // Finalize item snapshots (unitPaidAmount & linePaidAmount)
    orderItems.forEach(item => {
      delete item.isCouponEligible;
      const lineGross = item.price * item.quantity;
      item.linePaidAmount = Math.max(0, Math.round((lineGross - (item.itemDiscount || 0) - (item.allocatedCouponDiscount || 0)) * 100) / 100);
      item.unitPaidAmount = Math.round((item.linePaidAmount / item.quantity) * 100) / 100;
    });

    const { calculateShipping } = await import('../../services/shippingService.js');
    const shippingResult = await calculateShipping(totalAmount, freeShippingCoupon);

    const shippingCharges = shippingResult.shippingCharge;
    const handlingCharge = shippingResult.handlingCharge;
    const isFreeShippingApplied = shippingResult.isFreeShipping;
    const shippingCampaign = shippingResult.appliedCampaignName;

    const grandTotal = totalAmount - discountAmount + shippingCharges + handlingCharge;

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      totalAmount,
      shippingCharges,
      handlingCharge,
      shippingCampaign,
      isFreeShippingApplied,
      grandTotal,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
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

    // Trigger Admin Notification
    try {
      await createNotificationHelper({
        type: 'NEW_ORDER',
        title: 'New Checkout Order',
        message: `New order #${createdOrder._id.toString().slice(-6).toUpperCase()} placed by ${req.user.name || 'Customer'} (₹${createdOrder.grandTotal})`,
        relatedId: createdOrder._id,
        relatedType: 'Order',
        action: 'REVIEW_ORDER',
      });
    } catch (notifErr) {
      console.error('[VAULT] Failed to create notification for NEW_ORDER', notifErr);
    }

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
