import mongoose from 'mongoose';
import Review from '../../models/Review.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';

// Helper to recalculate and persist product rating aggregate
const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved',
      },
    },
    {
      $group: {
        _id: '$product',
        count: { $sum: 1 },
        average: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      'ratings.count': stats[0].count,
      'ratings.average': Math.round(stats[0].average * 10) / 10,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      'ratings.count': 0,
      'ratings.average': 0,
    });
  }
};

/**
 * GET /api/reviews/product/:productId
 * Public: Get reviews for a product with pagination, rating filters, sorting, and rating breakdown
 */
export const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
  const ratingFilter = parseInt(req.query.rating) || null;
  const sortBy = req.query.sortBy || 'relevant'; // relevant, newest, highest, lowest, helpful

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const prodObjectId = new mongoose.Types.ObjectId(productId);

    // 1. Calculate overall rating distribution across all approved reviews for this product
    const distributionAgg = await Review.aggregate([
      {
        $match: {
          product: prodObjectId,
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    let totalApprovedReviews = 0;
    let sumRating = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    distributionAgg.forEach((item) => {
      const r = item._id;
      if (distribution[r] !== undefined) {
        distribution[r] = item.count;
        totalApprovedReviews += item.count;
        sumRating += r * item.count;
      }
    });

    const averageRating =
      totalApprovedReviews > 0
        ? Math.round((sumRating / totalApprovedReviews) * 10) / 10
        : 0;

    const distributionPercentages = {
      5: totalApprovedReviews > 0 ? Math.round((distribution[5] / totalApprovedReviews) * 100) : 0,
      4: totalApprovedReviews > 0 ? Math.round((distribution[4] / totalApprovedReviews) * 100) : 0,
      3: totalApprovedReviews > 0 ? Math.round((distribution[3] / totalApprovedReviews) * 100) : 0,
      2: totalApprovedReviews > 0 ? Math.round((distribution[2] / totalApprovedReviews) * 100) : 0,
      1: totalApprovedReviews > 0 ? Math.round((distribution[1] / totalApprovedReviews) * 100) : 0,
    };

    // 2. Build Query for listing reviews
    const query = {
      product: prodObjectId,
      status: 'approved',
    };

    if (ratingFilter && [1, 2, 3, 4, 5].includes(ratingFilter)) {
      query.rating = ratingFilter;
    }

    // 3. Sorting configuration
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'newest') sortOptions = { createdAt: -1 };
    else if (sortBy === 'highest') sortOptions = { rating: -1, createdAt: -1 };
    else if (sortBy === 'lowest') sortOptions = { rating: 1, createdAt: -1 };
    else if (sortBy === 'helpful') sortOptions = { helpfulCount: -1, createdAt: -1 };
    else if (sortBy === 'relevant') sortOptions = { isVerifiedPurchase: -1, helpfulCount: -1, createdAt: -1 };

    const totalFiltered = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Map helpful status if user is authenticated
    const userIdStr = req.user ? req.user._id.toString() : null;
    const mappedReviews = reviews.map((rev) => {
      const isHelpfulByUser = userIdStr
        ? (rev.helpfulVotes || []).some((id) => id.toString() === userIdStr)
        : false;
      const isReportedByUser = userIdStr
        ? (rev.reports || []).some((r) => r.user && r.user.toString() === userIdStr)
        : false;

      return {
        _id: rev._id,
        user: {
          _id: rev.user?._id,
          name: rev.user?.name || 'Customer',
          avatar: rev.user?.avatar || null,
        },
        rating: rev.rating,
        title: rev.title || '',
        comment: rev.comment,
        images: rev.images || [],
        isVerifiedPurchase: rev.isVerifiedPurchase,
        helpfulCount: rev.helpfulCount || 0,
        isHelpful: isHelpfulByUser,
        isReported: isReportedByUser,
        createdAt: rev.createdAt,
        updatedAt: rev.updatedAt,
      };
    });

    res.json({
      success: true,
      data: {
        reviews: mappedReviews,
        stats: {
          averageRating,
          totalReviews: totalApprovedReviews,
          distribution,
          distributionPercentages,
        },
        pagination: {
          page,
          limit,
          total: totalFiltered,
          pages: Math.ceil(totalFiltered / limit) || 1,
          hasMore: page * limit < totalFiltered,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/reviews/eligibility/:productId
 * Protected: Check if authenticated user is eligible to review product
 */
export const checkEligibility = async (req, res) => {
  const { productId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    // Check if user has an eligible delivered order with active item
    const eligibleOrder = await Order.findOne({
      user: req.user._id,
      status: 'delivered',
      items: {
        $elemMatch: {
          product: productId,
          status: { $nin: ['CANCELLED', 'CANCEL_REQUESTED', 'RETURN_APPROVED', 'REFUNDED'] },
        },
      },
    }).sort({ deliveredAt: -1, createdAt: -1 });

    const isEligible = Boolean(eligibleOrder);

    res.json({
      success: true,
      data: {
        isEligible,
        hasReviewed: Boolean(existingReview),
        existingReview: existingReview || null,
        orderId: eligibleOrder ? eligibleOrder._id : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/reviews
 * Protected: Create verified product review
 */
export const createReview = async (req, res) => {
  const { productId, rating, title, comment } = req.body;

  try {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Valid product ID is required.' });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Review comment is required.' });
    }

    if (comment.trim().length > 2000) {
      return res.status(400).json({ success: false, message: 'Review comment cannot exceed 2000 characters.' });
    }

    if (title && title.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Review title cannot exceed 100 characters.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // 1. Verify 1 review per user per product
    const existingReview = await Review.findOne({ product: productId, user: req.user._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product. You can edit your existing review.',
      });
    }

    // 2. Strict purchase verification
    const eligibleOrder = await Order.findOne({
      user: req.user._id,
      status: 'delivered',
      items: {
        $elemMatch: {
          product: productId,
          status: { $nin: ['CANCELLED', 'CANCEL_REQUESTED', 'RETURN_APPROVED', 'REFUNDED'] },
        },
      },
    });

    if (!eligibleOrder) {
      return res.status(403).json({
        success: false,
        message: 'Only verified purchasers with delivered orders can submit a review.',
      });
    }

    // Process uploaded images (up to 5)
    let images = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({ success: false, message: 'Maximum 5 photos allowed per review.' });
      }
      images = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      order: eligibleOrder._id,
      rating: numericRating,
      title: (title || '').trim(),
      comment: comment.trim(),
      images,
      isVerifiedPurchase: true,
      status: 'approved',
    });

    // Update product rating stats
    await recalculateProductRating(productId);

    const populated = await Review.findById(review._id).populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/reviews/:reviewId
 * Protected: Edit own review
 */
export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, title, comment, existingImages } = req.body;

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only edit your own review.' });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
      }
      review.rating = numRating;
    }

    if (title !== undefined) {
      if (title.trim().length > 100) {
        return res.status(400).json({ success: false, message: 'Review title cannot exceed 100 characters.' });
      }
      review.title = title.trim();
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({ success: false, message: 'Review comment cannot be empty.' });
      }
      if (comment.trim().length > 2000) {
        return res.status(400).json({ success: false, message: 'Review comment cannot exceed 2000 characters.' });
      }
      review.comment = comment.trim();
    }

    // Handle existing images retained + new files uploaded
    let retainedImages = [];
    if (existingImages) {
      try {
        retainedImages = Array.isArray(existingImages)
          ? existingImages
          : JSON.parse(existingImages);
      } catch (e) {
        retainedImages = [existingImages];
      }
    }

    let newImages = [];
    if (req.files && Array.isArray(req.files)) {
      newImages = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const totalImages = [...retainedImages, ...newImages];
    if (totalImages.length > 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 photos allowed per review.' });
    }
    review.images = totalImages;

    await review.save();
    await recalculateProductRating(review.product);

    const populated = await Review.findById(review._id).populate('user', 'name avatar');

    res.json({
      success: true,
      message: 'Review updated successfully.',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/reviews/:reviewId
 * Protected: Delete own review (or admin deletion)
 */
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own review.' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate rating aggregate
    await recalculateProductRating(productId);

    res.json({ success: true, message: 'Review deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/reviews/:reviewId/helpful
 * Protected: Toggle helpful vote for a review
 */
export const toggleHelpful = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const existingVoteIndex = (review.helpfulVotes || []).findIndex(
      (id) => id.toString() === userId.toString()
    );

    let isHelpful = false;
    if (existingVoteIndex > -1) {
      // User already marked helpful: remove vote
      review.helpfulVotes.splice(existingVoteIndex, 1);
      review.helpfulCount = Math.max(0, (review.helpfulCount || 1) - 1);
      isHelpful = false;
    } else {
      // Add helpful vote
      review.helpfulVotes.push(userId);
      review.helpfulCount = (review.helpfulCount || 0) + 1;
      isHelpful = true;
    }

    await review.save();

    res.json({
      success: true,
      data: {
        helpfulCount: review.helpfulCount,
        isHelpful,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/reviews/:reviewId/report
 * Protected: Report inappropriate review
 */
export const reportReview = async (req, res) => {
  const { reviewId } = req.params;
  const { reason = 'Inappropriate content' } = req.body;
  const userId = req.user._id;

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const alreadyReported = (review.reports || []).some(
      (r) => r.user && r.user.toString() === userId.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({ success: false, message: 'You have already reported this review.' });
    }

    review.reports.push({
      user: userId,
      reason: reason.trim() || 'Inappropriate content',
      createdAt: new Date(),
    });
    review.reportCount = (review.reportCount || 0) + 1;

    await review.save();

    res.json({
      success: true,
      message: 'Thank you. The review has been reported for moderation.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADMIN MODERATION CONTROLLERS ─────────────────────────────────────────────

/**
 * GET /api/reviews/admin/all
 * Protected (Admin): List reviews with filters (status, rating, search, reported) and pagination
 */
export const getAdminReviews = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
  const { status, rating, reportedOnly, search } = req.query;

  try {
    const query = {};

    if (status && ['pending', 'approved', 'rejected', 'hidden'].includes(status)) {
      query.status = status;
    }

    if (rating && [1, 2, 3, 4, 5].includes(Number(rating))) {
      query.rating = Number(rating);
    }

    if (reportedOnly === 'true' || reportedOnly === true) {
      query.reportCount = { $gt: 0 };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { comment: searchRegex }];
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('user', 'name email avatar')
      .populate('product', 'name slug images')
      .populate('order', '_id createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/reviews/admin/:reviewId/status
 * Protected (Admin): Update review status (approve, reject, hide)
 */
export const updateAdminReviewStatus = async (req, res) => {
  const { reviewId } = req.params;
  const { status } = req.body;

  try {
    if (!['pending', 'approved', 'rejected', 'hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    review.status = status;
    await review.save();

    // Recalculate product rating since visibility changed
    await recalculateProductRating(review.product);

    res.json({
      success: true,
      message: `Review status changed to ${status}.`,
      data: review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/reviews/my-reviews
 * Protected (Customer): Get current authenticated user's reviews with pagination and populated product
 */
export const getMyReviews = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));

  try {
    const query = { user: req.user._id };
    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('product', 'name price images slug category brand ratings')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/reviews/homepage
 * Public: Get approved & admin-featured customer reviews for homepage carousel
 */
export const getHomepageReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      status: 'approved',
      showOnHomepage: true,
    })
      .populate('user', 'name avatar')
      .populate('product', 'name price images slug')
      .sort({ homepageOrder: 1, createdAt: -1 })
      .limit(12)
      .lean();

    const formattedReviews = reviews.map((rev) => ({
      _id: rev._id,
      rating: rev.rating,
      title: rev.title || '',
      comment: rev.comment,
      images: rev.images || [],
      isVerifiedPurchase: rev.isVerifiedPurchase,
      createdAt: rev.createdAt,
      user: {
        name: rev.user?.name || 'Verified Customer',
        avatar: rev.user?.avatar || null,
      },
      product: rev.product
        ? {
            _id: rev.product._id,
            name: rev.product.name,
            price: rev.product.price,
            images: rev.product.images || [],
            slug: rev.product.slug,
          }
        : null,
    }));

    res.json({
      success: true,
      data: formattedReviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/reviews/admin/:reviewId/homepage
 * Protected (Admin): Toggle or update homepage visibility and order for an approved review
 */
export const updateAdminReviewHomepage = async (req, res) => {
  const { reviewId } = req.params;
  const { showOnHomepage, homepageOrder } = req.body;

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (showOnHomepage !== undefined) {
      review.showOnHomepage = Boolean(showOnHomepage);
    }

    if (homepageOrder !== undefined) {
      review.homepageOrder = Number(homepageOrder) || 0;
    }

    await review.save();

    res.json({
      success: true,
      message: `Homepage display updated for review.`,
      data: review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


