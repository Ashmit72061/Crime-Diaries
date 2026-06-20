import db from '../../config/db.js';

/**
 * analytics.service.js
 * Internal service helpers used by legacy or direct service calls.
 * The primary analytics endpoints are handled in analytics.controller.js
 * which applies RBAC jurisdiction scoping via req.jurisdictionQuery.
 */

const getJsonPathSql = (column, path) => {
  const isSqlite = db.client.config.client === 'sqlite3';
  if (isSqlite) return `json_extract(${column}, '$.${path}')`;
  return `(${column})::jsonb->>'${path}'`;
};

export const getOverview = async (filters = {}) => {
  let query = db('records');
  if (filters.psId) query = query.where('ps_id', filters.psId);
  if (filters.districtId) query = query.where('district_id', filters.districtId);
  if (filters.from) query = query.where('record_date', '>=', filters.from);
  if (filters.to) query = query.where('record_date', '<=', filters.to);

  const [total, arrests, pcr, pending] = await Promise.all([
    query.clone().count('* as count').first(),
    query.clone().where('record_type', 'ARREST').count('* as count').first(),
    query.clone().where('record_type', 'PCR_CALL').count('* as count').first(),
    query.clone().where('current_status', 'PENDING_SHO').count('* as count').first(),
  ]);

  return {
    total_records: parseInt(total.count, 10) || 0,
    arrests_today: parseInt(arrests.count, 10) || 0,
    pcr_today: parseInt(pcr.count, 10) || 0,
    pending_approvals: parseInt(pending.count, 10) || 0,
  };
};

export const getByCrimeHead = async (filters = {}) => {
  const jsonPath = getJsonPathSql('data', 'crime_head');
  let query = db('records')
    .select(db.raw(`${jsonPath} as crime_head`))
    .count('* as count')
    .whereRaw(`${jsonPath} IS NOT NULL`)
    .groupBy(db.raw(jsonPath))
    .orderBy('count', 'desc')
    .limit(15);

  if (filters.psId) query = query.where('ps_id', filters.psId);
  if (filters.districtId) query = query.where('district_id', filters.districtId);

  const results = await query;
  return results.map(r => ({
    crime_head: r.crime_head || 'UNCATEGORIZED',
    count: parseInt(r.count, 10) || 0,
  }));
};

export const getByPS = async (districtId, filters = {}) => {
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
    total: parseInt(r.total, 10) || 0,
    arrests: parseInt(r.arrests, 10) || 0,
    pcr: parseInt(r.pcr, 10) || 0,
    cases: parseInt(r.cases, 10) || 0,
  }));
};

export const getTrends = async (filters = {}) => {
  const isPg = db.client.config.client === 'pg';
  const dateExpr = isPg
    ? `to_char(record_date, 'YYYY-MM-DD')`
    : `strftime('%Y-%m-%d', record_date)`;

  let query = db('records')
    .select(db.raw(`${dateExpr} as day`), 'record_type')
    .count('* as count');

  if (filters.psId) query = query.where('ps_id', filters.psId);
  if (filters.districtId) query = query.where('district_id', filters.districtId);
  if (filters.from) query = query.where('record_date', '>=', filters.from);
  if (filters.to) query = query.where('record_date', '<=', filters.to);

  const rows = await query
    .groupBy(db.raw(dateExpr), 'record_type')
    .orderBy(db.raw(dateExpr), 'asc')
    .limit(60);

  const dayMap = {};
  rows.forEach(r => {
    const name = r.day || 'Unknown';
    if (!dayMap[name]) dayMap[name] = { name, cases: 0, pcr: 0, arrests: 0 };
    const type = (r.record_type || '').toUpperCase();
    const count = parseInt(r.count, 10) || 0;
    if (type === 'CASE') dayMap[name].cases = count;
    else if (type === 'PCR_CALL') dayMap[name].pcr = count;
    else if (type === 'ARREST') dayMap[name].arrests = count;
  });

  return Object.values(dayMap);
};

export const getStatusBreakdown = async (filters = {}) => {
  let query = db('records')
    .select('current_status')
    .count('* as count')
    .groupBy('current_status');

  if (filters.psId) query = query.where('ps_id', filters.psId);
  if (filters.districtId) query = query.where('district_id', filters.districtId);

  const results = await query;
  return results.map(r => ({
    status: r.current_status,
    count: parseInt(r.count, 10) || 0,
  }));
};
