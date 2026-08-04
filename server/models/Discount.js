import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema(
  {
    discountName: {
      type: String,
      required: [true, 'Discount name is required'],
      trim: true,
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
    applyType: {
      type: String,
      required: [true, 'Apply type is required'],
      enum: ['product', 'category', 'selectedProducts'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    selectedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
    },
    showCountdown: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

discountSchema.index({ status: 1 });
discountSchema.index({ startDate: 1, endDate: 1 });
discountSchema.index({ priority: -1 });

const Discount = mongoose.model('Discount', discountSchema);
export default Discount;
