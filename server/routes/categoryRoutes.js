import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router
  .route('/')
  .get(getCategories)
  .post(protect, isAdmin, upload.single('image'), createCategory);

router
  .route('/:id')
  .get(getCategoryById)
  .put(protect, isAdmin, upload.single('image'), updateCategory)
  .delete(protect, isAdmin, deleteCategory);

export default router;
