import Setting from '../models/Setting.js';
import ShippingCampaign from '../models/ShippingCampaign.js';

/**
 * Calculates authoritative shipping and handling charges for an order subtotal.
 * Priority:
 * 1. Coupon with free shipping (if applicable) -> shipping = 0
 * 2. Active Special Free Shipping Campaign meeting minOrderAmount -> shipping = 0
 * 3. Normal Free Delivery threshold (subtotal >= freeShippingMinAmount) -> shipping = 0
 * 4. Otherwise -> shipping = configured shippingCharges
 *
 * Handling charge is added from Settings.
 *
 * @param {number} subtotal - The eligible order subtotal (after discounts / items subtotal)
 * @param {boolean} freeShippingCoupon - Whether an applied coupon grants free shipping
 * @returns {Promise<{
 *   shippingCharge: number,
 *   handlingCharge: number,
 *   isFreeShipping: boolean,
 *   freeShippingReason: string|null,
 *   appliedCampaignName: string|null,
 *   normalShippingCharge: number,
 *   normalFreeDeliveryMin: number
 * }>}
 */
export const calculateShipping = async (subtotal = 0, freeShippingCoupon = false) => {
  const settings = (await Setting.findOne()) || {
    shippingCharges: 100,
    freeShippingMinAmount: 1500,
    handlingCharge: 0,
  };

  const normalShippingCharge = Number(settings.shippingCharges) || 0;
  const normalFreeDeliveryMin = Number(settings.freeShippingMinAmount) || 0;
  const handlingCharge = Number(settings.handlingCharge) || 0;

  const now = new Date();

  // 1. Check for Active Special Free Shipping Campaigns
  // Conditions: isActive === true, isFreeShipping === true, startDate <= now <= endDate
  const activeCampaigns = await ShippingCampaign.find({
    isActive: true,
    isFreeShipping: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ priority: -1, minOrderAmount: 1 });

  // Deterministically find highest priority campaign that satisfies minOrderAmount
  let matchingCampaign = null;
  for (const campaign of activeCampaigns) {
    if (subtotal >= (campaign.minOrderAmount || 0)) {
      matchingCampaign = campaign;
      break;
    }
  }

  // Priority Evaluation
  if (freeShippingCoupon) {
    return {
      shippingCharge: 0,
      handlingCharge,
      isFreeShipping: true,
      freeShippingReason: 'Coupon Free Shipping Applied',
      appliedCampaignName: null,
      normalShippingCharge,
      normalFreeDeliveryMin,
    };
  }

  if (matchingCampaign) {
    return {
      shippingCharge: 0,
      handlingCharge,
      isFreeShipping: true,
      freeShippingReason: `Special Campaign: ${matchingCampaign.name}`,
      appliedCampaignName: matchingCampaign.name,
      normalShippingCharge,
      normalFreeDeliveryMin,
    };
  }

  if (subtotal >= normalFreeDeliveryMin || subtotal === 0) {
    return {
      shippingCharge: 0,
      handlingCharge,
      isFreeShipping: subtotal > 0,
      freeShippingReason: subtotal >= normalFreeDeliveryMin ? 'Free Delivery Threshold Reached' : null,
      appliedCampaignName: null,
      normalShippingCharge,
      normalFreeDeliveryMin,
    };
  }

  return {
    shippingCharge: normalShippingCharge,
    handlingCharge,
    isFreeShipping: false,
    freeShippingReason: null,
    appliedCampaignName: null,
    normalShippingCharge,
    normalFreeDeliveryMin,
  };
};

/**
 * Returns current public shipping settings & any currently active campaigns for frontend display.
 */
export const getPublicShippingInfo = async () => {
  const settings = (await Setting.findOne()) || {
    shippingCharges: 100,
    freeShippingMinAmount: 1500,
    handlingCharge: 0,
  };

  const now = new Date();
  const activeCampaigns = await ShippingCampaign.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ priority: -1, minOrderAmount: 1 });

  return {
    shippingCharges: Number(settings.shippingCharges) || 0,
    freeShippingMinAmount: Number(settings.freeShippingMinAmount) || 0,
    handlingCharge: Number(settings.handlingCharge) || 0,
    returnAddress: settings.returnAddress || {
      street: 'VAULT Logistics Hub, Unit 4B, Signature Tower',
      city: 'Bandra Kurla Complex, Mumbai',
      state: 'Maharashtra',
      zip: '400051',
      phone: '+91 98765 43210',
      instructions: 'Pack the product securely in original packaging with tags and reference ID written on the box.',
    },
    activeSpecialCampaign: activeCampaigns.length > 0 ? activeCampaigns[0] : null,
    activeCampaigns,
  };
};
