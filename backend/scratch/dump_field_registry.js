import db from '../src/config/db.js';

async function run() {
  try {
    const fields = await db('field_registry').select('*').orderBy('sort_order');
    console.log(JSON.stringify(fields, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error querying field registry:', err);
    process.exit(1);
  }
}

run();
