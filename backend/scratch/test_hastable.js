import dotenv from 'dotenv';
dotenv.config();
import db from '../src/config/db.js';

async function main() {
  try {
    const isSqlite = db.client.config.client === 'sqlite3' || db.client.config.client === 'better-sqlite3';
    console.log('Is SQLite:', isSqlite);
    
    if (isSqlite) {
      const e = await db.schema.hasTable('rpt_fact_fir');
      console.log('hasTable rpt_fact_fir:', e);
    } else {
      const e1 = await db.schema.hasTable('rpt.fact_fir');
      console.log('hasTable rpt.fact_fir:', e1);
      
      const e2 = await db.schema.withSchema('rpt').hasTable('fact_fir');
      console.log('withSchema rpt hasTable fact_fir:', e2);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
main();
