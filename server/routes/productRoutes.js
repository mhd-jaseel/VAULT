import express from 'express';
import {
  getProducts,
  getProductById,
  getRelatedProducts,
  getDiscountedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product/index.js';
import { protect, isAdmin, addToCartLimiter } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { validateObjectId, validatePagination } from '../validators/commonValidator.js';
import { validateCreateProduct, validateUpdateProduct } from '../validators/productValidator.js';

const router = express.Router();

router
  .route('/')
  .get(validatePagination, validateRequest, getProducts)
  .post(protect, isAdmin, upload.array('images', 5), validateCreateProduct, validateRequest, createProduct);

router.get('/related/:id', validateObjectId('id'), validateRequest, getRelatedProducts);
router.get('/discounted', getDiscountedProducts);

// Validate and add-to-cart endpoint with dedicated rate limiter
router.post('/validate-cart/:id', addToCartLimiter, validateObjectId('id'), validateRequest, validateCartItem);

router
  .route('/:id')
  .get(validateObjectId('id'), validateRequest, getProductById)
  .put(protect, isAdmin, upload.array('images', 5), validateUpdateProduct, validateRequest, updateProduct)
  .delete(protect, isAdmin, validateObjectId('id'), validateRequest, deleteProduct);

export default router;
