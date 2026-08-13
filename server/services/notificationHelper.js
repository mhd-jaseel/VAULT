import Notification from '../models/Notification.js';

export const createNotificationHelper = async ({ type, title, message, relatedId, relatedType, action }) => {
  try {
    if (!type || !title || !message || !relatedId || !relatedType || !action) {
      console.warn(`[NOTIFICATION WARN] Missing required fields for admin notification. type:${!!type} title:${!!title} message:${!!message} relatedId:${!!relatedId} relatedType:${!!relatedType} action:${!!action}`);
      return null;
    }

    // Deduplication check: Avoid duplicate active unread notification for the same type & relatedId
    const existing = await Notification.findOne({
      type,
      relatedId: String(relatedId),
      isRead: false,
    });

    if (existing) {
      existing.title = title;
      existing.message = message;
      existing.updatedAt = new Date();
      await existing.save();
      console.log(`[NOTIFICATION] Admin notification updated (deduped): type=${type} resource=${relatedId}`);
      return existing;
    }

    const notification = await Notification.create({
      type,
      title,
      message,
      relatedId: String(relatedId),
      relatedType,
      action,
      isRead: false,
    });

    console.log(`[NOTIFICATION] Admin notification created: type=${type} resource=${relatedId}`);
    return notification;
  } catch (err) {
    console.error('[VAULT] Notification creation helper error:', err.message);
    // Throw error so the caller can catch and log if they are awaiting it.
    throw err;
  }
};
