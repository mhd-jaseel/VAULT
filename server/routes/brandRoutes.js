import express from 'express';
import {
  getBrands,
  getAdminBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brand/index.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/brands', getBrands);

router.get('/admin/brands', protect, isAdmin, getAdminBrands);
router.post('/admin/brands', protect, isAdmin, createBrand);
router.patch('/admin/brands/:id', protect, isAdmin, updateBrand);
router.delete('/admin/brands/:id', protect, isAdmin, deleteBrand);

export default router;
