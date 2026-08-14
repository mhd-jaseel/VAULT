import Campaign from '../../models/Campaign.js';
import { paginateAggregate } from '../../utils/paginate.js';

// @desc    Get all active campaigns (public)
// @route   GET /campaigns
// @access  Public
export const getCampaigns = async (req, res) => {
  try {
    const now = new Date();
    const query = {
      isActive: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
      ],
    };

    const campaigns = await Campaign.find(query).sort({ order: 1 });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all campaigns for admin (with pagination)
// @route   GET /admin/campaigns
// @access  Private/Admin
export const getAdminCampaigns = async (req, res) => {
  try {
    const { page, limit = 10 } = req.query;
    if (page) {
      const result = await paginateAggregate(Campaign, {}, { order: 1 }, page, limit);
      return res.json({
        success: true,
        data: result.data,
        page: result.page,
        pages: result.pages,
        total: result.total,
      });
    }
    const campaigns = await Campaign.find().sort({ order: 1 });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a campaign
// @route   POST /admin/campaigns
// @access  Private/Admin
export const createCampaign = async (req, res) => {
  try {
    const {
      label,
      title,
      description,
      ctaText,
      ctaLink,
      imageAlt,
      seoTitle,
      seoDescription,
      isActive,
      order,
      startDate,
      endDate,
    } = req.body;

    let desktopImageUrl = req.body.desktopImageUrl;
    let mobileImageUrl = req.body.mobileImageUrl;

    if (req.files) {
      if (req.files.desktopImageUrl && req.files.desktopImageUrl[0]) {
        desktopImageUrl = `/uploads/${req.files.desktopImageUrl[0].filename}`;
      }
      if (req.files.mobileImageUrl && req.files.mobileImageUrl[0]) {
        mobileImageUrl = `/uploads/${req.files.mobileImageUrl[0].filename}`;
      }
    }

    if (!desktopImageUrl) {
      return res.status(400).json({ success: false, message: 'Please upload a desktop campaign image.' });
    }

    const campaign = await Campaign.create({
      label,
      title,
      description,
      ctaText,
      ctaLink,
      desktopImageUrl,
      mobileImageUrl,
      imageAlt,
      seoTitle,
      seoDescription,
      isActive: isActive === 'true' || isActive === true,
      order: order !== undefined ? Number(order) : 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a campaign
// @route   PATCH /admin/campaigns/:id
// @access  Private/Admin
export const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const fields = ['label', 'title', 'description', 'ctaText', 'ctaLink', 'imageAlt', 'seoTitle', 'seoDescription'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) campaign[f] = req.body[f];
    });

    if (req.body.isActive !== undefined) {
      campaign.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }
    if (req.body.order !== undefined) campaign.order = Number(req.body.order);
    if (req.body.startDate !== undefined) campaign.startDate = req.body.startDate ? new Date(req.body.startDate) : undefined;
    if (req.body.endDate !== undefined) campaign.endDate = req.body.endDate ? new Date(req.body.endDate) : undefined;

    if (req.files) {
      if (req.files.desktopImageUrl && req.files.desktopImageUrl[0]) {
        campaign.desktopImageUrl = `/uploads/${req.files.desktopImageUrl[0].filename}`;
      }
      if (req.files.mobileImageUrl && req.files.mobileImageUrl[0]) {
        campaign.mobileImageUrl = `/uploads/${req.files.mobileImageUrl[0].filename}`;
      }
    } else {
      if (req.body.desktopImageUrl !== undefined) campaign.desktopImageUrl = req.body.desktopImageUrl;
      if (req.body.mobileImageUrl !== undefined) campaign.mobileImageUrl = req.body.mobileImageUrl;
    }

    const updated = await campaign.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a campaign
// @route   DELETE /admin/campaigns/:id
// @access  Private/Admin
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    await campaign.deleteOne();
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
