/**
 * Daily Diary — end-to-end report verification + CSV export.
 *
 *  1. Boots the Express app on a test port.
 *  2. Exercises the live HTTP APIs: GET /records-preview and GET /export (xlsx).
 *  3. Generates ALL 34 reports as individual CSV files into scratch/daily-diary-csv/.
 *  4. Prints a coverage summary (rows per report, flags any empty report).
 *
 * Usage: node scratch/export_daily_diary_csv.js [YYYY-MM-DD]
 */
import jwt from 'jsonwebtoken';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DATE = process.argv[2] || '2026-06-19';
const PORT = 3011;
const BASE = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'pharos_jwt_secret_key_extremely_long_and_safe';
const OUT_DIR = path.join(__dirname, 'daily-diary-csv');

const ADMIN = {
  id: 'U_SA001', userId: 'U_SA001', username: 'system_admin', badge_no: 'SA001', badgeNo: 'SA001',
  name: 'System Admin', role: 'SYSTEM_ADMIN', level: 'HQ',
  ps_id: null, psId: null, district_id: null, districtId: null
};
const token = jwt.sign(ADMIN, JWT_SECRET, { expiresIn: '1h' });

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log(`  PASS  ${m}`); };
const no = (m) => { fail++; console.error(`  FAIL  ${m}`); };

// Minimal RFC-4180 CSV escaping.
function csvCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Array.from(rows.reduce((set, r) => { Object.keys(r).forEach(k => set.add(k)); return set; }, new Set()));
  const lines = [headers.map(csvCell).join(',')];
  for (const r of rows) lines.push(headers.map(h => csvCell(r[h])).join(','));
  return lines.join('\r\n');
}

async function run() {
  console.log('==============================================================');
  console.log(`  Daily Diary report verification + CSV export — ${TEST_DATE}`);
  console.log('==============================================================\n');

  const { default: app } = await import('../src/app.js');
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(PORT, () => resolve(s));
    s.on('error', reject);
  });
  console.log(`Test server up on ${BASE}\n`);

  let previewData = null;
  try {
    // ── 1. Preview API ──────────────────────────────────────────────────────
    console.log('── HTTP API: GET /api/v1/daily-diary/records-preview ──');
    const pv = await axios.get(`${BASE}/api/v1/daily-diary/records-preview?date=${TEST_DATE}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (pv.status === 200 && pv.data.success) {
      previewData = pv.data.data;
      ok(`preview: date=${previewData.date}, totalRecords=${previewData.totalRecordsFetched}, sheets=${Object.keys(previewData.sheetsPreview).length}`);
    } else {
      no(`preview unexpected response: ${JSON.stringify(pv.data)}`);
    }

    // ── 2. Export API (xlsx) ─────────────────────────────────────────────────
    console.log('\n── HTTP API: GET /api/v1/daily-diary/export (xlsx) ──');
    const ex = await axios.get(`${BASE}/api/v1/daily-diary/export?date=${TEST_DATE}`, {
      headers: { Authorization: `Bearer ${token}` }, responseType: 'arraybuffer', timeout: 60000
    });
    const ct = ex.headers['content-type'] || '';
    const isXlsx = ct.includes('spreadsheetml.sheet');
    const size = ex.data.byteLength;
    if (ex.status === 200 && isXlsx && size > 0) {
      const xlsxPath = path.join(OUT_DIR, `Daily_Diary_${TEST_DATE}.xlsx`);
      fs.mkdirSync(OUT_DIR, { recursive: true });
      fs.writeFileSync(xlsxPath, Buffer.from(ex.data));
      ok(`export xlsx: ${(size / 1024).toFixed(1)}KB saved -> ${path.relative(process.cwd(), xlsxPath)}`);
    } else {
      no(`export xlsx bad: status=${ex.status} ct=${ct} size=${size}`);
    }

    // ── 3. Negative checks ───────────────────────────────────────────────────
    console.log('\n── HTTP API: guard checks ──');
    try {
      await axios.get(`${BASE}/api/v1/daily-diary/export`);
      no('no-auth export should be 401');
    } catch (e) { e.response?.status === 401 ? ok('no-auth export -> 401') : no(`no-auth export -> ${e.response?.status}`); }
    try {
      await axios.get(`${BASE}/api/v1/daily-diary/export?date=bad`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'arraybuffer' });
      no('bad-date export should be 400');
    } catch (e) { e.response?.status === 400 ? ok('bad-date export -> 400') : no(`bad-date export -> ${e.response?.status}`); }

    // ── 4. Per-report CSV generation (via service mapping) ────────────────────
    console.log('\n── CSV export: all 34 reports ──');
    const svc = await import('../src/modules/daily-diary/daily-diary.service.js');
    const records = await svc.getDailyDiaryData(TEST_DATE, {}, ADMIN);
    const sheets = svc.mapRecordsToSheets(records, ADMIN);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const keys = Object.keys(sheets);
    const summary = [];
    keys.forEach((key, i) => {
      const rows = sheets[key];
      const num = String(i + 1).padStart(2, '0');
      const fileName = `${num}_${key.replace(/^excel_\d+/, '').replace(/^_/, '') || key}.csv`;
      const filePath = path.join(OUT_DIR, fileName);
      fs.writeFileSync(filePath, toCsv(rows));
      summary.push({ report: key, rows: rows.length, file: fileName });
    });

    const populated = summary.filter(s => s.rows > 0).length;
    ok(`generated ${keys.length} CSV files -> ${path.relative(process.cwd(), OUT_DIR)}/ (${populated}/${keys.length} populated)`);

    // ── 5. Coverage table ────────────────────────────────────────────────────
    console.log('\n── Coverage (rows per report) ──');
    summary.forEach(s => {
      const flag = s.rows > 0 ? ' ' : '!';
      console.log(`  ${flag} ${String(s.rows).padStart(3)}  ${s.file}`);
    });
    const empties = summary.filter(s => s.rows === 0);
    if (empties.length) {
      console.log(`\n  NOTE: ${empties.length} report(s) had 0 rows: ${empties.map(e => e.report).join(', ')}`);
    } else {
      console.log('\n  All 34 reports populated with sample data.');
    }
  } catch (err) {
    no(`unexpected error: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
    console.error(err.stack);
  } finally {
    console.log('\n==============================================================');
    console.log(`  RESULT: ${pass} passed, ${fail} failed`);
    console.log('==============================================================');
    server.close();
    const { default: db } = await import('../src/config/db.js');
    await db.destroy();
    process.exit(fail > 0 ? 1 : 0);
  }
}

run().catch((e) => { console.error('Fatal:', e); process.exit(1); });
