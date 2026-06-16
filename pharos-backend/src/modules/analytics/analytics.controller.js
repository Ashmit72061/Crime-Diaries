import db from '../../config/db.js';
import ExcelJS from 'exceljs';

const parseJsonField = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return val; }
  }
  return val;
};

// Database-independent JSON extraction
const getJsonPathSql = (column, path) => {
  const isSqlite = db.client.config.client === 'sqlite3';
  if (isSqlite) {
    return `json_extract(${column}, '$.${path}')`;
  }
  return `${column}->>'${path}'`;
};

export const getSummary = async (req, res) => {
  const jq = req.jurisdictionQuery;

  try {
    let query = db('records')
      .select('record_type')
      .count('* as count')
      .whereIn('current_status', ['submitted', 'PENDING_SHO', 'DISTRICT_REVIEW', 'HQ_RECEIVED', 'CLOSED']);

    if (jq.ps_id) query = query.where('ps_id', jq.ps_id);
    if (jq.district_id) query = query.where('district_id', jq.district_id);
    if (jq.sub_div_id) query = query.where('sub_div_id', jq.sub_div_id);

    const counts = await query.groupBy('record_type');
    
    // Map array to object structure
    const data = { CASES: 0, ARREST: 0, PCR: 0, MISSING: 0 };
    counts.forEach(c => {
      data[c.record_type.toUpperCase()] = parseInt(c.count, 10) || 0;
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: data
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrends = async (req, res) => {
  const { recordType } = req.query; // cases, arrest, pcr
  const jq = req.jurisdictionQuery;

  if (!recordType) {
    return res.status(400).json({ success: false, message: 'recordType query parameter is required' });
  }

  const typeUpper = recordType.toUpperCase();
  const classificationKey = typeUpper === 'CASES' ? 'case_head' : (typeUpper === 'ARREST' ? 'crime_head' : 'pcr_head');

  try {
    const jsonPath = getJsonPathSql('data', classificationKey);
    let query = db('records')
      .select(
        db.raw(`${jsonPath} as classification`),
        db.raw(`strftime('%Y-%m', record_date) as month`), // fallback works on sqlite
        db.raw('count(*) as count')
      )
      .where({ record_type: typeUpper })
      .whereIn('current_status', ['submitted', 'PENDING_SHO', 'DISTRICT_REVIEW', 'HQ_RECEIVED', 'CLOSED']);

    if (jq.ps_id) query = query.where('ps_id', jq.ps_id);
    if (jq.district_id) query = query.where('district_id', jq.district_id);
    if (jq.sub_div_id) query = query.where('sub_div_id', jq.sub_div_id);

    const isPg = db.client.config.client === 'pg';
    if (isPg) {
      query = db('records')
        .select(
          db.raw(`${jsonPath} as classification`),
          db.raw(`to_char(record_date, 'YYYY-MM') as month`),
          db.raw('count(*) as count')
        )
        .where({ record_type: typeUpper })
        .whereIn('current_status', ['submitted', 'PENDING_SHO', 'DISTRICT_REVIEW', 'HQ_RECEIVED', 'CLOSED']);
      
      if (jq.ps_id) query = query.where('ps_id', jq.ps_id);
      if (jq.district_id) query = query.where('district_id', jq.district_id);
      if (jq.sub_div_id) query = query.where('sub_div_id', jq.sub_div_id);
    }

    const trends = await query
      .groupBy(db.raw('classification'), db.raw('month'))
      .orderBy('month', 'asc');

    return res.status(200).json({
      success: true,
      data: {
        trends: trends.map(t => ({
          classification: t.classification || 'UNKNOWN',
          period: t.month,
          count: parseInt(t.count, 10) || 0
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompare = async (req, res) => {
  const { recordType } = req.query;
  const jq = req.jurisdictionQuery;
  const { role } = req.user;

  if (!recordType) {
    return res.status(400).json({ success: false, message: 'recordType query parameter is required' });
  }

  const typeUpper = recordType.toUpperCase();

  try {
    let selectCol = 'ps.name_en';
    let groupCol = 'records.ps_id';

    if (['HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'].includes(role)) {
      selectCol = 'dist.name_en';
      groupCol = 'records.district_id';
    } else if (role === 'DISTRICT_OFFICER') {
      selectCol = 'sub.name_en';
      groupCol = 'records.sub_div_id';
    }

    let query = db('records')
      .select(`${selectCol} as label`)
      .count('* as count')
      .join('hierarchy_nodes as ps', 'records.ps_id', 'ps.id')
      .join('hierarchy_nodes as dist', 'records.district_id', 'dist.id')
      .leftJoin('hierarchy_nodes as sub', 'records.sub_div_id', 'sub.id')
      .where({ record_type: typeUpper })
      .whereIn('records.current_status', ['submitted', 'PENDING_SHO', 'DISTRICT_REVIEW', 'HQ_RECEIVED', 'CLOSED']);

    if (jq.ps_id) query = query.where('records.ps_id', jq.ps_id);
    if (jq.district_id) query = query.where('records.district_id', jq.district_id);
    if (jq.sub_div_id) query = query.where('records.sub_div_id', jq.sub_div_id);

    const compareList = await query
      .groupBy(groupCol, selectCol)
      .orderBy('count', 'desc');

    return res.status(200).json({
      success: true,
      data: {
        compare: compareList.map(c => ({
          label: c.label || 'Other',
          count: parseInt(c.count, 10) || 0
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const exportSpreadsheet = async (req, res) => {
  const { recordType } = req.query;
  const jq = req.jurisdictionQuery;

  if (!recordType) {
    return res.status(400).json({ success: false, message: 'recordType query parameter is required' });
  }

  const typeUpper = recordType.toUpperCase();

  try {
    let query = db('records')
      .select('records.*', 'ps.name_en as ps_name', 'dist.name_en as district_name')
      .join('hierarchy_nodes as ps', 'records.ps_id', 'ps.id')
      .join('hierarchy_nodes as dist', 'records.district_id', 'dist.id')
      .where({ record_type: typeUpper })
      .whereIn('records.current_status', ['submitted', 'PENDING_SHO', 'DISTRICT_REVIEW', 'HQ_RECEIVED', 'CLOSED']);

    if (jq.ps_id) query = query.where('records.ps_id', jq.ps_id);
    if (jq.district_id) query = query.where('records.district_id', jq.district_id);
    if (jq.sub_div_id) query = query.where('records.sub_div_id', jq.sub_div_id);

    const rows = await query.orderBy('records.record_date', 'desc');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${typeUpper} Records`);

    sheet.columns = [
      { header: 'UID', key: 'uid', width: 25 },
      { header: 'District', key: 'district_name', width: 20 },
      { header: 'Police Station', key: 'ps_name', width: 20 },
      { header: 'Date', key: 'record_date', width: 15 },
      { header: 'Status', key: 'current_status', width: 15 },
      { header: 'Details (JSON Block)', key: 'data_json', width: 50 }
    ];

    rows.forEach(r => {
      const dataObj = parseJsonField(r.data);
      sheet.addRow({
        uid: dataObj?.uid || r.id,
        district_name: r.district_name,
        ps_name: r.ps_name,
        record_date: r.record_date,
        current_status: r.current_status,
        data_json: JSON.stringify(dataObj)
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Pharos_${typeUpper}_Export.xlsx`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
