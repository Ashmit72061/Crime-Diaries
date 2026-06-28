import db from '../src/config/db.js';

async function run() {
  try {
    const info = await db.raw("PRAGMA table_info(field_registry);");
    console.log(info);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();