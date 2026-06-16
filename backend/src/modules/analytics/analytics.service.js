import { db } from '../../config/db.js';

export const getOverview = async (filters) => {
  let query = db('records');

  if (filters.psId) query = query.where('ps_id', filters.psId);
  if (filters.districtId) query = query.where('district_id', filters.districtId);

  // In a real app we'd filter by `from` and `to` dates here
  
  const total = await query.clone().count('* as count').first();
  const arrests = await query.clone().where('record_type', 'ARREST').count('* as count').first();
  const pcr = await query.clone().where('record_type', 'PCR_CALL').count('* as count').first();
  const pending = await query.clone().where('current_status', 'PENDING_SHO').count('* as count').first();

  return {
    total_records: parseInt(total.count, 10),
    arrests_today: parseInt(arrests.count, 10),
    pcr_today: parseInt(pcr.count, 10),
    pending_approvals: parseInt(pending.count, 10)
  };
};

export const getByCrimeHead = async (filters) => {
  let query = db('records')
    .select(db.raw("data->>'crime_head' as crime_head"))
    .count('* as count')
    .whereRaw("data->>'crime_head' IS NOT NULL")
    .groupBy(db.raw("data->>'crime_head'"))
    .orderBy('count', 'desc');

  if (filters.psId) query = query.where('ps_id', filters.psId);
  if (filters.districtId) query = query.where('district_id', filters.districtId);

  const results = await query;
  return results.map(r => ({
    crime_head: r.crime_head,
    count: parseInt(r.count, 10)
  }));
};

export const getByPS = async (districtId, filters) => {
  let query = db('records')
    .select('ps_id')
    .count('* as total')
    .select(db.raw(`SUM(CASE WHEN record_type = 'ARREST' THEN 1 ELSE 0 END) as arrests`))
    .select(db.raw(`SUM(CASE WHEN record_type = 'PCR_CALL' THEN 1 ELSE 0 END) as pcr`))
    .select(db.raw(`SUM(CASE WHEN record_type = 'CASE' THEN 1 ELSE 0 END) as cases`))
    .groupBy('ps_id');

  if (districtId) query = query.where('district_id', districtId);

  const results = await query;
  return results.map(r => ({
    ps_id: r.ps_id,
    total: parseInt(r.total, 10),
    arrests: parseInt(r.arrests, 10),
    pcr: parseInt(r.pcr, 10),
    cases: parseInt(r.cases, 10)
  }));
};

export const getTrends = async (filters) => {
  // Prototype stub for trends
  return [
    { date: '2024-01-01', count: 10 },
    { date: '2024-01-02', count: 15 },
    { date: '2024-01-03', count: 12 },
    { date: '2024-01-04', count: 20 },
    { date: '2024-01-05', count: 18 },
  ];
};

export const getStatusBreakdown = async (filters) => {
  let query = db('records')
    .select('current_status')
    .count('* as count')
    .groupBy('current_status');

  if (filters.psId) query = query.where('ps_id', filters.psId);
  if (filters.districtId) query = query.where('district_id', filters.districtId);

  const results = await query;
  return results.map(r => ({
    status: r.current_status,
    count: parseInt(r.count, 10)
  }));
};
