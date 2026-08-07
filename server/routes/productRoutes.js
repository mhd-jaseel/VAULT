import express from 'express';
import {
  getProducts,
  getProductById,
  getRelatedProducts,
  getDiscountedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router
  .route('/')
  .get(getProducts)
  .post(protect, isAdmin, upload.array('images', 5), createProduct);

router.get('/related/:id', getRelatedProducts);
router.get('/discounted', getDiscountedProducts);

router
  .route('/:id')
  .get(getProductById)
  .put(protect, isAdmin, upload.array('images', 5), updateProduct)
  .delete(protect, isAdmin, deleteProduct);

export default router;
