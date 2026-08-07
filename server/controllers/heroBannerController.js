import HeroBanner from '../models/HeroBanner.js';
import { paginateAggregate } from '../utils/paginate.js';

// @desc    Get all active hero banners
// @route   GET /hero-banners
// @access  Public
export const getHeroBanners = async (req, res) => {
  try {
    const { page, limit = 5 } = req.query;
    const now = new Date();
    const query = {
      isActive: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] }
      ]
    };

    if (page) {
      const result = await paginateAggregate(HeroBanner, query, { order: 1 }, page, limit);
      return res.json({
        success: true,
        data: result.data,
        page: result.page,
        pages: result.pages,
        total: result.total,
      });
    }

    const banners = await HeroBanner.find(query).sort({ order: 1 });
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
      backgroundStyle,
      textAlignment,
      overlayOpacity,
      startDate,
      endDate,
      bannerType,
    } = req.body;

    let imageUrl = req.body.imageUrl;
    let mobileImageUrl = req.body.mobileImageUrl;
    let modelImageUrl = req.body.modelImageUrl;
    let productImageUrl = req.body.productImageUrl;

    if (req.files) {
      if (req.files.imageUrl && req.files.imageUrl[0]) {
        imageUrl = `/uploads/${req.files.imageUrl[0].filename}`;
      }
      if (req.files.mobileImageUrl && req.files.mobileImageUrl[0]) {
        mobileImageUrl = `/uploads/${req.files.mobileImageUrl[0].filename}`;
      }
      if (req.files.modelImageUrl && req.files.modelImageUrl[0]) {
        modelImageUrl = `/uploads/${req.files.modelImageUrl[0].filename}`;
      }
      if (req.files.productImageUrl && req.files.productImageUrl[0]) {
        productImageUrl = `/uploads/${req.files.productImageUrl[0].filename}`;
      }
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Please upload a desktop image or provide an image URL.' });
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
      mobileImageUrl,
      modelImageUrl,
      productImageUrl,
      backgroundStyle,
      textAlignment,
      overlayOpacity: overlayOpacity ? Number(overlayOpacity) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      bannerType,
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
      backgroundStyle,
      textAlignment,
      overlayOpacity,
      startDate,
      endDate,
      bannerType,
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
    banner.backgroundStyle = backgroundStyle !== undefined ? backgroundStyle : banner.backgroundStyle;
    banner.textAlignment = textAlignment !== undefined ? textAlignment : banner.textAlignment;
    banner.bannerType = bannerType !== undefined ? bannerType : banner.bannerType;
    
    if (featuredPrice !== undefined) banner.featuredPrice = Number(featuredPrice);
    if (order !== undefined) banner.order = Number(order);
    if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;
    if (overlayOpacity !== undefined) banner.overlayOpacity = Number(overlayOpacity);
    if (startDate !== undefined) banner.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) banner.endDate = endDate ? new Date(endDate) : undefined;

    if (req.files) {
      if (req.files.imageUrl && req.files.imageUrl[0]) {
        banner.imageUrl = `/uploads/${req.files.imageUrl[0].filename}`;
      }
      if (req.files.mobileImageUrl && req.files.mobileImageUrl[0]) {
        banner.mobileImageUrl = `/uploads/${req.files.mobileImageUrl[0].filename}`;
      }
      if (req.files.modelImageUrl && req.files.modelImageUrl[0]) {
        banner.modelImageUrl = `/uploads/${req.files.modelImageUrl[0].filename}`;
      }
      if (req.files.productImageUrl && req.files.productImageUrl[0]) {
        banner.productImageUrl = `/uploads/${req.files.productImageUrl[0].filename}`;
      }
    } else {
      if (req.body.imageUrl !== undefined) banner.imageUrl = req.body.imageUrl;
      if (req.body.mobileImageUrl !== undefined) banner.mobileImageUrl = req.body.mobileImageUrl;
      if (req.body.modelImageUrl !== undefined) banner.modelImageUrl = req.body.modelImageUrl;
      if (req.body.productImageUrl !== undefined) banner.productImageUrl = req.body.productImageUrl;
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
