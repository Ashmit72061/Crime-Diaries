import dotenv from 'dotenv';
dotenv.config();
import db from '../src/config/db.js';

async function main() {
  try {
    const record = await db('records').orderBy('created_at', 'desc').first();
    if (!record) {
      console.log('No records found');
      return;
    }
    console.log('Record ID:', record.id);
    console.log('Record Type:', record.record_type);
    console.log('Data:', JSON.parse(record.data));
    
    const revisions = await db('record_revisions').where({ record_id: record.id });
    console.log('Revisions:', revisions.map(r => ({
      rev_no: r.revision_number,
      change_type: r.change_type,
      changes: JSON.parse(r.field_changes)
    })));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
main();
