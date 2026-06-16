import { db } from '../../config/db.js';
import { publish } from '../../events/eventBus.js';
import { v4 as uuidv4 } from 'uuid';

export const getCompilations = async (districtId, period, status) => {
  let query = db('compilations').select('*');
  
  if (districtId) query = query.where({ district_id: districtId });
  if (period) query = query.where({ period });
  if (status) query = query.where({ status });
  
  return await query.orderBy('created_at', 'desc');
};

export const getCompilation = async (id) => {
  return await db('compilations').where({ id }).first();
};

export const createCompilation = async (districtId, period, userId) => {
  if (!districtId || !period) {
    throw new Error('districtId and period are required');
  }

  // Find approved records for this district and period
  const records = await db('records')
    .where({ district_id: districtId, current_status: 'DISTRICT_REVIEW' })
    // In a real implementation, filter by date based on period
    // .andWhere('created_at', '>=', periodStart)
    .select('id');
    
  const recordIds = records.map(r => r.id);
  
  if (recordIds.length === 0) {
    throw new Error('No approved records found for this period to compile');
  }

  const [compilation] = await db('compilations').insert({
    id: uuidv4(),
    district_id: districtId,
    period,
    status: 'DRAFT',
    compiled_by: userId,
    record_ids: JSON.stringify(recordIds),
    summary_data: JSON.stringify({ total_records: recordIds.length }),
    target_route: 'OPS_CHAIN' // Default
  }).returning('*');

  return compilation;
};

export const submitCompilation = async (id, userId) => {
  const compilation = await db('compilations').where({ id }).first();
  if (!compilation) throw new Error('Compilation not found');
  if (compilation.status !== 'DRAFT') throw new Error('Only DRAFT compilations can be submitted');

  const [updatedCompilation] = await db('compilations').where({ id }).update({
    status: 'SUBMITTED',
    submitted_at: db.fn.now()
  }).returning('*');

  // Also update the status of the compiled records to COMPILED
  const recordIds = typeof compilation.record_ids === 'string' 
    ? JSON.parse(compilation.record_ids) 
    : compilation.record_ids;

  if (recordIds && recordIds.length > 0) {
    await db('records').whereIn('id', recordIds).update({
      current_status: 'COMPILED',
      current_level: 'JCP',
      updated_at: db.fn.now()
    });
    
    // Log transitions for each record (simplified for prototype)
    for (const recordId of recordIds) {
      await db('workflow_transitions').insert({
        record_id: recordId,
        from_status: 'DISTRICT_REVIEW',
        to_status: 'COMPILED',
        action: 'COMPILE_SUBMIT',
        performed_by: userId
      });
    }
  }

  await publish('compilation.submitted', {
    compilationId: id,
    districtId: compilation.district_id,
    period: compilation.period,
    submitted_by: userId
  });

  return updatedCompilation;
};
