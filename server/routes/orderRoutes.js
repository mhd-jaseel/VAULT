import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  correctOrderStatus,
  getAllOrders,
  cancelOrderItem,
} from '../controllers/order/index.js';
import { protect, isAdmin, isCustomer } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .post(protect, isCustomer, createOrder)
  .get(protect, isAdmin, getAllOrders);

router.get('/myorders', protect, isCustomer, getMyOrders);

router.post('/:id/cancel-item', protect, isCustomer, cancelOrderItem);

router.route('/:id').get(protect, getOrderById);

router.put('/:id/status', protect, isAdmin, updateOrderStatus);
router.put('/:id/correct', protect, isAdmin, correctOrderStatus);

export default router;
