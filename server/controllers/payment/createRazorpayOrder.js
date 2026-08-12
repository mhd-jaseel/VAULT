import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Payment from '../../models/Payment.js';
import Product from '../../models/Product.js';
import Setting from '../../models/Setting.js';
import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';
import razorpay from '../../services/razorpayService.js';

// POST /api/payments/razorpay/create-order
export const createRazorpayOrder = async (req, res) => {
  const { items, shippingAddress, couponCode } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No order items provided.' });
  }
  if (!shippingAddress || !shippingAddress.street) {
    return res.status(400).json({ success: false, message: 'Shipping address is required.' });
  }

  try {
    const setting = await Setting.findOne() || { shippingCharges: 100, freeShippingMinAmount: 1500 };

    let totalAmount = 0;
    const orderItems = [];

    // ── 1. Validate items & calculate total from DB prices (never trust frontend price) ──
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID.' });
      }
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
        });
      }

      // Use DB price — ignore any price from frontend
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // ── 2. Coupon validation ──────────────────────────────────────────────────
    let discountAmount = 0;
    let couponObj = null;
    let freeShippingCoupon = false;

    if (couponCode) {
      const codeUpper = String(couponCode).toUpperCase().trim();
      const coupon = await Coupon.findOne({ couponCode: codeUpper, isDeleted: false });

      if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon.' });
      if (coupon.status === 'inactive') return res.status(400).json({ success: false, message: 'Coupon is disabled.' });

      const now = new Date();
      if (now < coupon.startDate) return res.status(400).json({ success: false, message: 'Coupon not started yet.' });
      if (now > coupon.expiryDate) return res.status(400).json({ success: false, message: 'Coupon has expired.' });
      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached.' });

      const userUsageCount = await CouponUsage.countDocuments({ userId: req.user._id, couponId: coupon._id });
      if (userUsageCount >= coupon.userLimit)
        return res.status(400).json({ success: false, message: 'You have already used this coupon.' });

      if (coupon.firstOrderOnly) {
        const ordersCount = await Order.countDocuments({ user: req.user._id, status: { $ne: 'cancelled' } });
        if (ordersCount > 0)
          return res.status(400).json({ success: false, message: 'Coupon is for first order only.' });
      }

      const productIdsInCart = orderItems.map((i) => i.product);
      const cartProductDetails = await Product.find({ _id: { $in: productIdsInCart } });

      let eligibleSubtotal = 0;
      let hasEligibleItem = false;

      for (const item of orderItems) {
        const prodIdStr = String(item.product);
        const details = cartProductDetails.find((p) => String(p._id) === prodIdStr);
        if (!details) continue;

        const isExcluded = coupon.excludedProducts.some((p) => String(p) === prodIdStr);
        if (isExcluded) continue;

        const hasProductRestriction = coupon.applicableProducts.length > 0;
        const isApplicableProduct = coupon.applicableProducts.some((p) => String(p) === prodIdStr);
        const hasCategoryRestriction = coupon.applicableCategories.length > 0;
        const isApplicableCategory =
          details.category && coupon.applicableCategories.some((c) => String(c) === String(details.category));

        const isEligible =
          (!hasProductRestriction && !hasCategoryRestriction) ||
          (hasProductRestriction && isApplicableProduct) ||
          (hasCategoryRestriction && isApplicableCategory);

        if (isEligible) {
          eligibleSubtotal += Number(item.price) * Number(item.quantity);
          hasEligibleItem = true;
        }
      }

      if (!hasEligibleItem) return res.status(400).json({ success: false, message: 'Coupon not applicable to your cart.' });
      if (eligibleSubtotal < coupon.minimumPurchase)
        return res.status(400).json({ success: false, message: `Minimum purchase ₹${coupon.minimumPurchase} required.` });

      if (coupon.discountType === 'percentage') {
        discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
        if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) discountAmount = coupon.maximumDiscount;
      } else {
        discountAmount = coupon.discountValue;
      }
      if (discountAmount > totalAmount) discountAmount = totalAmount;

      couponObj = coupon;
      freeShippingCoupon = coupon.freeShipping;
    }

    // ── 3. Calculate shipping & grand total ──────────────────────────────────
    let shippingCharges = totalAmount >= setting.freeShippingMinAmount ? 0 : setting.shippingCharges;
    if (freeShippingCoupon) shippingCharges = 0;
    const grandTotal = totalAmount - discountAmount + shippingCharges;
    const grandTotalPaise = Math.round(grandTotal * 100); // Razorpay uses paise

    // ── 4. Create internal pending Order (NO stock deduction yet) ────────────
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
      timeline: [{ status: 'pending', note: 'Order created — awaiting payment.' }],
    });
    const savedOrder = await order.save();

    // ── 5. Create Razorpay order ─────────────────────────────────────────────
    const rpOrderOptions = {
      amount: grandTotalPaise,
      currency: 'INR',
      receipt: `vault_${savedOrder._id}`,
      notes: {
        internal_order_id: String(savedOrder._id),
        customer_name: shippingAddress.name,
        customer_phone: shippingAddress.phone,
      },
    };

    let rpOrder;
    try {
      rpOrder = await razorpay.orders.create(rpOrderOptions);
    } catch (rpErr) {
      console.error('[Razorpay] Order creation failed:', rpErr);
      // Clean up the internal order if Razorpay fails
      await Order.findByIdAndDelete(savedOrder._id);
      return res.status(502).json({ success: false, message: 'Payment gateway unavailable. Please try again.' });
    }

    // ── 6. Store Razorpay order ID in internal order ─────────────────────────
    savedOrder.razorpayOrderId = rpOrder.id;
    await savedOrder.save();

    // ── 7. Create Payment record (pending) ───────────────────────────────────
    await Payment.create({
      order: savedOrder._id,
      user: req.user._id,
      razorpayOrderId: rpOrder.id,
      amountPaise: grandTotalPaise,
      currency: 'INR',
      status: 'pending',
    });

    // ── 8. Return data for frontend Razorpay checkout ────────────────────────
    return res.status(201).json({
      success: true,
      data: {
        razorpayOrderId: rpOrder.id,
        amount: grandTotalPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID, // public key only
        internalOrderId: String(savedOrder._id),
        grandTotal,
      },
    });
  } catch (error) {
    console.error('[VAULT] createRazorpayOrder error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
