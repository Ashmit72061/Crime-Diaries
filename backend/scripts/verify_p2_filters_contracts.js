// Set test environment path BEFORE any imports
process.env.PHAROS_TEST = 'true';
process.env.PORT = '39997';
process.env.NODE_ENV = 'development';

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import db from '../src/config/db.js';

async function run() {
  console.log('[Test P2] Starting automated verification of Level Contracts and Filter Engine...');

  const { default: app } = await import('../src/app.js');
  const eventBus = await import('../src/events/eventBus.js');
  const auditHandler = await import('../src/events/handlers/auditHandler.js');
  
  await eventBus.connect();
  await auditHandler.init();
  
  // Clean up database tables for test isolation
  await db('level_data_contracts').del();
  
  const server = app.listen(39997);
  const localBaseURL = 'http://localhost:39997/api/v1';

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
    // 1. Log in
    const saLogin = await axios.post(`${localBaseURL}/auth/login`, { badge_no: 'SA001', password: 'test123' });
    const saToken = saLogin.data.data.accessToken;
    console.log('[Test P2] System Admin logged in');

    const hcLogin = await axios.post(`${localBaseURL}/auth/login`, { badge_no: 'HC001', password: 'test123' });
    const hcToken = hcLogin.data.data.accessToken;
    console.log('[Test P2] Head Constable logged in');

    const doLogin = await axios.post(`${localBaseURL}/auth/login`, { badge_no: 'DO001', password: 'test123' });
    const doToken = doLogin.data.data.accessToken;
    console.log('[Test P2] District Officer logged in');

    // 2. Create records
    console.log('\n--- Creating test records as HC ---');
    const case1 = await axios.post(`${localBaseURL}/records`, {
      record_type: 'CASES',
      record_date: '2026-06-17',
      data: {
        fir_no: 'FIR-CONTRACT-1',
        fir_date: '2026-06-17',
        gd_no: 'GD-A1',
        gd_date: '2026-06-17',
        gd_time: '12:00',
        occurrence_date: '2026-06-17',
        occurrence_place: 'Janakpuri',
        case_head: 'ROBBERY',
        brief_facts: 'Very confidential details that should be masked.',
        complainant_name: 'Vipul Shah',
        complainant_address: 'Delhi 110058',
        io_name: 'ASI Naveen',
        io_pis: 'PIS-9821'
      }
    }, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    const case1Id = case1.data.data.id;
    assert(case1Id !== undefined, 'Case 1 created successfully');

    // Submit it so it goes up
    await axios.put(`${localBaseURL}/records/${case1Id}/submit`, {}, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    
    // Log in as SHO to approve and send to DISTRICT_REVIEW
    const shoLogin = await axios.post(`${localBaseURL}/auth/login`, { badge_no: 'SHO001', password: 'test123' });
    const shoToken = shoLogin.data.data.accessToken;
    await axios.post(`${localBaseURL}/records/${case1Id}/approve`, { comment: 'Approved' }, {
      headers: { Authorization: `Bearer ${shoToken}` }
    });

    // 3. Verify that District Officer sees the full record BEFORE the contract is added
    const detailsBeforeContract = await axios.get(`${localBaseURL}/records/${case1Id}`, {
      headers: { Authorization: `Bearer ${doToken}` }
    });
    assert(detailsBeforeContract.data.data.record.data.complainant_name === 'Vipul Shah', 'District Officer sees complainant name before contract restricts it');
    assert(detailsBeforeContract.data.data.record.data.brief_facts === 'Very confidential details that should be masked.', 'District Officer sees brief facts before contract restricts it');

    // 4. Create Level Data Contract as SA
    console.log('\n--- Creating Level Data Contract (restricts to only fir_no, fir_date, and occurrence_place) ---');
    const contractRes = await axios.post(`${localBaseURL}/level-contracts`, {
      from_level: 'PS',
      to_level: 'DISTRICT',
      record_type: 'CASES',
      visible_field_keys: ['fir_no', 'fir_date', 'occurrence_place', 'case_head']
    }, {
      headers: { Authorization: `Bearer ${saToken}` }
    });
    assert(contractRes.status === 201, 'Level contract created successfully');

    // 5. Verify that District Officer's record view is now MASKED
    console.log('\n--- Checking field masking during record retrieval ---');
    const detailsAfterContract = await axios.get(`${localBaseURL}/records/${case1Id}`, {
      headers: { Authorization: `Bearer ${doToken}` }
    });
    const recordData = detailsAfterContract.data.data.record.data;
    assert(recordData.fir_no === 'FIR-CONTRACT-1', 'Visible field fir_no is present');
    assert(recordData.occurrence_place === 'Janakpuri', 'Visible field occurrence_place is present');
    assert(recordData.complainant_name === undefined || recordData.complainant_name === null, 'Complainant Name is correctly masked (omitted)');
    assert(recordData.brief_facts === undefined || recordData.brief_facts === null, 'Confidential brief facts are correctly masked (omitted)');

    // 6. Test Filter Engine Search
    console.log('\n--- Testing Filter Engine criteria query (POST /records/search) ---');
    const searchRes = await axios.post(`${localBaseURL}/records/search`, {
      record_type: 'CASES',
      filter_spec: {
        logic: 'AND',
        conditions: [
          { field: 'case_head', operator: 'EQ', value: 'ROBBERY' },
          { field: 'occurrence_place', operator: 'CONTAINS', value: 'Janak' }
        ]
      }
    }, {
      headers: { Authorization: `Bearer ${doToken}` }
    });
    assert(searchRes.status === 200, 'Search request succeeds');
    assert(searchRes.data.data.cases.length > 0, 'Robbery cases in Janakpuri are found');
    assert(searchRes.data.data.cases[0].data.complainant_name === undefined, 'Search results are also masked appropriately');

    // 7. Preset CRUD Verification
    console.log('\n--- Testing Filter Presets CRUD ---');
    const listPresets = await axios.get(`${localBaseURL}/filters/presets`, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    assert(listPresets.status === 200, 'List presets succeeds');
    assert(listPresets.data.data.some(p => p.name_en === "Today's FIRs"), 'Default system preset is included');

    const createdPreset = await axios.post(`${localBaseURL}/filters/presets`, {
      name_en: 'Robberies in Janakpuri',
      name_hi: 'जनकपुरी में डकैती',
      scope: 'USER',
      filter_spec: {
        logic: 'AND',
        conditions: [
          { field: 'case_head', operator: 'EQ', value: 'ROBBERY' }
        ]
      }
    }, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    const presetId = createdPreset.data.data.id;
    assert(presetId !== undefined, 'Filter preset created successfully');

    // Delete preset
    const deleteRes = await axios.delete(`${localBaseURL}/filters/presets/${presetId}`, {
      headers: { Authorization: `Bearer ${hcToken}` }
    });
    assert(deleteRes.status === 200, 'Filter preset deleted successfully');

  } catch (error) {
    console.error('[Test P2] Verification failed:', error.message, error.response?.data);
    failed++;
  } finally {
    server.close();
    console.log('\n[Test P2] Test server closed.');
    console.log(`===================================================`);
    console.log(`  P2 Verification completed. Passed: ${passed}, Failed: ${failed}`);
    console.log(`===================================================`);
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

run();
