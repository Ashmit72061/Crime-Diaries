import db from '../src/config/db.js';

async function run() {
  try {
    const isPg = db.client.config.client === 'pg';
    console.log('DB Client:', db.client.config.client);
    const dateExpr = isPg
      ? `to_char(record_date, 'YYYY-MM-DD')`
      : `strftime('%Y-%m-%d', record_date)`;

    let query = db('records')
      .select(db.raw(`${dateExpr} as day`), 'record_type')
      .count('* as count');

    const rows = await query
      .groupBy([db.raw(dateExpr), 'record_type'])
      .orderBy('day', 'desc')
      .limit(42);

    console.log('Query Succeeded! Rows:', rows.length);
  } catch (err) {
    console.error('Query Failed with Error:', err.message);
    console.error(err.stack);
  } finally {
    await db.destroy();
  }
}

run();
