import Setting from '../../models/Setting.js';
import ShippingCampaign from '../../models/ShippingCampaign.js';
import { calculateShipping, getPublicShippingInfo } from '../../services/shippingService.js';

// GET /api/shipping-settings (Public: for Cart & Checkout & Dynamic Storefront display)
export const getPublicShippingSettings = async (req, res) => {
  try {
    const info = await getPublicShippingInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/shipping-settings/calculate (Public/Customer: Calculate exact shipping & handling for any subtotal)
export const calculateShippingQuote = async (req, res) => {
  try {
    const { subtotal = 0, freeShippingCoupon = false } = req.body;
    const result = await calculateShipping(Number(subtotal) || 0, Boolean(freeShippingCoupon));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/shipping-settings/admin (Admin only: fetch settings + all campaigns)
export const getAdminShippingSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        shippingCharges: 100,
        freeShippingMinAmount: 1500,
        handlingCharge: 0,
      });
    }

    const campaigns = await ShippingCampaign.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
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
        campaigns,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/shipping-settings/admin (Admin only: update core shipping & handling settings & return address)
export const updateAdminShippingSettings = async (req, res) => {
  try {
    const { shippingCharges, freeShippingMinAmount, handlingCharge, returnAddress } = req.body;

    if (shippingCharges !== undefined && (isNaN(shippingCharges) || Number(shippingCharges) < 0)) {
      return res.status(400).json({ success: false, message: 'Shipping charge must be a non-negative number.' });
    }
    if (freeShippingMinAmount !== undefined && (isNaN(freeShippingMinAmount) || Number(freeShippingMinAmount) < 0)) {
      return res.status(400).json({ success: false, message: 'Free delivery minimum amount must be a non-negative number.' });
    }
    if (handlingCharge !== undefined && (isNaN(handlingCharge) || Number(handlingCharge) < 0)) {
      return res.status(400).json({ success: false, message: 'Handling charge must be a non-negative number.' });
    }

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting({});
    }

    if (shippingCharges !== undefined) settings.shippingCharges = Number(shippingCharges);
    if (freeShippingMinAmount !== undefined) settings.freeShippingMinAmount = Number(freeShippingMinAmount);
    if (handlingCharge !== undefined) settings.handlingCharge = Number(handlingCharge);
    if (returnAddress && typeof returnAddress === 'object') {
      settings.returnAddress = {
        ...settings.returnAddress?.toObject?.() || {},
        ...returnAddress,
      };
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Shipping settings updated successfully.',
      data: {
        shippingCharges: settings.shippingCharges,
        freeShippingMinAmount: settings.freeShippingMinAmount,
        handlingCharge: settings.handlingCharge,
        returnAddress: settings.returnAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/shipping-settings/admin/campaigns (Admin only: create a special free shipping campaign)
export const createShippingCampaign = async (req, res) => {
  try {
    const { name, startDate, endDate, minOrderAmount, isFreeShipping, isActive, priority } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Campaign name is required.' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start date or end date format.' });
    }

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date.' });
    }

    const minAmount = minOrderAmount !== undefined ? Number(minOrderAmount) : 0;
    if (isNaN(minAmount) || minAmount < 0) {
      return res.status(400).json({ success: false, message: 'Minimum order amount must be a non-negative number.' });
    }

    const campaign = new ShippingCampaign({
      name: name.trim(),
      startDate: start,
      endDate: end,
      minOrderAmount: minAmount,
      isFreeShipping: isFreeShipping !== undefined ? Boolean(isFreeShipping) : true,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      priority: priority !== undefined ? Number(priority) || 0 : 0,
    });

    await campaign.save();

    res.status(201).json({
      success: true,
      message: 'Special free shipping campaign created successfully.',
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/shipping-settings/admin/campaigns/:id (Admin only: update campaign)
export const updateShippingCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, minOrderAmount, isFreeShipping, isActive, priority } = req.body;

    const campaign = await ShippingCampaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ success: false, message: 'Campaign name cannot be empty.' });
      campaign.name = name.trim();
    }

    if (startDate !== undefined) campaign.startDate = new Date(startDate);
    if (endDate !== undefined) campaign.endDate = new Date(endDate);

    if (campaign.endDate < campaign.startDate) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date.' });
    }

    if (minOrderAmount !== undefined) {
      const minAmount = Number(minOrderAmount);
      if (isNaN(minAmount) || minAmount < 0) {
        return res.status(400).json({ success: false, message: 'Minimum order amount must be >= 0.' });
      }
      campaign.minOrderAmount = minAmount;
    }

    if (isFreeShipping !== undefined) campaign.isFreeShipping = Boolean(isFreeShipping);
    if (isActive !== undefined) campaign.isActive = Boolean(isActive);
    if (priority !== undefined) campaign.priority = Number(priority) || 0;

    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign updated successfully.',
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/shipping-settings/admin/campaigns/:id (Admin only: delete campaign)
export const deleteShippingCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await ShippingCampaign.findByIdAndDelete(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }
    res.json({ success: true, message: 'Campaign deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
