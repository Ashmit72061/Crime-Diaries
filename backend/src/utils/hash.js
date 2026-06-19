import crypto from 'crypto';
import db from '../config/db.js';

export function computeRowHash(revision, prevHash) {
  const content = JSON.stringify({
    record_id: revision.record_id || revision.recordId,
    revision_number: Number(revision.revision_number),
    changed_by: revision.changed_by,
    changed_at: typeof revision.changed_at === 'string' ? revision.changed_at : new Date(revision.changed_at).toISOString(),
    field_changes: typeof revision.field_changes === 'string' ? revision.field_changes : JSON.stringify(revision.field_changes || []),
    prev_hash: prevHash || null,
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function getPreviousHash(recordId, trx = db) {
  const lastRev = await trx('record_revisions')
    .where({ record_id: recordId })
    .orderBy('revision_number', 'desc')
    .first();
  return lastRev ? lastRev.row_hash : null;
}

export async function verifyAuditChain(trx = db) {
  // Get all record IDs that have revisions
  const records = await trx('record_revisions').distinct('record_id');
  
  for (const r of records) {
    const recordId = r.record_id;
    const revisions = await trx('record_revisions')
      .where({ record_id: recordId })
      .orderBy('revision_number', 'asc');
    
    let lastHash = null;
    for (let i = 0; i < revisions.length; i++) {
      const rev = revisions[i];
      
      // 1. Check prev_hash matches
      if (rev.prev_hash !== lastHash) {
        return {
          valid: false,
          record_id: recordId,
          broken_revision_id: rev.id,
          reason: `prev_hash mismatch: expected ${lastHash}, got ${rev.prev_hash}`
        };
      }
      
      // 2. Check row_hash matches computed row_hash
      const computed = computeRowHash(rev, lastHash);
      if (rev.row_hash !== computed) {
        return {
          valid: false,
          record_id: recordId,
          broken_revision_id: rev.id,
          reason: `row_hash mismatch: computed ${computed}, stored ${rev.row_hash}`
        };
      }
      
      lastHash = rev.row_hash;
    }
  }
  
  return { valid: true };
}
