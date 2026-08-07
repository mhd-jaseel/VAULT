import mongoose from 'mongoose';

const heroBannerSchema = new mongoose.Schema(
  {
    badgeText: {
      type: String,
      default: 'NEW ARRIVALS EVERY WEEK',
    },
    heading: {
      type: String,
      required: [true, 'Heading is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    primaryButtonText: {
      type: String,
      default: 'SHOP NOW',
    },
    primaryButtonLink: {
      type: String,
      default: '/shop',
    },
    secondaryButtonText: {
      type: String,
      default: 'VIEW BEST SELLERS',
    },
    secondaryButtonLink: {
      type: String,
      default: '/shop?featured=true',
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image URL is required'],
    },
    imageAlt: {
      type: String,
      required: [true, 'Image alt text is required for SEO/Accessibility'],
      default: 'Featured accessory',
    },
    featuredLabel: {
      type: String,
      default: 'FEATURED COLLECTIBLE',
    },
    featuredTitle: {
      type: String,
      default: 'Vault Precision Chrono',
    },
    featuredPrice: {
      type: Number,
      default: 14999,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mobileImageUrl: {
      type: String,
    },
    modelImageUrl: {
      type: String,
    },
    productImageUrl: {
      type: String,
    },
    backgroundStyle: {
      type: String,
      default: '#FFFFFF',
    },
    textAlignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left',
    },
    overlayOpacity: {
      type: Number,
      default: 0.1,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    bannerType: {
      type: String,
      enum: ['luxury', 'new-arrival', 'limited', 'sale', 'launch', 'seasonal', 'brand'],
      default: 'luxury',
    },
  },
  { timestamps: true }
);

const HeroBanner = mongoose.model('HeroBanner', heroBannerSchema);
export default HeroBanner;
