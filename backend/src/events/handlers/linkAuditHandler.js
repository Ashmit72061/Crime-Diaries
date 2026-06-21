import * as eventBus from '../eventBus.js';
import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';

export async function init() {
  await eventBus.subscribe('link.*', 'link-audit-queue', async (payload) => {
    try {
      const {
        link_id, link_type_code,
        source_record_id, target_record_id,
        created_by, deleted_by, action
      } = payload;

      const actorId = created_by || deleted_by;
      if (!actorId) return;

      const actor = await db('users').where({ id: actorId }).first();
      const actionLabel = action || (deleted_by ? 'LINK_DELETED' : 'LINK_CREATED');
      const changedAt = new Date().toISOString();
      const linkMeta = JSON.stringify({ link_id, link_type_code });

      const entries = [];
      if (source_record_id) {
        entries.push({
          id: uuidv4(),
          table_name: 'record_links',
          record_id: source_record_id,
          action: actionLabel,
          changed_by_id: actorId,
          changed_by_role: actor?.role || 'UNKNOWN',
          changed_at: changedAt,
          new_value: JSON.stringify({ ...JSON.parse(linkMeta), other_record_id: target_record_id })
        });
      }
      if (target_record_id) {
        entries.push({
          id: uuidv4(),
          table_name: 'record_links',
          record_id: target_record_id,
          action: actionLabel,
          changed_by_id: actorId,
          changed_by_role: actor?.role || 'UNKNOWN',
          changed_at: changedAt,
          new_value: JSON.stringify({ ...JSON.parse(linkMeta), other_record_id: source_record_id })
        });
      }

      if (entries.length > 0) {
        await db('audit_logs').insert(entries);
        logger.info(`[LinkAuditHandler] ${actionLabel}: wrote ${entries.length} audit rows for link ${link_id}`);
      }
    } catch (err) {
      logger.error('[LinkAuditHandler] Failed:', err.message);
    }
  });
}
