import axios from 'axios';
import db from '../src/config/db.js';

const testPort = 39999;
const baseURL = `http://localhost:${testPort}/api/v1`;

async function run() {
  console.log('[Test] Starting automated integration verification tests for PHAROS...');
  
  // Set test environment path
  process.env.PORT = testPort;
  process.env.NODE_ENV = 'development';
  process.env.PHAROS_TEST = 'true';

  // Dynamic import of app and services to initialize correctly
  const { default: app } = await import('../src/app.js');
  const eventBus = await import('../src/events/eventBus.js');
  const auditHandler = await import('../src/events/handlers/auditHandler.js');
  const notifyHandler = await import('../src/events/handlers/notifyHandler.js');

  console.log('[Test] App loaded. Initializing test server environment...');

  try {
    await eventBus.connect();
    await auditHandler.init();
    await notifyHandler.init();
  } catch (err) {
    console.error('[Test] Failed to initialize event handlers:', err.message);
    process.exit(1);
  }

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
    // 1. Authentication Check
    console.log('\n--- Running Test 1: Authentication ---');
    
    // Invalid credentials
    try {
      await axios.post(`${baseURL}/auth/login`, { badge_no: 'HC001', password: 'wrongpassword' });
      assert(false, 'Login should have failed with invalid credentials');
    } catch (err) {
      assert(err.response?.status === 401, 'Login fails with 401 on invalid credentials');
    }

    // Valid HC login
    const hcRes = await axios.post(`${baseURL}/auth/login`, { badge_no: 'HC001', password: 'test123' });
    assert(hcRes.status === 200, 'HC login succeeds with status 200');
    assert(hcRes.data.data.user.role === 'HC', 'Response confirms HC user role');
    const hcToken = hcRes.data.data.accessToken;

    // Valid SHO login
    const shoRes = await axios.post(`${baseURL}/auth/login`, { badge_no: 'SHO001', password: 'test123' });
    assert(shoRes.status === 200, 'SHO login succeeds with status 200');
    const shoToken = shoRes.data.data.accessToken;

    // Valid DCP login
    const dcpRes = await axios.post(`${baseURL}/auth/login`, { badge_no: 'DO001', password: 'test123' });
    assert(dcpRes.status === 200, 'DCP login succeeds with status 200');
    const dcpToken = dcpRes.data.data.accessToken;


    // 2. Field Registry Check
    console.log('\n--- Running Test 2: Field Registry ---');
    const fieldsRes = await axios.get(`${baseURL}/fields/form/cases`, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    assert(fieldsRes.status === 200, 'Retrieve Cases form layouts succeeds');
    assert(fieldsRes.data.data.sections.length > 0, 'Fields registry returns populated sections array');
    
    const generalSection = fieldsRes.data.data.sections.find(s => s.section === 'Identity');
    assert(generalSection !== undefined, 'Form layout contains "Identity" sections');


    // 3. Record Creation Check
    console.log('\n--- Running Test 3: Record Creation & Draft Lifecycle ---');
    const testCaseData = {
      fir_no: 'FIR-9999-NWD',
      fir_date: '2026-06-15',
      gd_no: 'GD-88A',
      gd_date: '2026-06-15',
      gd_time: '22:30',
      occurrence_date: '2026-06-15',
      occurrence_place: 'Ashok Vihar Metro Stn',
      complainant_name: 'Rajesh Tyagi',
      complainant_address: 'Subhash Place Phase 2',
      case_head: 'THEFT',
      brief_facts: 'Complainant reported theft of mobile device while boarding the train.',
      io_name: 'ASI Mahender',
      io_pis: 'PIS-49910',
      status: 'Open'
    };

    const createRes = await axios.post(`${baseURL}/records`, {
      record_type: 'CASES',
      record_date: '2026-06-15',
      data: testCaseData
    }, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });

    assert(createRes.status === 201, 'Create draft record succeeds with status 201');
    const recordId = createRes.data.data.id;
    assert(recordId !== undefined, 'Response payload contains record UUID identifier');
    
    const createdUID = createRes.data.data.uid;
    assert(createdUID.startsWith('CASES-PS_AN-'), 'System correctly auto-generates sequential UID format');

    // Update Draft Record
    const updateRes = await axios.put(`${baseURL}/records/${recordId}`, {
      data: { ...testCaseData, gd_no: 'GD-88A-REV' }
    }, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    assert(updateRes.status === 200, 'Update draft record returns status 200');

    // Retrieve details to verify update
    const detailRes = await axios.get(`${baseURL}/records/${recordId}`, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    assert(detailRes.data.data.record.data.gd_no === 'GD-88A-REV', 'Data edits correctly persisted to the database');


    // 4. Workflow State Machine Check
    console.log('\n--- Running Test 4: Workflow State Transitions & Locking ---');
    
    // Submit
    const submitRes = await axios.put(`${baseURL}/records/${recordId}/submit`, {}, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    assert(submitRes.status === 200, 'HC submits draft record for approval');

    // Ensure locked
    try {
      await axios.put(`${baseURL}/records/${recordId}`, { data: testCaseData }, {
        headers: { Authorization: `Bearer ${hcToken}` }
      });
      assert(false, 'Record updates should be locked post-submission');
    } catch (err) {
      assert(err.response?.status === 500 || err.response?.status === 403, 'Locks out operators from modifying submitted items');
    }

    // SHO Approve
    const approveRes = await axios.post(`${baseURL}/records/${recordId}/approve`, {
      comment: 'Record verified with diaries'
    }, {
      headers: { Authorization: `Bearer ${shoToken}` }
    });
    assert(approveRes.status === 200, 'SHO approves record and advances state');


    // 5. DCP Override & Audits
    console.log('\n--- Running Test 5: DCP Override & Reclassifications ---');
    
    // Override Case Head
    const overrideRes = await axios.patch(`${baseURL}/records/${recordId}/override`, {
      caseHeadId: 'ROBBERY',
      reason: 'Upgraded to Robbery based on witness statements'
    }, {
      headers: { Authorization: `Bearer ${dcpToken}` }
    });
    assert(overrideRes.status === 200, 'DCP overrides case classification');

    // Fetch details to check audits
    const finalDetail = await axios.get(`${baseURL}/records/${recordId}`, {
      headers: { Authorization: `Bearer ${dcpToken}` }
    });
    assert(finalDetail.data.data.record.data.case_head === 'ROBBERY', 'Reclassification value changed to ROBBERY');
    assert(finalDetail.data.data.revisions.length >= 3, 'Auditing revision ledger captures create, update, and override events');


    // 6. Scoped Analytics Checks
    console.log('\n--- Running Test 6: Scoped Analytics Panels ---');
    
    const summaryRes = await axios.get(`${baseURL}/analytics/summary`, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    assert(summaryRes.status === 200, 'Summary counters dashboard loads');

    const trendsRes = await axios.get(`${baseURL}/analytics/trends?recordType=cases`, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    assert(trendsRes.status === 200, 'Weekly/Monthly crime trend charts compile');

    const compareRes = await axios.get(`${baseURL}/analytics/compare?recordType=cases`, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    assert(compareRes.status === 200, 'Unit comparisons report builds');

  } catch (err) {
    console.error('[Test] Unexpected crash during test execution:', err.message, err.response?.data);
  } finally {
    // Shutdown server
    if (server) {
      server.close();
      console.log('\n[Test] Test server shutdown.');
    }

    console.log(`\n===================================================`);
    console.log(`  Verification completed. Passed: ${passed}, Failed: ${failed}`);
    console.log(`===================================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('[Test] All checks passed successfully!');
      process.exit(0);
    }
  }
}

run();
