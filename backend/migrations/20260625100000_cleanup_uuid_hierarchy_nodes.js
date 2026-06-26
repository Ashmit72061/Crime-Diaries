// Removes UUID-based hierarchy_nodes inserted by the old seed-dummy-data.js script.
//
// The old script ran on every start.bat and created fresh UUID-keyed nodes each time,
// causing duplicates (e.g., 55 copies of "Central District"). The canonical hierarchy
// comes from migration 20260620000000_full_delhi_hierarchy.js (string IDs like DIST_CD,
// PS_NDD_PARLIAMENTSTREET, etc.). Those are left untouched.

export async function up(knex) {
  const deleted = await knex('hierarchy_nodes')
    .whereRaw("id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'")
    .delete();
  console.log(`[migration] Removed ${deleted} UUID-based hierarchy_nodes.`);
}

export async function down(knex) {
  // UUID nodes were junk — no rollback needed.
}
