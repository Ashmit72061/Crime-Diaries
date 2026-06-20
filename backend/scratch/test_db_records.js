import db from '../src/config/db.js';
async function test() {
  try {
    const rows = await db('report_templates').select('id', 'name_en', 'template_type', 'applicable_record_types');
    console.log("Report Templates in DB:", JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await db.destroy();
  }
}
test();
