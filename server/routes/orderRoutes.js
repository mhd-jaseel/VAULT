import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  correctOrderStatus,
  getAllOrders,
  cancelOrderItem,
  adminCancelOrder,
  markOrderRefunded,
} from '../controllers/order/index.js';
import { protect, isAdmin, isCustomer } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { validateObjectId, validatePagination, validateOrderFilterQuery } from '../validators/commonValidator.js';
import { validateCreateOrder, validateUpdateOrderStatus } from '../validators/orderValidator.js';

const router = express.Router();

router
  .route('/')
  .post(protect, isCustomer, validateCreateOrder, validateRequest, createOrder)
  .get(protect, isAdmin, validateOrderFilterQuery, validateRequest, getAllOrders);

router.get('/myorders', protect, isCustomer, validatePagination, validateRequest, getMyOrders);

router.post('/:id/cancel-item', protect, isCustomer, validateObjectId('id'), validateRequest, cancelOrderItem);

router.route('/:id').get(protect, validateObjectId('id'), validateRequest, getOrderById);

router.put('/:id/status', protect, isAdmin, validateUpdateOrderStatus, validateRequest, updateOrderStatus);
router.put('/:id/correct', protect, isAdmin, validateObjectId('id'), validateRequest, correctOrderStatus);
router.patch('/:id/cancel', protect, isAdmin, validateObjectId('id'), validateRequest, adminCancelOrder);
router.patch('/:id/mark-refunded', protect, isAdmin, validateObjectId('id'), validateRequest, markOrderRefunded);

export default router;
