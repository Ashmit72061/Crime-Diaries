import dotenv from 'dotenv';
dotenv.config();
import db from '../src/config/db.js';

async function main() {
  try {
    const types = await db('records').distinct('record_type');
    console.log('Record types found in DB:', types.map(t => t.record_type));

    for (const type of types.map(t => t.record_type)) {
      const sample = await db('records').where({ record_type: type }).first();
      console.log(`\nSample record for type ${type}:`);
      console.log('ID:', sample.id);
      console.log('PS_ID:', sample.ps_id);
      console.log('District_ID:', sample.district_id);
      console.log('Record Date:', sample.record_date);
      console.log('Current Status:', sample.current_status);
      console.log('DataKeys:', Object.keys(JSON.parse(sample.data)));
      console.log('Data JSON:', JSON.parse(sample.data));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
main();
