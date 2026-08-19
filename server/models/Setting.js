import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'VAULT',
    },
    logo: {
      type: String,
    },
    phoneNumber: {
      type: String,
      default: '+919999999999',
    },
    whatsappNumber: {
      type: String,
      default: '919999999999',
    },
    upiId: {
      type: String,
      default: 'vault@upi',
    },
    upiQrCode: {
      type: String,
    },
    shippingCharges: {
      type: Number,
      default: 100,
      min: 0,
    },
    freeShippingMinAmount: {
      type: Number,
      default: 1500,
      min: 0,
    },
    handlingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    heroTitle: {
      type: String,
      default: 'UNCOMPROMISING LUXURY',
    },
    heroSubtitle: {
      type: String,
      default: 'NEW ARRIVALS EVERY WEEK',
    },
    heroDescription: {
      type: String,
      default: 'Crafted for the modern gentleman. Discover premium leather wallets, masterfully engineered watches, and artisanal jewelry designed to last.',
    },
    heroImage: {
      type: String,
      default: '/uploads/watch_chrono.png',
    },
    heroProductName: {
      type: String,
      default: 'Vault Precision Chrono',
    },
    heroProductPrice: {
      type: Number,
      default: 14999,
    },
    showDiscountsOnHomepage: {
      type: Boolean,
      default: true,
    },
    discountProductsDisplayOrder: {
      type: String,
      enum: ['highest', 'lowest', 'latest', 'priority'],
      default: 'priority',
    },
    maxCartQuantityPerProduct: {
      type: Number,
      default: 5,
      min: [1, 'Maximum cart quantity must be at least 1'],
    },
    returnAddress: {
      street: {
        type: String,
        default: 'VAULT Logistics Hub, Unit 4B, Signature Tower',
      },
      city: {
        type: String,
        default: 'Bandra Kurla Complex, Mumbai',
      },
      state: {
        type: String,
        default: 'Maharashtra',
      },
      zip: {
        type: String,
        default: '400051',
      },
      phone: {
        type: String,
        default: '+91 98765 43210',
      },
      instructions: {
        type: String,
        default: 'Pack the product securely in original packaging with tags and reference ID written on the box.',
      },
    },
  },
  { timestamps: true }
);

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
