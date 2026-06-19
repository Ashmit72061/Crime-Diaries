import * as notificationsService from './notifications.service.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const notifications = await notificationsService.getNotifications(userId, req.query);
    res.status(200).json({ status: 'success', data: notifications });
  } catch (error) {
    next(error);
  }
};

export const getNotificationCount = async (req, res, next) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const count = await notificationsService.getUnreadCount(userId);
    res.status(200).json({ status: 'success', data: { count } });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const updated = await notificationsService.markAsRead(id, userId);
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    await notificationsService.markAllAsRead(userId);
    res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
