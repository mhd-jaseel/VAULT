import HeroBanner from '../models/HeroBanner.js';
import { paginateAggregate } from '../utils/paginate.js';

// @desc    Get all active hero banners
// @route   GET /hero-banners
// @access  Public
export const getHeroBanners = async (req, res) => {
  try {
    const { page, limit = 5 } = req.query;
    if (page) {
      const result = await paginateAggregate(HeroBanner, { isActive: true }, { order: 1 }, page, limit);
      return res.json({
        success: true,
        data: result.data,
        page: result.page,
        pages: result.pages,
        total: result.total,
      });
    }

    const banners = await HeroBanner.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all hero banners for admin
// @route   GET /admin/hero-banners
// @access  Private/Admin
export const getAdminHeroBanners = async (req, res) => {
  try {
    const { page, limit = 10 } = req.query;
    if (page) {
      const result = await paginateAggregate(HeroBanner, {}, { order: 1 }, page, limit);
      return res.json({
        success: true,
        data: result.data,
        page: result.page,
        pages: result.pages,
        total: result.total,
      });
    }

    const banners = await HeroBanner.find().sort({ order: 1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new hero banner
// @route   POST /admin/hero-banners
// @access  Private/Admin
export const createHeroBanner = async (req, res) => {
  try {
    const {
      badgeText,
      heading,
      description,
      primaryButtonText,
      primaryButtonLink,
      secondaryButtonText,
      secondaryButtonLink,
      imageAlt,
      featuredLabel,
      featuredTitle,
      featuredPrice,
      order,
      isActive,
    } = req.body;

    let imageUrl = req.body.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Please upload an image or provide an image URL.' });
    }

    const banner = await HeroBanner.create({
      badgeText,
      heading,
      description,
      primaryButtonText,
      primaryButtonLink,
      secondaryButtonText,
      secondaryButtonLink,
      imageUrl,
      imageAlt,
      featuredLabel,
      featuredTitle,
      featuredPrice: featuredPrice ? Number(featuredPrice) : undefined,
      order: order ? Number(order) : undefined,
      isActive: isActive === 'true' || isActive === true,
    });

    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a hero banner
// @route   PATCH /admin/hero-banners/:id
// @access  Private/Admin
export const updateHeroBanner = async (req, res) => {
  try {
    const banner = await HeroBanner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Hero banner not found' });
    }

    const {
      badgeText,
      heading,
      description,
      primaryButtonText,
      primaryButtonLink,
      secondaryButtonText,
      secondaryButtonLink,
      imageAlt,
      featuredLabel,
      featuredTitle,
      featuredPrice,
      order,
      isActive,
    } = req.body;

    banner.badgeText = badgeText !== undefined ? badgeText : banner.badgeText;
    banner.heading = heading !== undefined ? heading : banner.heading;
    banner.description = description !== undefined ? description : banner.description;
    banner.primaryButtonText = primaryButtonText !== undefined ? primaryButtonText : banner.primaryButtonText;
    banner.primaryButtonLink = primaryButtonLink !== undefined ? primaryButtonLink : banner.primaryButtonLink;
    banner.secondaryButtonText = secondaryButtonText !== undefined ? secondaryButtonText : banner.secondaryButtonText;
    banner.secondaryButtonLink = secondaryButtonLink !== undefined ? secondaryButtonLink : banner.secondaryButtonLink;
    banner.imageAlt = imageAlt !== undefined ? imageAlt : banner.imageAlt;
    banner.featuredLabel = featuredLabel !== undefined ? featuredLabel : banner.featuredLabel;
    banner.featuredTitle = featuredTitle !== undefined ? featuredTitle : banner.featuredTitle;
    
    if (featuredPrice !== undefined) banner.featuredPrice = Number(featuredPrice);
    if (order !== undefined) banner.order = Number(order);
    if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      banner.imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl !== undefined) {
      banner.imageUrl = req.body.imageUrl;
    }

    const updatedBanner = await banner.save();
    res.json({ success: true, data: updatedBanner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a hero banner
// @route   DELETE /admin/hero-banners/:id
// @access  Private/Admin
export const deleteHeroBanner = async (req, res) => {
  try {
    const banner = await HeroBanner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Hero banner not found' });
    }

    await banner.deleteOne();
    res.json({ success: true, message: 'Hero banner removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
