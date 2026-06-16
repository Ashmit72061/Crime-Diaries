import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import { initDB, getDB } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Setup database paths
process.env.DB_PATH = path.resolve('database.test.sqlite');
const dbPath = process.env.DB_PATH;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  logger.info('Starting automated integration tests...');

  // Reset database for test consistency
  if (fs.existsSync(dbPath)) {
    logger.info('Deleting existing test database...');
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {
      logger.warn(`Could not delete sqlite file directly: ${e.message}`);
    }
  }

  // Initialize and seed database
  logger.info('Initializing and seeding database...');
  await initDB();

  // Boot server on a dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  logger.info(`Test server booted on ${baseUrl}`);

  let testsPassed = 0;
  let testsFailed = 0;

  const assert = (condition, message) => {
    if (condition) {
      testsPassed++;
      console.log(`[PASS] ${message}`);
    } else {
      testsFailed++;
      console.error(`[FAIL] ${message}`);
    }
  };

  const request = async (url, options = {}, cookie = '') => {
    const headers = {
      'Content-Type': 'application/json',
      ...(cookie ? { 'Cookie': cookie } : {}),
      ...options.headers
    };
    try {
      const res = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers
      });
      const setCookie = res.headers.get('set-cookie');
      let responseCookie = cookie;
      if (setCookie) {
        responseCookie = setCookie.split(';')[0];
      }
      
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : await res.text();
      return { status: res.status, data, cookie: responseCookie };
    } catch (err) {
      logger.error(`Request failed: ${err.message}`);
      return { status: 500, data: null, cookie };
    }
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Login Authentication
    // -------------------------------------------------------------
    logger.info('--- Running Test 1: Authentication ---');
    
    // Invalid credentials
    const badLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'ps_adarsh_nagar', password: 'wrongpassword' })
    });
    assert(badLogin.status === 401, 'Login should fail with invalid credentials (401)');

    // PS user login
    const psLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'ps_adarsh_nagar', password: 'password123' })
    });
    assert(psLogin.status === 200, 'Login should succeed for PS user (200)');
    assert(psLogin.data.success === true, 'Response body indicates success');
    assert(psLogin.cookie.includes('token='), 'Auth cookie should be returned');
    const psCookie = psLogin.cookie;

    // DCP user login
    const dcpLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'dcp_nwd', password: 'password123' })
    });
    assert(dcpLogin.status === 200, 'Login should succeed for DCP user (200)');
    const dcpCookie = dcpLogin.cookie;

    // HQ user login
    const hqLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'hq_user', password: 'password123' })
    });
    assert(hqLogin.status === 200, 'Login should succeed for HQ user (200)');
    const hqCookie = hqLogin.cookie;

    // Admin user login
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin_user', password: 'password123' })
    });
    assert(adminLogin.status === 200, 'Login should succeed for Admin user (200)');
    const adminCookie = adminLogin.cookie;

    // -------------------------------------------------------------
    // TEST 2: Scoped Record Creation and Retrieval (Draft Status)
    // -------------------------------------------------------------
    logger.info('--- Running Test 2: Case Record Creation & Draft Workflow ---');

    // Generate a unique date to prevent conflict with locked records
    const randMonth = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
    const randDay = String(Math.floor(10 + Math.random() * 18)).padStart(2, '0');
    const testDate = `2027-${randMonth}-${randDay}`;
    const testDateClean = `2027${randMonth}${randDay}`;

    // Create a Case (FIR) under PS Adarsh Nagar
    const newCasePayload = {
      recordDate: testDate,
      firNo: '102/2026',
      firDate: testDate,
      gdNo: 'GD-15B',
      gdDate: testDate,
      gdTime: '08:45',
      occurrenceDate: testDate,
      occurrencePlace: 'Outer Ring Road, near Adarsh Nagar Metro',
      briefFacts: 'Snatching of gold chain from complainant by two bike-borne assailants.',
      caseHeadId: 3, // ROBBERY (Sec 392 IPC)
      actName: 'IPC',
      sectionText: '392/34',
      complainantName: 'Meena Devi',
      complainantAddress: 'A-45, Adarsh Nagar, Delhi',
      accusedName: 'Unknown',
      accusedAddress: 'Unknown',
      ioName: 'SI Rakesh Kumar',
      ioPis: '28091100',
      ioMobile: '9999912345',
      propertyStatus: 'Stolen',
      status: 'Open',
      beatNo: 'Beat 3',
      cctnsFlag: true,
      submissionStatus: 'draft'
    };

    const caseCreateRes = await request('/records/cases', {
      method: 'POST',
      body: JSON.stringify(newCasePayload)
    }, psCookie);

    assert(caseCreateRes.status === 201, 'Case record should be created successfully (201)');
    const caseId = caseCreateRes.data.data.caseId;
    const caseUid = caseCreateRes.data.data.uid;
    assert(caseId !== undefined, `Case created with ID: ${caseId}`);
    assert(caseUid.startsWith(`CASE-NWD_ADARSH_NAGAR-${testDateClean}-`), `UID generated correctly: ${caseUid}`);

    // Retrieve cases as PS user
    const psGetCasesRes = await request('/records/cases', { method: 'GET' }, psCookie);
    assert(psGetCasesRes.status === 200, 'PS user can fetch operational cases');
    assert(psGetCasesRes.data.data.cases.length > 0, 'Fetched cases is not empty');

    // Update case details under draft status
    const updateCasePayload = {
      ...newCasePayload,
      gdNo: 'GD-15C',
      briefFacts: 'Snatching of gold chain from complainant. Updated facts: one suspect had a red helmet.',
      submissionStatus: 'draft'
    };
    const updateRes = await request(`/records/cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(updateCasePayload)
    }, psCookie);

    assert(updateRes.status === 200, 'PS user can update record under draft status (200)');
    assert(updateRes.data.data.case.gd_no === 'GD-15C', 'GD Number updated correctly');

    // -------------------------------------------------------------
    // TEST 3: Submission Locking
    // -------------------------------------------------------------
    logger.info('--- Running Test 3: Submission Locking ---');

    // Submit daily diary (set submissionStatus to submitted)
    const lockPayload = {
      ...updateCasePayload,
      submissionStatus: 'submitted'
    };
    const submitRes = await request(`/records/cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(lockPayload)
    }, psCookie);
    assert(submitRes.status === 200, 'PS user can submit the record to lock it (200)');

    // Verify submission status is 'submitted'
    const detailRes = await request(`/records/cases/${caseId}`, {}, psCookie);
    assert(detailRes.data.data.case.submission_status === 'submitted', 'Record state changed to submitted');

    // Attempt to update the locked record (should fail with 403)
    const badUpdatePayload = {
      ...lockPayload,
      gdNo: 'GD-15D'
    };
    const badUpdateRes = await request(`/records/cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(badUpdatePayload)
    }, psCookie);
    assert(badUpdateRes.status === 403, 'Edit lock enforces edit protection (403)');
    assert(badUpdateRes.data.message.includes('locked'), 'Error message contains appropriate context');

    // -------------------------------------------------------------
    // TEST 4: Scoping Calculations and Access Control
    // -------------------------------------------------------------
    logger.info('--- Running Test 4: Scoping & Geographic Bounds Validation ---');

    // ACP NWD 1 retrieval (should succeed since Adarsh Nagar is in NWD Sub-Div 1)
    const acpLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'acp_nwd_1', password: 'password123' })
    });
    const acpCookie = acpLogin.cookie;
    
    const acpGetRes = await request(`/records/cases/${caseId}`, {}, acpCookie);
    assert(acpGetRes.status === 200, 'ACP of subdivision can view subdivision cases');

    // DCP NWD retrieval (should succeed)
    const dcpGetRes = await request(`/records/cases/${caseId}`, {}, dcpCookie);
    assert(dcpGetRes.status === 200, 'DCP of district can view district cases');

    // HQ retrieval (should succeed)
    const hqGetRes = await request(`/records/cases/${caseId}`, {}, hqCookie);
    assert(hqGetRes.status === 200, 'HQ can view all cases');

    // -------------------------------------------------------------
    // TEST 5: DCP Override & Justification Reason Logging
    // -------------------------------------------------------------
    logger.info('--- Running Test 5: DCP Classification Override & Audit Logging ---');

    // PS user tries to override (should fail with 403)
    const psOverrideRes = await request(`/records/cases/${caseId}/override`, {
      method: 'PATCH',
      body: JSON.stringify({ caseHeadId: 1, reason: 'Illegal upgrade attempt' })
    }, psCookie);
    assert(psOverrideRes.status === 403, 'PS user is restricted from overriding classifications (403)');

    // DCP overrides with brief justification (should fail - reason too short)
    const shortOverrideRes = await request(`/records/cases/${caseId}/override`, {
      method: 'PATCH',
      body: JSON.stringify({ caseHeadId: 1, reason: 'Short' })
    }, dcpCookie);
    assert(shortOverrideRes.status === 400, 'DCP override fails if justification is too short (400)');

    // DCP overrides with valid justification
    const overrideReason = 'Incident upgraded to murder following victim death at hospital.';
    const goodOverrideRes = await request(`/records/cases/${caseId}/override`, {
      method: 'PATCH',
      body: JSON.stringify({ caseHeadId: 1, reason: overrideReason }) // 1 = MURDER
    }, dcpCookie);
    
    assert(goodOverrideRes.status === 200, 'DCP can override case head with valid justification (200)');
    assert(goodOverrideRes.data.data.case.case_head_dcp_override === 1, 'Case head override set to MURDER');

    // Retrieve case details and check audit log & active class code
    const overriddenDetail = await request(`/records/cases/${caseId}`, {}, dcpCookie);
    assert(overriddenDetail.data.data.case.override_code === 'MURDER', 'Overridden code displays correct designation');
    
    const logs = overriddenDetail.data.data.auditLogs;
    const overrideLog = logs.find(l => l.action === 'override');
    assert(overrideLog !== undefined, 'Audit log created for classification override');
    assert(overrideLog.reason === overrideReason, 'Justification reason correctly logged in audit trails');
    assert(overrideLog.username === 'dcp_nwd', 'Audit trail lists correct DCP actor');

    // -------------------------------------------------------------
    // TEST 6: Admin Custom Fields Creator (Dynamic EAV Schema)
    // -------------------------------------------------------------
    logger.info('--- Running Test 6: Dynamic EAV Custom Field Creation ---');

    const customFieldPayload = {
      module: 'cases',
      fieldKey: 'stolen_mobile_imei',
      fieldLabel: 'Stolen Mobile IMEI',
      fieldType: 'text',
      isRequired: 0,
      scopeLevel: 'district',
      scopeId: 'NWD'
    };

    const cfCreateRes = await request('/admin/custom-fields', {
      method: 'POST',
      body: JSON.stringify(customFieldPayload)
    }, adminCookie);

    assert(cfCreateRes.status === 201, 'Admin can create EAV custom field definitions (201)');

    // Fetch custom fields for cases in NWD
    const cfGetRes = await request('/admin/custom-fields/ps?module=cases', {}, psCookie);
    assert(cfGetRes.status === 200, 'Operational users can list custom fields');
    const definedField = cfGetRes.data.data.customFields.find(f => f.fieldKey === 'stolen_mobile_imei');
    assert(definedField !== undefined, 'Custom field definition propagated successfully');

    // -------------------------------------------------------------
    // TEST 7: Analytics Calculations
    // -------------------------------------------------------------
    logger.info('--- Running Test 7: Analytics Calculations ---');

    const summaryRes = await request('/analytics/summary', {}, hqCookie);
    assert(summaryRes.status === 200, 'Analytics summary loads correctly');
    assert(summaryRes.data.data.summary.cases >= 1, 'Analytics correctly counts submitted records');

    const trendRes = await request('/analytics/trends?recordType=cases', {}, hqCookie);
    assert(trendRes.status === 200, 'Analytics trend loads correctly');
    assert(trendRes.data.data.trends.length > 0, 'Analytics trends returns entries');

    const compareRes = await request('/analytics/compare?recordType=cases', {}, hqCookie);
    assert(compareRes.status === 200, 'Analytics comparisons loads correctly');
    
    // -------------------------------------------------------------
    // TEST 8: Excel Export
    // -------------------------------------------------------------
    logger.info('--- Running Test 8: Excel Export Generation ---');

    const exportRes = await request('/analytics/export?recordType=cases', {}, hqCookie);
    assert(exportRes.status === 200, 'Excel export returns success status (200)');
    assert(exportRes.data.length > 0, 'Excel file binary payload returned');

    // -------------------------------------------------------------
    // COMPLETED
    // -------------------------------------------------------------
    logger.info('--------------------------------------------');
    logger.info(`Verification finished. Passed: ${testsPassed}, Failed: ${testsFailed}`);
    logger.info('--------------------------------------------');

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    logger.error(`Test execution crashed: ${error.message} \n ${error.stack}`);
    process.exit(1);
  } finally {
    server.close();
  }
}

runTests();
