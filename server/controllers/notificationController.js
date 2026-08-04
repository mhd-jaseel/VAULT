import Notification from '../models/Notification.js';

export const getMyNotifications = async (req, res) => {
  try {
    let query = { user: req.user._id };

    // If user is admin, fetch admin targeted notifications (user: null) as well
    if (req.user.role === 'admin') {
      query = {
        $or: [{ user: req.user._id }, { user: null }],
      };
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Verify ownership
    if (notification.user && notification.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    let query = { user: req.user._id };
    if (req.user.role === 'admin') {
      query = {
        $or: [{ user: req.user._id }, { user: null }],
      };
    }

    await Notification.updateMany(query, { $set: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
