import express from 'express';
import {
  getProductReviews,
  checkEligibility,
  createReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  reportReview,
  getAdminReviews,
  updateAdminReviewStatus,
  getMyReviews,
  getHomepageReviews,
  updateAdminReviewHomepage,
} from '../controllers/review/index.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { validateObjectId } from '../validators/commonValidator.js';
import { validateCreateReview, validateUpdateReview } from '../validators/reviewValidator.js';

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get('/homepage', getHomepageReviews);

router.get('/product/:productId', validateObjectId('productId'), validateRequest, (req, res, next) => {
  // Optional auth parsing to detect user helpful/reported state if token exists
  if (req.cookies && req.cookies.token) {
    return protect(req, res, () => getProductReviews(req, res, next));
  }
  getProductReviews(req, res, next);
});

// ── Customer Protected Routes ────────────────────────────────────────────────
router.get('/my-reviews', protect, getMyReviews);
router.get('/eligibility/:productId', protect, validateObjectId('productId'), validateRequest, checkEligibility);
router.post('/', protect, upload.array('images', 5), validateCreateReview, validateRequest, createReview);
router.put('/:reviewId', protect, upload.array('images', 5), validateUpdateReview, validateRequest, updateReview);
router.delete('/:reviewId', protect, validateObjectId('reviewId'), validateRequest, deleteReview);

router.post('/:reviewId/helpful', protect, validateObjectId('reviewId'), validateRequest, toggleHelpful);
router.post('/:reviewId/report', protect, validateObjectId('reviewId'), validateRequest, reportReview);

// ── Admin Moderation Routes ──────────────────────────────────────────────────
router.get('/admin/all', protect, isAdmin, getAdminReviews);
router.patch('/admin/:reviewId/status', protect, isAdmin, validateObjectId('reviewId'), validateRequest, updateAdminReviewStatus);
router.patch('/admin/:reviewId/homepage', protect, isAdmin, validateObjectId('reviewId'), validateRequest, updateAdminReviewHomepage);
router.delete('/admin/:reviewId', protect, isAdmin, validateObjectId('reviewId'), validateRequest, deleteReview);

export default router;
