import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: 'NEW COLLECTION',
    },
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
    },
    description: {
      type: String,
      required: [true, 'Campaign description is required'],
    },
    ctaText: {
      type: String,
      default: 'SHOP THE LOOK',
    },
    ctaLink: {
      type: String,
      default: '/shop',
    },
    desktopImageUrl: {
      type: String,
      required: [true, 'Desktop campaign image is required'],
    },
    mobileImageUrl: {
      type: String,
    },
    imageAlt: {
      type: String,
      default: 'Fashion campaign image',
    },
    seoTitle: {
      type: String,
    },
    seoDescription: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
