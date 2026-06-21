import db from '../src/config/db.js';
async function test() {
  try {
    const info = await db.raw("PRAGMA table_info(report_jobs)");
    console.log("Table info:", info);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await db.destroy();
  }
}
test();
