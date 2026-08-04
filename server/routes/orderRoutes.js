import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} from '../controllers/orderController.js';
import { protect, isAdmin, isCustomer } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .post(protect, isCustomer, createOrder)
  .get(protect, isAdmin, getAllOrders);

router.get('/myorders', protect, isCustomer, getMyOrders);

router.route('/:id').get(protect, getOrderById);

router.put('/:id/status', protect, isAdmin, updateOrderStatus);

export default router;
