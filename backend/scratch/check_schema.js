import db from '../src/config/db.js';
const r = await db.raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'records' ORDER BY ordinal_position");
console.log(JSON.stringify(r.rows, null, 2));
// Also check a sample record
const sample = await db('records').first();
if (sample) console.log('\nSample record:', JSON.stringify(sample, null, 2));
else console.log('\nNo records in table.');
await db.destroy();
