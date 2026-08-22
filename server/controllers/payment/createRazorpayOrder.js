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

      if (!coupon) return res.status(404).json({ success: false, message: 'Coupon code not found.' });
      if (coupon.status === 'inactive') return res.status(400).json({ success: false, message: 'This coupon is currently inactive.' });

      const now = new Date();
      if (now < coupon.startDate) return res.status(400).json({ success: false, message: 'This coupon offer has not started yet.' });
      if (now > coupon.expiryDate) return res.status(400).json({ success: false, message: 'This coupon has expired.' });
      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
        return res.status(400).json({ success: false, message: 'This coupon has reached its maximum total usage limit.' });

      const userUsageCount = await CouponUsage.countDocuments({ userId: req.user._id, couponId: coupon._id });
      if (userUsageCount >= (coupon.userLimit || 1)) {
        const msg = (coupon.userLimit || 1) === 1
          ? 'Coupon has already been used.'
          : 'You have reached the maximum allowed redemptions for this coupon.';
        return res.status(400).json({ success: false, message: msg });
      }

      if (coupon.firstOrderOnly) {
        const ordersCount = await Order.countDocuments({ user: req.user._id, status: { $ne: 'cancelled' } });
        if (ordersCount > 0)
          return res.status(400).json({ success: false, message: 'This coupon is valid only for your first order.' });
      }

      // Business Rule: Reject coupon if any item in cart already has product/campaign discount
      const hasDiscountedItem = orderItems.some((item) => Number(item.itemDiscount || 0) > 0);
      if (hasDiscountedItem) {
        return res.status(400).json({
          success: false,
          message: 'Coupons cannot be applied to products that are already discounted.'
        });
      }

      const productIdsInCart = orderItems.map((i) => i.product);
      const cartProductDetails = await Product.find({ _id: { $in: productIdsInCart } })
        .populate('category', 'name')
        .populate('brand', 'name');

      let eligibleSubtotal = 0;
      let hasEligibleItem = false;

      for (const item of orderItems) {
        // Business Rule: Discounted items cannot receive coupon discounts
        if (Number(item.itemDiscount || 0) > 0) {
          item.isCouponEligible = false;
          continue;
        }

        const prodIdStr = String(item.product);
        const details = cartProductDetails.find((p) => String(p._id) === prodIdStr);
        if (!details) continue;

        const isExcluded = Array.isArray(coupon.excludedProducts) && coupon.excludedProducts.some((p) => String(p) === prodIdStr);
        if (isExcluded) continue;

        const hasProductRestriction = Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0;
        const isApplicableProduct = hasProductRestriction && coupon.applicableProducts.some((p) => String(p) === prodIdStr);
        const hasCategoryRestriction = Array.isArray(coupon.applicableCategories) && coupon.applicableCategories.length > 0;
        const itemCategoryId = details.category?._id ? String(details.category._id) : (details.category ? String(details.category) : '');
        const isApplicableCategory =
          hasCategoryRestriction && itemCategoryId && coupon.applicableCategories.some((c) => String(c) === itemCategoryId);

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

      if (!hasEligibleItem) {
        const hasDiscounted = orderItems.some((i) => Number(i.itemDiscount || 0) > 0);
        return res.status(400).json({
          success: false,
          message: hasDiscounted
            ? 'Coupons cannot be applied to products that are already discounted.'
            : 'This coupon is not applicable to any items in your cart.',
        });
      }
      if (eligibleSubtotal < (coupon.minimumPurchase || 0))
        return res.status(400).json({ success: false, message: `Minimum order amount of ₹${coupon.minimumPurchase} required to apply this coupon.` });

      if (coupon.discountType === 'percentage') {
        discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
        if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) discountAmount = coupon.maximumDiscount;
      } else {
        discountAmount = coupon.discountValue;
      }
      if (discountAmount > totalAmount) discountAmount = totalAmount;

      couponObj = coupon;
      freeShippingCoupon = coupon.freeShipping;

      // Allocate coupon discount proportionally across eligible non-discounted items
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
      item.linePaidAmount = Math.max(0, Math.round((lineGross - (item.allocatedCouponDiscount || 0)) * 100) / 100);
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
    const User = (await import('../../models/User.js')).default;
    const Wallet = (await import('../../models/Wallet.js')).default;
    const WalletTransaction = (await import('../../models/WalletTransaction.js')).default;
    const { isReplicaSet } = await import('../../config/db.js');

    let walletUsed = 0;
    const useWallet = req.body.useWallet === true;

    if (useWallet) {
      const userDoc = await User.findById(req.user._id).select('walletBalance');
      const userWallet = await Wallet.findOne({ user: req.user._id });
      const availableWallet = userDoc && userDoc.walletBalance !== undefined 
        ? userDoc.walletBalance 
        : (userWallet ? userWallet.balance : 0);
      walletUsed = Math.min(availableWallet, grandTotal);
    }

    const remainingRazorpayTotal = Math.max(0, grandTotal - walletUsed);
    const grandTotalPaise = Math.round(remainingRazorpayTotal * 100); // Remaining via Razorpay

    // If wallet covers 100% of the order total
    if (useWallet && walletUsed >= grandTotal && remainingRazorpayTotal === 0) {
      let session = null;
      let supportsTransactions = false;

      // Determine replica set / multi-document transaction capability
      try {
        const topology = mongoose.connection?.client?.topology;
        const topType = topology?.description?.type;
        const canUseTxn = isReplicaSet || topType === 'ReplicaSetWithPrimary' || topType === 'Sharded';
        if (canUseTxn) {
          session = await mongoose.startSession();
          session.startTransaction();
          supportsTransactions = true;
        }
      } catch (sessErr) {
        console.warn('[VAULT] Transaction session unavailable, falling back to sequential execution:', sessErr.message);
        if (session) {
          try { await session.endSession(); } catch (_) {}
          session = null;
        }
        supportsTransactions = false;
      }

      const sessionOpt = session ? { session } : {};

      try {
        const userDoc = await User.findById(req.user._id, null, sessionOpt);
        let userWallet = await Wallet.findOne({ user: req.user._id }, null, sessionOpt);
        if (!userWallet) {
          userWallet = new Wallet({ user: req.user._id, balance: userDoc?.walletBalance || 0, currency: 'INR' });
        }

        const balanceBefore = Number(userDoc?.walletBalance !== undefined ? userDoc.walletBalance : userWallet.balance);
        if (balanceBefore < walletUsed) {
          if (session) {
            await session.abortTransaction();
            await session.endSession();
          }
          return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
        }

        const balanceAfter = Math.round((balanceBefore - walletUsed) * 100) / 100;

        // 1. Update User balance
        if (userDoc) {
          userDoc.walletBalance = balanceAfter;
          if (session) {
            await userDoc.save({ session });
          } else {
            await userDoc.save();
          }
        }

        // 2. Update Wallet model balance
        userWallet.balance = balanceAfter;
        if (session) {
          await userWallet.save({ session });
        } else {
          await userWallet.save();
        }

        // 3. Create confirmed Order
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
        const savedOrder = session ? await order.save({ session }) : await order.save();

        // 4. Create WalletTransaction ledger entry
        const randTxn = Math.floor(10000 + Math.random() * 90000);
        const walletTxnDoc = new WalletTransaction({
          transactionId: `WLT-TXN-${randTxn}`,
          user: req.user._id,
          wallet: userWallet._id,
          type: 'DEBIT',
          amount: walletUsed,
          balanceBefore,
          balanceAfter,
          source: 'ORDER_PAYMENT',
          referenceId: String(savedOrder._id),
          description: `Order #${savedOrder._id.toString().slice(-6).toUpperCase()} Paid via Vault Wallet`,
          createdBy: 'SYSTEM',
        });
        if (session) {
          await walletTxnDoc.save({ session });
        } else {
          await walletTxnDoc.save();
        }

        // 5. Deduct stock for 100% wallet paid order
        const { deductStockForOrder } = await import('./paymentHelper.js');
        await deductStockForOrder(savedOrder, sessionOpt);

        // 6. Log Coupon Usage if coupon applied
        if (couponObj) {
          const updateCondition = { _id: couponObj._id };
          if (couponObj.usageLimit > 0) {
            updateCondition.usedCount = { $lt: couponObj.usageLimit };
          }
          const updatedCoupon = await Coupon.findOneAndUpdate(
            updateCondition,
            { $inc: { usedCount: 1 } },
            { new: true, ...sessionOpt }
          );
          if (updatedCoupon) {
            const couponUsageDoc = new CouponUsage({
              userId: req.user._id,
              couponId: couponObj._id,
              orderId: savedOrder._id,
              discountAmount,
            });
            if (session) {
              await couponUsageDoc.save({ session });
            } else {
              await couponUsageDoc.save();
            }
          }
        }

        // Commit transaction if active
        if (session) {
          await session.commitTransaction();
          await session.endSession();
        }

        // Trigger Admin Notification (non-blocking outside transaction)
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
      } catch (txnError) {
        if (session) {
          try { await session.abortTransaction(); } catch (_) {}
          try { await session.endSession(); } catch (_) {}
        }
        console.error('[VAULT] 100% Wallet checkout transaction failed:', txnError);
        return res.status(500).json({ success: false, message: txnError.message || 'Wallet checkout failed. Please try again.' });
      }
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
