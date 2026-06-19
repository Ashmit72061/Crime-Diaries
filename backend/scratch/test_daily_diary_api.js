/**
 * Daily Diary API Comprehensive Test Suite
 * Tests: health, records-preview, export endpoints
 * Generates JWT directly to bypass auth credential issues.
 */
import jwt from 'jsonwebtoken';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────────────
const PORT = 3001;
const BASE = `http://localhost:${PORT}`;
const JWT_SECRET = 'pharos_jwt_secret_key_extremely_long_and_safe';

// Test users representing different roles
const TEST_USERS = {
  SYSTEM_ADMIN: {
    id: 'U_SA001', userId: 'U_SA001', username: 'system_admin',
    badge_no: 'SA001', badgeNo: 'SA001', name: 'System Admin',
    role: 'SYSTEM_ADMIN', level: 'HQ',
    ps_id: null, psId: null, district_id: null, districtId: null
  },
  HC: {
    id: 'U_HC001', userId: 'U_HC001', username: 'hc_parliament_street',
    badge_no: 'HC001', badgeNo: 'HC001', name: 'Ramesh Kumar',
    role: 'HC', level: 'PS',
    ps_id: 'PS_NDD_PARLIAMENTSTREET', psId: 'PS_NDD_PARLIAMENTSTREET',
    district_id: 'DIST_NDD', districtId: 'DIST_NDD'
  },
  DISTRICT_OFFICER: {
    id: 'U_DO001', userId: 'U_DO001', username: 'dcp_ndd',
    badge_no: 'DO001', badgeNo: 'DO001', name: 'Priya Sharma',
    role: 'DISTRICT_OFFICER', level: 'DISTRICT',
    ps_id: null, psId: null, district_id: 'DIST_NDD', districtId: 'DIST_NDD'
  }
};

function makeToken(userPayload) {
  return jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
}

// ── Result tracking ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const results = [];

function pass(name, detail = '') {
  passed++;
  results.push({ name, status: '✅ PASS', detail });
  console.log(`  ✅ PASS: ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
  failed++;
  results.push({ name, status: '❌ FAIL', detail });
  console.error(`  ❌ FAIL: ${name}${detail ? ' — ' + detail : ''}`);
}

// ── Tests ───────────────────────────────────────────────────────────────────────

async function testHealth() {
  console.log('\n── Test 1: Health Check ──');
  try {
    const res = await axios.get(`${BASE}/api/v1/health`);
    if (res.status === 200 && res.data.success) {
      pass('Health endpoint', `status=${res.status}`);
    } else {
      fail('Health endpoint', `Unexpected response: ${JSON.stringify(res.data)}`);
    }
  } catch (e) {
    fail('Health endpoint', e.response ? JSON.stringify(e.response.data) : e.message);
  }
}

async function testPreviewNoAuth() {
  console.log('\n── Test 2: Preview without auth (should 401) ──');
  try {
    await axios.get(`${BASE}/api/v1/daily-diary/records-preview`);
    fail('Preview no-auth guard', 'Expected 401 but got 200');
  } catch (e) {
    if (e.response && e.response.status === 401) {
      pass('Preview no-auth guard', 'Correctly returned 401');
    } else {
      fail('Preview no-auth guard', `Got status ${e.response?.status || 'N/A'}`);
    }
  }
}

async function testPreviewBadDate(token) {
  console.log('\n── Test 3: Preview with invalid date format ──');
  try {
    const res = await axios.get(`${BASE}/api/v1/daily-diary/records-preview?date=19-06-2026`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fail('Preview bad date validation', `Expected 400 but got ${res.status}`);
  } catch (e) {
    if (e.response && e.response.status === 400 && e.response.data.code === 'BAD_REQUEST') {
      pass('Preview bad date validation', 'Correctly returned 400 BAD_REQUEST');
    } else {
      fail('Preview bad date validation', `Got status ${e.response?.status || 'N/A'}: ${JSON.stringify(e.response?.data)}`);
    }
  }
}

async function testPreviewAsAdmin(token) {
  console.log('\n── Test 4: Preview as SYSTEM_ADMIN (today) ──');
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(`${BASE}/api/v1/daily-diary/records-preview?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 200 && res.data.success) {
      const d = res.data.data;
      pass('Preview as SYSTEM_ADMIN', `date=${d.date}, totalRecords=${d.totalRecordsFetched}, sheets=${Object.keys(d.sheetsPreview).length}`);
      return d;
    } else {
      fail('Preview as SYSTEM_ADMIN', JSON.stringify(res.data));
    }
  } catch (e) {
    fail('Preview as SYSTEM_ADMIN', e.response ? JSON.stringify(e.response.data) : e.message);
  }
  return null;
}

