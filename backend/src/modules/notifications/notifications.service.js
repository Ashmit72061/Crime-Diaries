import { db } from '../../config/db.js';
import { subscribe } from '../../events/eventBus.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export const getNotifications = async (userId, filters) => {
  let query = db('notifications').where('user_id', userId);
  
  if (filters.read !== undefined) {
    query = query.where('is_read', filters.read === 'true');
  }

  const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
  const page = filters.page ? parseInt(filters.page, 10) : 1;
  const offset = (page - 1) * limit;

  return await query.limit(limit).offset(offset).orderBy('created_at', 'desc');
};

export const getUnreadCount = async (userId) => {
  const result = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .count('* as count')
    .first();
  return parseInt(result.count, 10);
};

export const markAsRead = async (id, userId) => {
  const [updated] = await db('notifications')
    .where({ id, user_id: userId })
    .update({ is_read: true })
    .returning('*');
  return updated;
};

export const markAllAsRead = async (userId) => {
  await db('notifications')
    .where({ user_id: userId, is_read: false })
    .update({ is_read: true });
};

// Event Handlers
export const handleRecordStatusChanged = async (payload) => {
  const { recordId, action, from_status, to_status, performed_by, target_psId, comment } = payload;
  
  // Note: In a real implementation, we would fetch target users (e.g. all SHOs in a PS, HC who created it)
  // Here we just mock a target user
  const targetUserId = '00000000-0000-0000-0000-000000000000';

  await db('notifications').insert({
    id: uuidv4(),
    user_id: targetUserId,
    type: 'WORKFLOW',
    message: `Record ${recordId} changed status from ${from_status} to ${to_status} via ${action}`,
    related_entity_id: recordId,
    related_entity_type: 'RECORD'
  });
  
  logger.info(`[Notifications] Processed record.status_changed for ${recordId}`);
};

export const handleCompilationSubmitted = async (payload) => {
  const { compilationId, districtId, period, submitted_by } = payload;
  
  // Send notification to HQ
  const hqUserId = '00000000-0000-0000-0000-000000000000'; // mock
  
  await db('notifications').insert({
    id: uuidv4(),
    user_id: hqUserId,
    type: 'COMPILATION',
    message: `District compilation submitted for period ${period}`,
    related_entity_id: compilationId,
    related_entity_type: 'COMPILATION'
  });
  
  logger.info(`[Notifications] Processed compilation.submitted for ${compilationId}`);
};

// Initialize event subscriptions
export const initSubscriptions = async () => {
  try {
    await subscribe('record.status_changed', handleRecordStatusChanged);
    await subscribe('compilation.submitted', handleCompilationSubmitted);
    logger.info('Notification event subscriptions initialized');
  } catch (error) {
    logger.error('Failed to initialize notification subscriptions:', error.message);
  }
};
