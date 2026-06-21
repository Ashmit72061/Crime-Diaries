import * as eventBus from '../eventBus.js';
import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { pushToUser } from '../../modules/notifications/sse.js';
import { logger } from '../../utils/logger.js';

/**
 * Helper: insert a notification row and push it instantly via SSE.
 */
async function createNotification(notif) {
  const row = {
    id: uuidv4(),
    ...notif,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  await db('notifications').insert(row);
  // Push live to any open browser tabs for this user
  pushToUser(row.user_id, 'notification', row);
  return row;
}

export async function init() {
  // ── 1. HC submits a record → notify SHOs at that station ──────────────
  await eventBus.subscribe('record.submitted', 'notifications-submit-queue', async (payload) => {
    const { record_id, performed_by } = payload;
    try {
      const record = await db('records').where({ id: record_id }).first();
      if (!record) return;

      const shos = await db('users').where({ role: 'SHO', station_id: record.ps_id, is_active: true });
      for (const sho of shos) {
        await createNotification({
          title_en: 'New Record Pending Approval',
          title_hi: 'नया रिकॉर्ड अनुमोदन के लिए लंबित है',
          message_en: `A new ${record.record_type} entry is pending your approval.`,
          message_hi: `एक नया ${record.record_type} प्रविष्टि आपके अनुमोदन के लिए लंबित है।`,
          user_id: sho.id,
          record_id,
        });
      }
    } catch (err) {
      logger.error('[NotifyHandler] Submit notification failed:', err.message);
    }
  });

  // ── 2. SHO / ACP approves a record → notify the HC who created it ─────
  await eventBus.subscribe('record.approved', 'notifications-approve-queue', async (payload) => {
    const { record_id, performed_by, comment } = payload;
    try {
      const record = await db('records').where({ id: record_id }).first();
      if (!record) return;

      await createNotification({
        title_en: 'Record Approved',
        title_hi: 'रिकॉर्ड स्वीकृत',
        message_en: `Your ${record.record_type} record has been approved.`,
        message_hi: `आपका ${record.record_type} रिकॉर्ड स्वीकृत हो गया है।`,
        user_id: record.created_by,
        record_id,
      });
    } catch (err) {
      logger.error('[NotifyHandler] Approve notification failed:', err.message);
    }
  });

  // ── 3. SHO sends a record back → notify the HC who created it ─────────
  await eventBus.subscribe('record.sent_back', 'notifications-sendback-queue', async (payload) => {
    const { record_id, performed_by, comment } = payload;
    try {
      const record = await db('records').where({ id: record_id }).first();
      if (!record) return;

      await createNotification({
        title_en: 'Record Sent Back for Correction',
        title_hi: 'संशोधन के लिए रिकॉर्ड वापस भेजा गया',
        message_en: `Your ${record.record_type} record was sent back. Reason: ${comment || 'No reason given.'}`,
        message_hi: `आपका ${record.record_type} रिकॉर्ड वापस भेजा गया। कारण: ${comment || 'कोई कारण नहीं दिया गया।'}`,
        user_id: record.created_by,
        record_id,
      });
    } catch (err) {
      logger.error('[NotifyHandler] Send back notification failed:', err.message);
    }
  });

  // ── 4. District submits compilation → notify HQ officers ──────────────
  await eventBus.subscribe('compilation.submitted', 'notifications-compilation-queue', async (payload) => {
    const { compilation_id, district_id, period, submitted_by } = payload;
    try {
      const hqUsers = await db('users')
        .whereIn('role', ['HQ_ANALYST', 'HQ_ADMIN'])
        .where({ is_active: true });

      for (const hqUser of hqUsers) {
        await createNotification({
          title_en: 'District Compilation Submitted',
          title_hi: 'जिला संकलन प्रस्तुत किया गया',
          message_en: `A district compilation for period ${period} is ready for HQ review.`,
          message_hi: `${period} अवधि का जिला संकलन HQ समीक्षा के लिए तैयार है।`,
          user_id: hqUser.id,
          record_id: compilation_id || null,
        });
      }
    } catch (err) {
      logger.error('[NotifyHandler] Compilation notification failed:', err.message);
    }
  });
}
