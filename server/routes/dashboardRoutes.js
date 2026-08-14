import express from 'express';
import { getDashboardStats } from '../controllers/dashboard/index.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, isAdmin, getDashboardStats);

export default router;
