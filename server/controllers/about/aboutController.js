import AboutPage from '../../models/AboutPage.js';
import User from '../../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../services/cloudinaryService.js';

// Default initial state matching existing About.jsx content
export const DEFAULT_ABOUT_DATA = {
  hero: {
    establishedYear: 'ESTABLISHED 2026',
    titlePart1: 'THE ART OF PURE',
    titleHighlight: 'CURATION',
    subtitle:
      "VAULT was founded on a simple principle: to engineer elite, premium men's essentials that stand the test of time. No shortcuts. No compromise. Just pure craftsmanship.",
  },
  story: {
    tagline: 'OUR NARRATIVE',
    heading: 'REDEFINING MODERN LUXURY',
    paragraphs: [
      'Born in Mumbai, Maharashtra, VAULT began as a creative studio focused on sourcing and refining the highest grade materials. Our journey started with custom horology timepieces and soon evolved into a comprehensive lineup of men\'s lifestyle accessories, including premium full-grain leather wallets, durable brass-buckle belts, and bespoke fragrances.',
      'We believe that premium accessories are not merely decorative—they are an extension of one\'s identity. By working directly with master artisans and removing traditional wholesale margins, we curate collections that offer exceptional refinement at honest value.',
    ],
    statsHeading: 'VAULT AT A GLANCE',
    stats: [
      { value: '100%', label: 'Full-Grain Leather' },
      { value: '10k+', label: 'Satisfied Gentlemen' },
      { value: '0%', label: 'Traditional Markup' },
      { value: '24/7', label: 'Dedicated Support' },
    ],
  },
  values: {
    tagline: 'OUR GUIDING PRINCIPLES',
    heading: 'THE PILLARS OF EXCELLENCE',
    items: [
      {
        icon: 'Award',
        title: 'Elite Quality',
        description: 'We select premium, top-grain leathers and high-grade stainless steel to ensure every piece endures.',
      },
      {
        icon: 'Compass',
        title: 'Bespoke Design',
        description: 'Minimalist, bold, and timeless silhouettes tailored for modern styles and utility.',
      },
      {
        icon: 'Heart',
        title: 'Honest Value',
        description: 'By bypassing conventional luxury retail markups, we deliver luxury straight to your doorstep.',
      },
      {
        icon: 'ShieldCheck',
        title: 'Customer Priority',
        description: 'Dedicated post-purchase assistance, straightforward returns, and complete delivery updates.',
      },
    ],
  },
  founder: {
    name: 'Aarav Sharma',
    designation: 'Founder & CEO, VAULT',
    tagline: "FOUNDER'S PERSPECTIVE",
    heading: 'A NOTE FROM AARAV SHARMA',
    image: '',
    paragraphs: [
      '"At VAULT, we don\'t believe in fast fashion. We believe in items that carry a presence, that command attention without shouting. When I started VAULT, my goal was to disrupt the accessories space by pairing exceptional, artisan-level craft with modern luxury logistics."',
      '"Each timepiece, leather piece, and fragrance is curated with extreme attention to detail. We ensure that our materials are sourced responsibly and built to last. Thank you for being a part of our journey and welcoming VAULT into your daily lifestyle."',
    ],
    isActive: true,
  },
  coFounder: {
    name: 'Rohan Varma',
    designation: 'Co-Founder & Head of Curation, VAULT',
    tagline: "CO-FOUNDER'S VISION",
    heading: 'A NOTE FROM ROHAN VARMA',
    image: '',
    paragraphs: [
      '"Design is where utility meets obsession. Every contour, stitch, and finish is rigorously tested before it bears the VAULT emblem."',
    ],
    isActive: false, // Inactive by default until admin enables or customizes
  },
  additionalSections: [],
  heroImage: '',
};

// Helper: Safely delete old image (Cloudinary or legacy)
const safeDeleteFile = async (filePath) => {
  if (!filePath) return;
  await deleteFromCloudinary(filePath);
};

/**
 * GET /api/about
 * Public: Fetch about page content (returns seeded default if not created yet)
 */
