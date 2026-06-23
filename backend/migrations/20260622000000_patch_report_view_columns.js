import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL does not allow CREATE OR REPLACE VIEW to change existing column
// positions or names. We must drop and recreate report views when adding
// new columns (ps_id, district_id, date_of_occurrence, date_of_arrest).
const REPORT_VIEWS = [
  'rpt_01_manual_fir',
  'rpt_02_e_burglary_cases',
  'rpt_03_e_house_theft_cases',
  'rpt_04_e_other_theft_cases',
  'rpt_05_mvt_cases',
  'rpt_07_arrested_east_district',
  'rpt_08_arrested_kalandara',
  'rpt_09_arrested_efir_theft',
  'rpt_10_arrested_efir_mv_theft',
  'rpt_11_proclaimed_offenders',
  'rpt_13_arrested_24hrs_list',
  'rpt_14_pi_disposal_manual',
  'rpt_15_pi_disposal_e_property',
  'rpt_16_pi_disposal_e_mvt',
  'rpt_18_missing_persons',
  'rpt_19_uidb',
  'rpt_20_abandoned_persons',
  'rpt_21_traced_persons',
  'rpt_25_inquest_registered',
  'rpt_26_inquest_acp_sdm_disposal',
];

export async function up(knex) {
  if (knex.client.config.client === 'sqlite3') return;

  // Drop existing report views so CREATE OR REPLACE VIEW can freely reorder columns
  for (const view of REPORT_VIEWS) {
    await knex.raw(`DROP VIEW IF EXISTS ?? CASCADE`, [view]);
  }

  // Recreate all views with ps_id + district_id (+ date_of_occurrence / date_of_arrest)
  const viewsSql = fs.readFileSync(
    path.resolve(__dirname, '../../Master/files/03_views.sql'),
    'utf8'
  );
  await knex.raw(viewsSql);
}

export async function down(knex) {
  // Dropping report views is safe — they can be recreated by re-running up().
}
