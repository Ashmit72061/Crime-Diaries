// backend/scratch/test_reports_flow.js
// Integration test suite for report generation, filtering, and export
import axios from 'axios';
import db from '../src/config/db.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import ExcelJS from 'exceljs';
import knex from 'knex';
import knexConfig from '../knexfile.js';

const testPort = 39998;
const baseURL = `http://localhost:${testPort}/api/v1`;

async function run() {
  console.log('[Test] Starting automated reports integration verification...');

  process.env.PORT = testPort;
  process.env.NODE_ENV = 'development';
  process.env.PHAROS_TEST = 'true';

  const { default: app } = await import('../src/app.js');

  let server;
  try {
    server = app.listen(testPort);
    console.log(`[Test] Server booted on port ${testPort}`);
  } catch (err) {
    console.error('[Test] Failed to boot test server:', err.message);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`[PASS] ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] ${description}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate
    let hcRes;
    try {
      hcRes = await axios.post(`${baseURL}/auth/login`, { badge_no: 'HC001', password: 'Test@1234' });
    } catch (e) {
      if (e.response && e.response.status === 401) {
        console.log('[Test] Password Test@1234 failed, trying test123...');
        hcRes = await axios.post(`${baseURL}/auth/login`, { badge_no: 'HC001', password: 'test123' });
      } else {
        throw e;
      }
    }
    assert(hcRes.status === 200, 'HC login succeeds');
    const token = hcRes.data.data.accessToken;

    // 2. Insert mock records for testing filters
    console.log('\n--- Setup: Seeding Case and Arrest records for filtering tests ---');
    await db('records').whereIn('id', ['MOCK_CASE_1', 'MOCK_CASE_2', 'MOCK_ARREST_1']).del();
    
    // CASE 1: In range (Parliament Street, 2026-06-10)
    await db('records').insert({
      id: 'MOCK_CASE_1',
      record_type: 'CASE',
      ps_id: 'PS_NDD_PARLIAMENTSTREET',
      district_id: 'DIST_NDD',
      record_date: '2026-06-10',
      current_status: 'DRAFT',
      current_level: 'PS',
      data: JSON.stringify({
        fir_no: 'FIR-0010-2026',
        fir_date: '2026-06-10',
        gd_no: 'GD-10A',
        occurrence_place: 'Parliament Street Market',
        complainant_name: 'Anoop Kumar',
        local_head: 'Simple Hurt',
        brief_facts: 'A brief scuffle occurred at the market.'
      }),
      created_by: 'U_HC001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // CASE 2: Out of range (Parliament Street, 2026-05-10)
    await db('records').insert({
      id: 'MOCK_CASE_2',
      record_type: 'CASE',
      ps_id: 'PS_NDD_PARLIAMENTSTREET',
      district_id: 'DIST_NDD',
      record_date: '2026-05-10',
      current_status: 'DRAFT',
      current_level: 'PS',
      data: JSON.stringify({
        fir_no: 'FIR-0005-2026',
        fir_date: '2026-05-10',
        gd_no: 'GD-05A',
        occurrence_place: 'Parliament Street Sub-station',
        complainant_name: 'Rakesh Verma',
        local_head: 'Snatching',
        brief_facts: 'Chain snatching reported near sub-station.'
      }),
      created_by: 'U_HC001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // ARREST 1: In range (Parliament Street, 2026-06-12)
    await db('records').insert({
      id: 'MOCK_ARREST_1',
      record_type: 'ARREST',
      ps_id: 'PS_NDD_PARLIAMENTSTREET',
      district_id: 'DIST_NDD',
      record_date: '2026-06-12',
      current_status: 'DRAFT',
      current_level: 'PS',
      data: JSON.stringify({
        arrested_name: 'Surender Singh',
        arrest_date: '2026-06-12',
        arrest_place: 'Janpath Crossing',
        crime_head: 'Other IPC',
        status: 'released',
        io_name: 'ASI Hari Prasad'
      }),
      created_by: 'U_HC001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('[Setup] Seeded 2 mock cases and 1 mock arrest.');

    // 3. Test list templates
    console.log('\n--- Test 3: GET /reports/templates ---');
    const templatesRes = await axios.get(`${baseURL}/reports/templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(templatesRes.status === 200, 'Get templates succeeds');
    const hasTemplates = templatesRes.data.data.templates.length > 0;
    assert(hasTemplates, 'Templates list is not empty');

    // 4. Generate Predefined Cases Register Report (with date and complainant filters)
    console.log('\n--- Test 4: POST /reports/generate (Predefined Report with filters) ---');
    const genPredefinedRes = await axios.post(`${baseURL}/reports/generate`, {
      template_id: 'cases-register',
      filters: {
        date_from: '2026-06-01',
        date_to: '2026-06-20',
        ps_id: 'PS_NDD_PARLIAMENTSTREET',
        complainant_name: 'Anoop Kumar'
      },
      format: 'EXCEL'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert(genPredefinedRes.status === 201, 'Generate predefined job returns status 201');
    const jobIdPredefined = genPredefinedRes.data.data.job_id;
    assert(jobIdPredefined !== undefined, 'Predefined job ID is returned');
    assert(genPredefinedRes.data.data.status === 'PENDING', 'Job status is PENDING initially');

    // 5. Generate Custom Report (with filtering on specific table fields)
    console.log('\n--- Test 5: POST /reports/generate (Custom Report with filters) ---');
    const genCustomRes = await axios.post(`${baseURL}/reports/generate`, {
      custom_definition: {
        title_en: 'Custom Case Filter Test',
        sheets: [
          {
            record_type: 'CASE',
            field_keys: ['fir_no', 'fir_date', 'complainant_name', 'local_head']
          }
        ]
      },
      filters: {
        date_from: '2026-06-01',
        date_to: '2026-06-20',
        ps_id: 'PS_NDD_PARLIAMENTSTREET',
        local_head: 'Simple Hurt'
      },
      format: 'EXCEL'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert(genCustomRes.status === 201, 'Generate custom job returns status 201');
    const jobIdCustom = genCustomRes.data.data.job_id;
    assert(jobIdCustom !== undefined, 'Custom job ID is returned');

    // Shutdown Node server and release primary Knex connection pool to prevent SQLite locking
    console.log('\n[Test] Releasing SQLite connection pool and shutting down test server...');
    server.close();
    await db.destroy();

    // 6. Invoke Python generator in isolation to process jobs
    console.log('\n--- Test 6: Invoking Python Worker generator locally for jobs ---');
    try {
      console.log(`[Worker] Generating report for Predefined Job: ${jobIdPredefined}`);
      execSync(`python -c "import sys; sys.path.append('../../python_worker'); from generator import generate_report; generate_report('${jobIdPredefined}')"`, { cwd: path.resolve('./scratch') });
      console.log(`[Worker] Generating report for Custom Job: ${jobIdCustom}`);
      execSync(`python -c "import sys; sys.path.append('../../python_worker'); from generator import generate_report; generate_report('${jobIdCustom}')"`, { cwd: path.resolve('./scratch') });
      assert(true, 'Python worker report generator execution runs without syntax/runtime errors');
    } catch (e) {
      console.error('[WorkerError] Python worker script call failed:', e.message);
      assert(false, 'Python worker report generator execution succeeds');
    }

    // 7. Check job statuses and verify contents directly from database using a new connection
    console.log('\n--- Test 7: Direct DB Verification of statuses and files ---');
    const db2 = knex(knexConfig.development);
    
    const jobPredefined = await db2('report_jobs').where({ id: jobIdPredefined }).first();
    assert(jobPredefined !== undefined, 'Predefined report job found in DB');
    assert(jobPredefined.status === 'READY', 'Predefined report status updated to READY');

    const jobCustom = await db2('report_jobs').where({ id: jobIdCustom }).first();
    assert(jobCustom !== undefined, 'Custom report job found in DB');
    assert(jobCustom.status === 'READY', 'Custom report status updated to READY');

    // 8. Excel content verification
    console.log('\n--- Test 8: Excel file content validation ---');
    assert(fs.existsSync(jobPredefined.file_path), 'Predefined report Excel file exists on disk');

    const outWorkbook = new ExcelJS.Workbook();
    await outWorkbook.xlsx.readFile(jobPredefined.file_path);
    const outWorksheet = outWorkbook.getWorksheet(1);
    
    // Check Header Details
    const row1Val = outWorksheet.getRow(1).getCell(1).value;
    assert(String(row1Val).includes('Cases Register'), 'Header row 1 title contains correct report name');

    // Row 5 is header, data rows start at row 6
    // We should only have 1 data row (MOCK_CASE_1, 2026-06-10), while MOCK_CASE_2 (2026-05-10) is filtered out
    let dataRows = [];
    outWorksheet.eachRow((row, rowIdx) => {
      if (rowIdx >= 6) {
        let cells = [];
        row.eachCell({ includeEmpty: true }, cell => {
          cells.push(cell.value);
        });
        if (cells.length > 0 && cells.some(c => c !== null)) {
          dataRows.push(cells);
        }
      }
    });

    console.log('[Test] Extracted data rows from report spreadsheet:', JSON.stringify(dataRows, null, 2));
    assert(dataRows.length === 1, 'Date filtering verified: only 1 case is present in the 2026-06 date range');
    assert(dataRows[0].some(c => String(c).includes('FIR-0010-2026')), 'FIR number verified in compiled spreadsheet row');
    assert(dataRows[0].some(c => String(c).includes('Anoop Kumar')), 'Complainant name verified in compiled spreadsheet row');

    // Clean up
    await db2('records').whereIn('id', ['MOCK_CASE_1', 'MOCK_CASE_2', 'MOCK_ARREST_1']).del();
    console.log('[Cleanup] Mock database records deleted successfully.');
    await db2.destroy();
    
    console.log(`\n===================================================`);
    console.log(`  Phase 3 Reports Verification completed. Passed: ${passed}, Failed: ${failed}`);
    console.log(`===================================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('[Test] All Phase 3 Reports filtering and export checks passed!');
      process.exit(0);
    }

  } catch (err) {
    console.error('[Test] Unexpected crash during test execution:', err.message, err.response?.data || err);
    process.exit(1);
  }
}

run();
