import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import db from './backend/src/config/db.js';

async function testQuery() {
  try {
    let query = db('records')
      .select('hn.name_en as station', 'records.record_type')
      .count('* as count')
      .join('hierarchy_nodes as hn', 'records.ps_id', 'hn.id');

    query = query.where('records.district_id', 'DIST-1');

    const rows = await query.groupBy('hn.name_en', 'records.record_type').orderBy('hn.name_en');
    console.log(rows);
  } catch (err) {
    console.error("ERROR", err);
  } finally {
    process.exit();
  }
}

testQuery();
