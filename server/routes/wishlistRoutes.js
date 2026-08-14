import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlist/index.js';
import { protect, isCustomer } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, isCustomer, getWishlist)
  .post(protect, isCustomer, addToWishlist);

router.delete('/:productId', protect, isCustomer, removeFromWishlist);

export default router;