export const getAboutPageContent = async (req, res) => {
  try {
    let about = await AboutPage.findOne();
    if (!about) {
      about = await AboutPage.create(DEFAULT_ABOUT_DATA);
    }

    // Count total unique registered customers from database
    const registeredUserCount = await User.countDocuments({ role: { $ne: 'admin' } });

    const aboutObj = about.toObject ? about.toObject() : { ...about };
    aboutObj.registeredUserCount = registeredUserCount || 0;

    res.json({
      success: true,
      data: aboutObj,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/about/admin/hero
 * Protected (Admin): Upload, replace, or remove the About Hero Image
 */
export const updateHeroImage = async (req, res) => {
  try {
    let about = await AboutPage.findOne();
    if (!about) {
      about = new AboutPage(DEFAULT_ABOUT_DATA);
    }

    const { removeImage } = req.body;

    if (req.file) {
      const oldImage = about.heroImage;
      about.heroImage = await uploadToCloudinary(req.file.path || req.file.filename, 'vault/about');
      if (oldImage && oldImage !== about.heroImage) {
        await safeDeleteFile(oldImage);
      }
    } else if (removeImage === 'true' || removeImage === true) {
      if (about.heroImage) {
        await safeDeleteFile(about.heroImage);
      }
      about.heroImage = '';
    }

    await about.save();

    res.json({
      success: true,
      message: 'About hero image updated successfully.',
      data: { heroImage: about.heroImage },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/about/admin
 * Protected (Admin): Update overall about page content (Hero, Story, Values)
 */
export const updateAboutPageContent = async (req, res) => {
  try {
    let about = await AboutPage.findOne();
    if (!about) {
      about = new AboutPage(DEFAULT_ABOUT_DATA);
    }

    const { hero, story, values, heroImage } = req.body;

    if (heroImage !== undefined) about.heroImage = heroImage;
    if (hero) about.hero = { ...about.hero, ...hero };
    if (story) about.story = { ...about.story, ...story };
    if (values) about.values = { ...about.values, ...values };

    await about.save();

    res.json({
      success: true,
      message: 'About page content updated successfully.',
      data: about,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/about/admin/founder
 * Protected (Admin): Update Founder info & image
 */
export const updateFounder = async (req, res) => {
  try {
    let about = await AboutPage.findOne();
    if (!about) {
      about = new AboutPage(DEFAULT_ABOUT_DATA);
    }

    const { name, designation, tagline, heading, paragraphs, isActive, removeImage } = req.body;

    if (!about.founder) about.founder = {};

    if (name !== undefined) about.founder.name = name;
    if (designation !== undefined) about.founder.designation = designation;
    if (tagline !== undefined) about.founder.tagline = tagline;
    if (heading !== undefined) about.founder.heading = heading;
    if (isActive !== undefined) about.founder.isActive = isActive === 'true' || isActive === true;

    if (paragraphs !== undefined) {
      about.founder.paragraphs = Array.isArray(paragraphs)
        ? paragraphs
        : typeof paragraphs === 'string'
        ? paragraphs.split('\n').map((p) => p.trim()).filter(Boolean)
        : [];
    }

    // Handle Image upload or replacement via Cloudinary
    if (req.file) {
      const oldImage = about.founder.image;
      about.founder.image = await uploadToCloudinary(req.file.path || req.file.filename, 'vault/about');
      if (oldImage && oldImage !== about.founder.image) {
        await safeDeleteFile(oldImage);
      }
    } else if (removeImage === 'true' || removeImage === true) {
      if (about.founder.image) {
        await safeDeleteFile(about.founder.image);
      }
      about.founder.image = '';
    }

    await about.save();

    res.json({
      success: true,
      message: 'Founder profile updated successfully.',
      data: about.founder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/about/admin/co-founder
 * Protected (Admin): Update Co-Founder info & image
 */
export const updateCoFounder = async (req, res) => {
  try {
    let about = await AboutPage.findOne();
    if (!about) {
      about = new AboutPage(DEFAULT_ABOUT_DATA);
    }

    const { name, designation, tagline, heading, paragraphs, isActive, removeImage } = req.body;

    if (!about.coFounder) about.coFounder = {};

    if (name !== undefined) about.coFounder.name = name;
    if (designation !== undefined) about.coFounder.designation = designation;
    if (tagline !== undefined) about.coFounder.tagline = tagline;
    if (heading !== undefined) about.coFounder.heading = heading;
    if (isActive !== undefined) about.coFounder.isActive = isActive === 'true' || isActive === true;

    if (paragraphs !== undefined) {
      about.coFounder.paragraphs = Array.isArray(paragraphs)
        ? paragraphs
        : typeof paragraphs === 'string'
        ? paragraphs.split('\n').map((p) => p.trim()).filter(Boolean)
        : [];
    }

    // Handle Image upload or replacement via Cloudinary
    if (req.file) {
      const oldImage = about.coFounder.image;
      about.coFounder.image = await uploadToCloudinary(req.file.path || req.file.filename, 'vault/about');
      if (oldImage && oldImage !== about.coFounder.image) {
        await safeDeleteFile(oldImage);
      }
    } else if (removeImage === 'true' || removeImage === true) {
      if (about.coFounder.image) {
        await safeDeleteFile(about.coFounder.image);
      }
      about.coFounder.image = '';
    }

    await about.save();

    res.json({
      success: true,
      message: 'Co-Founder profile updated successfully.',
      data: about.coFounder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/about/admin/sections
 * Protected (Admin): Add a new additional custom section
 */
export const addAdditionalSection = async (req, res) => {
  try {
    let about = await AboutPage.findOne();
    if (!about) {
      about = new AboutPage(DEFAULT_ABOUT_DATA);
    }

    const { tagline, heading, content, order, isActive } = req.body;

    if (!heading || !content) {
      return res.status(400).json({ success: false, message: 'Heading and content are required.' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.path || req.file.filename, 'vault/about');
    }

    const newSection = {
      tagline: tagline || '',
      heading,
      content,
      order: Number(order) || (about.additionalSections?.length || 0),
      isActive: isActive === 'false' || isActive === false ? false : true,
      image: imageUrl,
    };

    about.additionalSections.push(newSection);
    await about.save();

    res.status(201).json({
      success: true,
      message: 'Section added successfully.',
      data: about.additionalSections[about.additionalSections.length - 1],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/about/admin/sections/:sectionId
 * Protected (Admin): Edit an existing additional custom section
 */
export const updateAdditionalSection = async (req, res) => {
  const { sectionId } = req.params;
  try {
    let about = await AboutPage.findOne();
    if (!about) {
      return res.status(404).json({ success: false, message: 'About page data not found.' });
    }

    const section = about.additionalSections.id(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    const { tagline, heading, content, order, isActive, removeImage } = req.body;

    if (tagline !== undefined) section.tagline = tagline;
    if (heading !== undefined) section.heading = heading;
    if (content !== undefined) section.content = content;
    if (order !== undefined) section.order = Number(order);
    if (isActive !== undefined) section.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      const oldImage = section.image;
      section.image = await uploadToCloudinary(req.file.path || req.file.filename, 'vault/about');
      if (oldImage && oldImage !== section.image) {
        await safeDeleteFile(oldImage);
      }
    } else if (removeImage === 'true' || removeImage === true) {
      if (section.image) {
        await safeDeleteFile(section.image);
      }
      section.image = '';
    }

    await about.save();

    res.json({
      success: true,
      message: 'Section updated successfully.',
      data: section,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/about/admin/sections/:sectionId
 * Protected (Admin): Delete an additional custom section
 */
export const deleteAdditionalSection = async (req, res) => {
  const { sectionId } = req.params;
  try {
    let about = await AboutPage.findOne();
    if (!about) {
      return res.status(404).json({ success: false, message: 'About page data not found.' });
    }

    const section = about.additionalSections.id(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    if (section.image) {
      await safeDeleteFile(section.image);
    }

    about.additionalSections.pull(sectionId);
    await about.save();

    res.json({
      success: true,
      message: 'Section deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
