import * as eventBus from '../eventBus.js';
import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function init() {
  // 1. Listen to record submissions
  await eventBus.subscribe('record.submitted', 'notifications-submit-queue', async (payload) => {
    const { record_id, performed_by } = payload;
    try {
      const record = await db('records').where({ id: record_id }).first();
      if (!record) return;

      // Find SHOs at this station
      const shos = await db('users').where({ role: 'SHO', station_id: record.ps_id, is_active: true });
      for (const sho of shos) {
        await db('notifications').insert({
          id: uuidv4(),
          title_en: 'New Record Pending Approval',
          title_hi: 'नया रिकॉर्ड अनुमोदन के लिए लंबित है',
          message_en: `A new ${record.record_type} entry is pending your approval.`,
          message_hi: `एक नया ${record.record_type} प्रविष्टि आपके अनुमोदन के लिए लंबित है।`,
          user_id: sho.id,
          record_id: record_id,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('[NotifyHandler] Submit notification failed:', err.message);
    }
  });

  // 2. Listen to record approvals
  await eventBus.subscribe('record.approved', 'notifications-approve-queue', async (payload) => {
    const { record_id, performed_by, comment } = payload;
    try {
      const record = await db('records').where({ id: record_id }).first();
      if (!record) return;

      // Notify the operator who created the record
      await db('notifications').insert({
        id: uuidv4(),
        title_en: 'Record Approved',
        title_hi: 'रिकॉर्ड स्वीकृत',
        message_en: `Your ${record.record_type} record has been approved. Status: ${record.current_status}.`,
        message_hi: `आपका ${record.record_type} रिकॉर्ड स्वीकृत हो गया है। स्थिति: ${record.current_status}।`,
        user_id: record.created_by,
        record_id: record_id,
        is_read: false,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('[NotifyHandler] Approve notification failed:', err.message);
    }
  });

  // 3. Listen to record sendbacks
  await eventBus.subscribe('record.sent_back', 'notifications-sendback-queue', async (payload) => {
    const { record_id, performed_by, comment } = payload;
    try {
      const record = await db('records').where({ id: record_id }).first();
      if (!record) return;

      // Notify the operator
      await db('notifications').insert({
        id: uuidv4(),
        title_en: 'Record Sent Back for Correction',
        title_hi: 'संशोधन के लिए रिकॉर्ड वापस भेजा गया',
        message_en: `Your ${record.record_type} record was sent back for correction. Reason: ${comment || 'No reason given.'}`,
        message_hi: `आपका ${record.record_type} रिकॉर्ड संशोधन के लिए वापस भेजा गया। कारण: ${comment || 'कोई कारण नहीं दिया गया।'}`,
        user_id: record.created_by,
        record_id: record_id,
        is_read: false,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('[NotifyHandler] Send back notification failed:', err.message);
    }
  });
}
