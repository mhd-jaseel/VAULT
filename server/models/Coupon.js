import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    discountType: {
      type: String,
      required: [true, 'Discount type is required'],
      enum: ['percentage', 'fixed'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minimumPurchase: {
      type: Number,
      default: 0,
      min: [0, 'Minimum purchase cannot be negative'],
    },
    maximumDiscount: {
      type: Number,
      min: [0, 'Maximum discount cannot be negative'],
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 = unlimited
      min: [0, 'Usage limit cannot be negative'],
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    userLimit: {
      type: Number,
      default: 1,
      min: [1, 'User limit must be at least 1'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

couponSchema.index({ status: 1 });
couponSchema.index({ isDeleted: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
