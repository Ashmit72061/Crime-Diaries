/**
 * Migration: GIN Index + Analytics Materialized View
 *
 * 1. GIN index on records.data (JSONB) — makes all JSON field filtering
 *    (EQ, CONTAINS, IN operators in the query builder) use index scans
 *    instead of full table scans. Critical for scale.
 *
 * 2. Materialized view `mv_record_stats` — pre-aggregates record counts
 *    by PS, district, record type, status and date. The analytics and
 *    report endpoints can query this flat view instead of scanning the
 *    full records table on every request.
 *    Refresh via: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_record_stats;
 *    (wired to node-cron in scheduler.js)
 *
 * Note: GIN indexes and materialized views are PostgreSQL-only features.
 *       This migration gracefully skips on SQLite for local dev.
 */

export async function up(knex) {
  // 1. GIN index on the data column (stored as text, cast to jsonb for indexing)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_records_data_gin
    ON records
    USING GIN ((data::jsonb));
  `);

  // 2. Standard B-tree indexes on the most commonly filtered columns
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_records_ps_id      ON records (ps_id);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_records_district_id ON records (district_id);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_records_record_type ON records (record_type);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_records_status      ON records (current_status);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_records_record_date ON records (record_date DESC);`);

  // 3. Materialized view — flat aggregation by (ps, district, type, status, date)
  //    Unique index required for CONCURRENTLY refreshes.
  await knex.raw(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS mv_record_stats AS
    SELECT
      r.ps_id,
      ps.name_en            AS ps_name,
      r.district_id,
      dist.name_en          AS district_name,
      r.sub_div_id,
      r.record_type,
      r.current_status,
      r.record_date,
      COUNT(*)              AS record_count
    FROM records r
    JOIN hierarchy_nodes ps   ON ps.id   = r.ps_id
    JOIN hierarchy_nodes dist ON dist.id = r.district_id
    GROUP BY
      r.ps_id, ps.name_en,
      r.district_id, dist.name_en,
      r.sub_div_id,
      r.record_type,
      r.current_status,
      r.record_date
    WITH DATA;
  `);

  // Unique index needed so REFRESH MATERIALIZED VIEW CONCURRENTLY works
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_record_stats_pk
    ON mv_record_stats (
      ps_id, district_id, record_type, current_status, record_date
    );
  `);
}

export async function down(knex) {
  await knex.raw(`DROP MATERIALIZED VIEW IF EXISTS mv_record_stats;`);
  await knex.raw(`DROP INDEX IF EXISTS idx_records_data_gin;`);
  await knex.raw(`DROP INDEX IF EXISTS idx_records_ps_id;`);
  await knex.raw(`DROP INDEX IF EXISTS idx_records_district_id;`);
  await knex.raw(`DROP INDEX IF EXISTS idx_records_record_type;`);
  await knex.raw(`DROP INDEX IF EXISTS idx_records_status;`);
  await knex.raw(`DROP INDEX IF EXISTS idx_records_record_date;`);
}