async function testPreviewAsHC(token) {
  console.log('\n── Test 5: Preview as HC (PS-level scope) ──');
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(`${BASE}/api/v1/daily-diary/records-preview?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 200 && res.data.success) {
      pass('Preview as HC', `totalRecords=${res.data.data.totalRecordsFetched}`);
    } else {
      fail('Preview as HC', JSON.stringify(res.data));
    }
  } catch (e) {
    fail('Preview as HC', e.response ? JSON.stringify(e.response.data) : e.message);
  }
}

async function testPreviewAsDO(token) {
  console.log('\n── Test 6: Preview as DISTRICT_OFFICER ──');
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(`${BASE}/api/v1/daily-diary/records-preview?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 200 && res.data.success) {
      pass('Preview as DISTRICT_OFFICER', `totalRecords=${res.data.data.totalRecordsFetched}`);
    } else {
      fail('Preview as DISTRICT_OFFICER', JSON.stringify(res.data));
    }
  } catch (e) {
    fail('Preview as DISTRICT_OFFICER', e.response ? JSON.stringify(e.response.data) : e.message);
  }
}

async function testPreviewDefaultDate(token) {
  console.log('\n── Test 7: Preview with no date param (defaults to today) ──');
  try {
    const res = await axios.get(`${BASE}/api/v1/daily-diary/records-preview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 200 && res.data.success) {
      const today = new Date().toISOString().split('T')[0];
      if (res.data.data.date === today) {
        pass('Preview default date', `Correctly defaulted to ${today}`);
      } else {
        fail('Preview default date', `Expected ${today}, got ${res.data.data.date}`);
      }
    } else {
      fail('Preview default date', JSON.stringify(res.data));
    }
  } catch (e) {
    fail('Preview default date', e.response ? JSON.stringify(e.response.data) : e.message);
  }
}

async function testExportNoAuth() {
  console.log('\n── Test 8: Export without auth (should 401) ──');
  try {
    await axios.get(`${BASE}/api/v1/daily-diary/export`);
    fail('Export no-auth guard', 'Expected 401 but got 200');
  } catch (e) {
    if (e.response && e.response.status === 401) {
      pass('Export no-auth guard', 'Correctly returned 401');
    } else {
      fail('Export no-auth guard', `Got status ${e.response?.status || 'N/A'}`);
    }
  }
}

async function testExportBadDate(token) {
  console.log('\n── Test 9: Export with invalid date format ──');
  try {
    const res = await axios.get(`${BASE}/api/v1/daily-diary/export?date=abc`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });
    fail('Export bad date validation', `Expected 400 but got ${res.status}`);
  } catch (e) {
    if (e.response && e.response.status === 400) {
      pass('Export bad date validation', 'Correctly returned 400');
    } else {
      fail('Export bad date validation', `Got status ${e.response?.status || 'N/A'}`);
    }
  }
}

async function testExportDownload(token) {
  console.log('\n── Test 10: Export download as SYSTEM_ADMIN ──');
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(`${BASE}/api/v1/daily-diary/export?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    if (res.status === 200) {
      // Verify content type
      const ct = res.headers['content-type'];
      const isXlsx = ct && ct.includes('openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Verify content disposition
      const cd = res.headers['content-disposition'];
      const hasFilename = cd && cd.includes('Daily_Diary_');
      
      // Verify file size > 0
      const size = res.data.byteLength;
      
      // Save the file
      const outputPath = path.join(__dirname, `Daily_Diary_Test_${today}.xlsx`);
      fs.writeFileSync(outputPath, Buffer.from(res.data));
      
      if (isXlsx && hasFilename && size > 0) {
        pass('Export download', `Content-Type OK, filename OK, size=${(size / 1024).toFixed(1)}KB, saved to ${outputPath}`);
      } else {
        fail('Export download', `Content-Type=${ct}, Disposition=${cd}, size=${size}`);
      }
      return outputPath;
    } else {
      fail('Export download', `Status: ${res.status}`);
    }
  } catch (e) {
    fail('Export download', e.response ? `Status ${e.response.status}: ${Buffer.from(e.response.data).toString()}` : e.message);
  }
  return null;
}

async function testExportFileValidation(filePath) {
  console.log('\n── Test 11: Validate downloaded Excel file ──');
  if (!filePath || !fs.existsSync(filePath)) {
    fail('Excel file validation', 'File not found');
    return;
  }
  try {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    
    const sheetCount = wb.worksheets.length;
    const sheetNames = wb.worksheets.map(ws => ws.name);
    
    if (sheetCount > 0) {
      pass('Excel file validation', `${sheetCount} worksheets found: ${sheetNames.slice(0, 5).join(', ')}${sheetCount > 5 ? '...' : ''}`);
    } else {
      fail('Excel file validation', 'No worksheets found in the file');
    }
  } catch (e) {
    fail('Excel file validation', e.message);
  }
}

async function testLegacyRoute(token) {
  console.log('\n── Test 12: Legacy route /api/daily-diary/records-preview ──');
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(`${BASE}/api/daily-diary/records-preview?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 200 && res.data.success) {
      pass('Legacy route (no /v1/)', 'Works correctly');
    } else {
      fail('Legacy route (no /v1/)', JSON.stringify(res.data));
    }
  } catch (e) {
    fail('Legacy route (no /v1/)', e.response ? JSON.stringify(e.response.data) : e.message);
  }
}

// ── Main Runner ─────────────────────────────────────────────────────────────────
async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Daily Diary API — Comprehensive Test Suite             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Generate JWT tokens for each role
  const adminToken = makeToken(TEST_USERS.SYSTEM_ADMIN);
  const hcToken = makeToken(TEST_USERS.HC);
  const doToken = makeToken(TEST_USERS.DISTRICT_OFFICER);

  // Boot the Express server
  const { default: app } = await import('../src/app.js');
  
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(PORT, () => {
      console.log(`\nTest server started on port ${PORT}\n`);
      resolve(s);
    });
    s.on('error', reject);
  });

  try {
    // Run all tests sequentially
    await testHealth();
    await testPreviewNoAuth();
    await testPreviewBadDate(adminToken);
    await testPreviewAsAdmin(adminToken);
    await testPreviewAsHC(hcToken);
    await testPreviewAsDO(doToken);
    await testPreviewDefaultDate(adminToken);
    await testExportNoAuth();
    await testExportBadDate(adminToken);
    const xlsxPath = await testExportDownload(adminToken);
    await testExportFileValidation(xlsxPath);
    await testLegacyRoute(adminToken);
  } catch (err) {
    console.error('\n⚠️  Unexpected error during test execution:', err.message);
  }

  // ── Summary ──
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  results.forEach(r => {
    console.log(`  ${r.status}  ${r.name}`);
  });

  // Cleanup
  server.close(() => console.log('\nServer shut down.'));
  const { default: db } = await import('../src/config/db.js');
  await db.destroy();
  console.log('Database connection closed.');
  
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
