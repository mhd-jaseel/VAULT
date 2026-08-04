import express from 'express';
import { getProductReviews, createReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:productId', getProductReviews);
router.post('/:productId', protect, createReview);

export default router;
