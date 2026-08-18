import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Payment from '../../models/Payment.js';
import Product from '../../models/Product.js';
import Setting from '../../models/Setting.js';
import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';
import razorpay from '../../services/razorpayService.js';
import { calculateProductDiscounts } from '../../services/discountService.js';

// POST /api/payments/razorpay/create-order
export const createRazorpayOrder = async (req, res) => {
  const { items, shippingAddress, couponCode, useWallet } = req.body;

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
    const envLimit = process.env.MAX_CART_QUANTITY_PER_PRODUCT ? Number(process.env.MAX_CART_QUANTITY_PER_PRODUCT) : null;
    const configuredMaxQty = envLimit && envLimit > 0 ? envLimit : (setting.maxCartQuantityPerProduct || 5);

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID.' });
      }
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found.` });
      }
      if (item.quantity > configuredMaxQty) {
        return res.status(400).json({
          success: false,
          message: `Maximum allowed quantity for ${product.name} is ${configuredMaxQty}.`,
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
        });
      }

      // Authoritative effective discounted price calculation
      const decoratedProduct = await calculateProductDiscounts(product);
      const effectiveUnitPrice = decoratedProduct.isDiscounted ? decoratedProduct.finalPrice : decoratedProduct.price;
      const productDiscountAmt = decoratedProduct.isDiscounted ? (decoratedProduct.discountAmount || 0) : 0;

      const itemTotal = effectiveUnitPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || '',
        quantity: item.quantity,
        price: effectiveUnitPrice,
        itemDiscount: productDiscountAmt,
        allocatedCouponDiscount: 0,
        unitPaidAmount: effectiveUnitPrice,
        linePaidAmount: itemTotal,
        status: 'ACTIVE',
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
          item.isCouponEligible = true;
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
    }

    // Finalize item snapshots (unitPaidAmount & linePaidAmount)
    orderItems.forEach(item => {
      delete item.isCouponEligible;
      const lineGross = item.price * item.quantity;
      item.linePaidAmount = Math.max(0, Math.round((lineGross - (item.itemDiscount || 0) - (item.allocatedCouponDiscount || 0)) * 100) / 100);
      item.unitPaidAmount = Math.round((item.linePaidAmount / item.quantity) * 100) / 100;
    });

    // ── 3. Calculate shipping & grand total ──────────────────────────────────
    const { calculateShipping } = await import('../../services/shippingService.js');
    const shippingResult = await calculateShipping(totalAmount, freeShippingCoupon);

    const shippingCharges = shippingResult.shippingCharge;
    const handlingCharge = shippingResult.handlingCharge;
    const isFreeShippingApplied = shippingResult.isFreeShipping;
    const shippingCampaign = shippingResult.appliedCampaignName;

    const grandTotal = totalAmount - discountAmount + shippingCharges + handlingCharge;

    // ── 3b. Wallet Balance Calculation & Partial/Full Wallet Application ────
    const Wallet = (await import('../../models/Wallet.js')).default;
    const WalletTransaction = (await import('../../models/WalletTransaction.js')).default;

    let walletUsed = 0;
    const useWallet = req.body.useWallet === true;

    if (useWallet) {
      const userWallet = await Wallet.findOne({ user: req.user._id });
      const availableWallet = userWallet ? userWallet.balance : 0;
      walletUsed = Math.min(availableWallet, grandTotal);
    }

    const remainingRazorpayTotal = Math.max(0, grandTotal - walletUsed);
    const grandTotalPaise = Math.round(remainingRazorpayTotal * 100); // Remaining via Razorpay

    // If wallet covers 100% of the order total
    if (useWallet && walletUsed >= grandTotal && remainingRazorpayTotal === 0) {
      // Perform atomic debit from user wallet
      const userWallet = await Wallet.findOne({ user: req.user._id });
      if (!userWallet || userWallet.balance < walletUsed) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
      }

      const balanceBefore = userWallet.balance;
      userWallet.balance -= walletUsed;
      await userWallet.save();

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
        walletAmountPaid: walletUsed,
        razorpayAmountPaid: 0,
        paymentMethod: 'VAULT_WALLET',
        paymentStatus: 'captured',
        status: 'confirmed',
        coupon: couponObj ? couponObj._id : undefined,
        couponCode: couponObj ? couponObj.couponCode : undefined,
        discountAmount,
        timeline: [{ status: 'confirmed', note: `Paid 100% via Vault Wallet (₹${walletUsed}).` }],
      });
      const savedOrder = await order.save();

      // Create Wallet Transaction ledger entry
      const randTxn = Math.floor(10000 + Math.random() * 90000);
      await WalletTransaction.create({
        transactionId: `WLT-TXN-${randTxn}`,
        user: req.user._id,
        wallet: userWallet._id,
        type: 'ORDER_WALLET_PAYMENT',
        amount: walletUsed,
        balanceBefore,
        balanceAfter: userWallet.balance,
        referenceType: 'ORDER',
        referenceId: String(savedOrder._id),
        description: `Order #${savedOrder._id.toString().slice(-6).toUpperCase()} Paid via Vault Wallet`,
        createdBy: 'SYSTEM',
      });

      // Deduct stock for 100% wallet paid order
      const { deductStockForOrder } = await import('./paymentHelper.js');
      await deductStockForOrder(savedOrder);

      // Trigger Admin Notification
      try {
        const { createNotificationHelper } = await import('../../services/notificationHelper.js');
        await createNotificationHelper({
          type: 'NEW_ORDER',
          title: 'New Checkout Order',
          message: `New order #${savedOrder._id.toString().slice(-6).toUpperCase()} placed by ${req.user.name || 'Customer'} (₹${savedOrder.grandTotal})`,
          relatedId: savedOrder._id,
          relatedType: 'Order',
          action: 'REVIEW_ORDER',
        });
      } catch (notifErr) {
        console.error('[VAULT] Failed to create notification for NEW_ORDER', notifErr);
      }

      return res.status(201).json({
        success: true,
        fullWalletPayment: true,
        message: 'Order placed successfully using Vault Wallet!',
        data: {
          internalOrderId: String(savedOrder._id),
          grandTotal,
        },
      });
    }

    // ── 4. Create internal pending Order (Hybrid Wallet + Razorpay or Pure Razorpay) ─
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
      walletAmountPaid: walletUsed,
      razorpayAmountPaid: remainingRazorpayTotal,
      paymentMethod: walletUsed > 0 ? 'WALLET_RAZORPAY' : 'RAZORPAY',
      paymentStatus: 'pending',
      status: 'pending',
      coupon: couponObj ? couponObj._id : undefined,
      couponCode: couponObj ? couponObj.couponCode : undefined,
      discountAmount,
      timeline: [{ status: 'pending', note: `Order created — awaiting ${walletUsed > 0 ? `₹${remainingRazorpayTotal} Razorpay difference payment (₹${walletUsed} from Wallet)` : 'payment'}.` }],
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
