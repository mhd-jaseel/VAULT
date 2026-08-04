import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.put('/readall', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

export default router;
