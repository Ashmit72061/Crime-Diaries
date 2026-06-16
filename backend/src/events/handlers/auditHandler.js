import * as eventBus from '../eventBus.js';
import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function init() {
  await eventBus.subscribe('record.*', 'audit-queue', async (payload) => {
    try {
      const recordId = payload.record_id || payload.recordId || payload.id;
      if (!recordId) return;

      const changedBy = payload.changed_by || payload.changedBy || payload.performed_by;
      if (!changedBy) return;

      const level = payload.level || payload.current_level || 'PS';
      let changeType = (payload.change_type || payload.changeType || payload.action || 'UPDATE').toUpperCase();

      // Normalize changeType mapping from events if needed
      if (payload.ts && !payload.change_type && !payload.changeType && !payload.action) {
        // Fallback checks based on event routing fields
        if (payload.reason) changeType = 'HEAD_OVERRIDE';
      }

      const fieldChanges = payload.field_changes || payload.fieldChanges || [];
      const comment = payload.comment || payload.reason || '';
      const ipAddress = payload.ip_address || payload.ipAddress || null;

      // Prevent duplicate revision insertions for CREATE, UPDATE, and HEAD_OVERRIDE
      // which are written inside transaction in records.service.js
      if (['CREATE', 'UPDATE', 'HEAD_OVERRIDE'].includes(changeType)) {
        const existing = await db('record_revisions')
          .where({ record_id: recordId, change_type: changeType })
          .orderBy('revision_number', 'desc')
          .first();
        if (existing) {
          console.log(`[AuditHandler] Revision for ${changeType} on record ${recordId} already written inline. Skipping background insert.`);
          return;
        }
      }

      // Calculate next revision number
      const countRow = await db('record_revisions')
        .where({ record_id: recordId })
        .count('* as count')
        .first();
      const nextRevNo = (parseInt(countRow.count, 10) || 0) + 1;

      // Insert revision row
      await db('record_revisions').insert({
        id: uuidv4(),
        record_id: recordId,
        revision_number: nextRevNo,
        changed_by: changedBy,
        changed_at: new Date().toISOString(),
        level,
        change_type: changeType,
        field_changes: JSON.stringify(fieldChanges),
        comment,
        ip_address: ipAddress
      });

      console.log(`[AuditHandler] Background revision written for record: ${recordId}, revision_number: ${nextRevNo}, type: ${changeType}`);
    } catch (err) {
      console.error('[AuditHandler] Failed to log revision:', err.message);
    }
  });
}
