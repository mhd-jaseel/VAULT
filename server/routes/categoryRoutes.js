import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category/index.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { validateObjectId } from '../validators/commonValidator.js';
import { validateCreateCategory } from '../validators/categoryValidator.js';

const router = express.Router();

router
  .route('/')
  .get(getCategories)
  .post(protect, isAdmin, upload.single('image'), validateCreateCategory, validateRequest, createCategory);

router
  .route('/:id')
  .get(validateObjectId('id'), validateRequest, getCategoryById)
  .put(protect, isAdmin, upload.single('image'), validateObjectId('id'), validateRequest, updateCategory)
  .delete(protect, isAdmin, validateObjectId('id'), validateRequest, deleteCategory);

export default router;
