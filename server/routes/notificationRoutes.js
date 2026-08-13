import express from 'express';
import Notification from '../models/Notification.js';
import Order from '../models/Order.js';
import Return from '../models/Return.js';
import Product from '../models/Product.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications — Fetch unread & recent notifications with count
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false, type } = req.query;
    const query = {};

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error('[VAULT] get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/notifications/:id/verify-action — Verify current database state before admin action
router.get('/:id/verify-action', protect, isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Auto mark as read on click
    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    let resourceObj = null;
    let stateStatus = null;
    let canPerformAction = true;
    let stateMessage = '';

    if (notification.relatedType === 'Order') {
      resourceObj = await Order.findById(notification.relatedId).lean();
      if (!resourceObj) {
        canPerformAction = false;
        stateMessage = 'Requested order is no longer available.';
      } else {
        stateStatus = resourceObj.status;
      }
    } else if (notification.relatedType === 'Return') {
      resourceObj = await Return.findById(notification.relatedId).lean();
      if (!resourceObj) {
        canPerformAction = false;
        stateMessage = 'Requested return record is no longer available.';
      } else {
        stateStatus = resourceObj.status;
        if (['COMPLETED', 'REJECTED', 'REFUNDED', 'WALLET_CREDITED'].includes(resourceObj.status)) {
          canPerformAction = false;
          stateMessage = `Return request has already been finalized (${resourceObj.status.replace(/_/g, ' ')}).`;
        }
      }
    } else if (notification.relatedType === 'Product') {
      resourceObj = await Product.findById(notification.relatedId).lean();
      if (!resourceObj) {
        canPerformAction = false;
        stateMessage = 'Requested product is no longer available.';
      } else {
        stateStatus = `Stock: ${resourceObj.stock}`;
      }
    }

    res.json({
      success: true,
      notification,
      resource: resourceObj,
      stateStatus,
      canPerformAction,
      stateMessage,
    });
  } catch (error) {
    console.error('[VAULT] verify notification action error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/notifications/:id/read — Mark single notification as read
router.patch('/:id/read', protect, isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      unreadCount,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/notifications/read-all — Mark all notifications as read
router.patch('/read-all', protect, isAdmin, async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });

    res.json({
      success: true,
      unreadCount: 0,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/notifications/clear-read — Remove all read notifications
router.delete('/clear-read', protect, isAdmin, async (req, res) => {
  try {
    await Notification.deleteMany({ isRead: true });
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      unreadCount,
      message: 'Read notifications cleared',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/notifications/:id — Remove a single notification
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      unreadCount,
      message: 'Notification deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
